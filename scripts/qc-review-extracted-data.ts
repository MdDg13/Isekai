/**
 * Quality Control Review Script
 * 
 * Generates a review report showing extracted data with:
 * - Source file and page references
 * - Extracted data
 * - Source text context
 * - Quality scores
 * - Ability to flag issues and provide feedback
 */

import * as fs from 'fs';
import * as path from 'path';

interface QCReport {
  timestamp: string;
  dataType: string;
  totalItems: number;
  items: QCItem[];
}

interface QCItem {
  id: string;
  name: string;
  source: string;
  pageReference?: string;
  extractedData: Record<string, unknown>;
  sourceText?: string;
  sourceContext?: string;
  confidenceScore?: number;
  issues?: string[];
  feedback?: string;
}

interface FeedbackItem {
  itemId: string;
  itemName: string;
  dataType: string;
  issue: 'missing_data' | 'incorrect_data' | 'false_positive' | 'formatting' | 'other';
  description: string;
  expectedValue?: string;
  actualValue?: string;
  sourceText?: string;
  suggestedFix?: string;
}

/**
 * Generate QC report for a data type
 */
function generateQCReport(
  dataType: 'spell' | 'monster' | 'item' | 'feat' | 'class' | 'subclass' | 'race',
  dataFile: string,
  sourceTextDir?: string
): QCReport {
  if (!fs.existsSync(dataFile)) {
    throw new Error(`Data file not found: ${dataFile}`);
  }
  const fileContent = fs.readFileSync(dataFile, 'utf-8').replace(/^\uFEFF/, '');
  if (!fileContent || fileContent.trim().length === 0) {
    throw new Error(`Data file is empty: ${dataFile}`);
  }
  const data = JSON.parse(fileContent);
  const items: QCItem[] = [];
  
  // Sample items for review (top 10 by confidence, bottom 10 by confidence, random 10)
  const sortedByConfidence = [...data].sort((a: any, b: any) => {
    const scoreA = a.extraction_confidence_score || 0;
    const scoreB = b.extraction_confidence_score || 0;
    return scoreB - scoreA;
  });
  
  const topItems = sortedByConfidence.slice(0, 5);
  const bottomItems = sortedByConfidence.slice(-5);
  const randomItems = sortedByConfidence
    .filter((_: any, i: number) => i > 4 && i < sortedByConfidence.length - 5)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);
  
  const reviewItems = [...topItems, ...bottomItems, ...randomItems];
  
  for (const item of reviewItems) {
    const qcItem: QCItem = {
      id: `${dataType}_${item.name}_${item.source}`.replace(/[^a-zA-Z0-9_]/g, '_'),
      name: item.name,
      source: item.source,
      pageReference: item.page_reference,
      extractedData: item,
      confidenceScore: item.extraction_confidence_score,
    };
    
    // Try to find source text if sourceTextDir is provided
    if (sourceTextDir) {
      const sourceFile = findSourceFile(item.source, sourceTextDir);
      if (sourceFile) {
        const sourceText = fs.readFileSync(sourceFile, 'utf-8');
        qcItem.sourceText = extractRelevantText(sourceText, item.name, dataType);
        qcItem.sourceContext = extractContext(sourceText, item.name, dataType);
      }
    }
    
    items.push(qcItem);
  }
  
  return {
    timestamp: new Date().toISOString(),
    dataType,
    totalItems: data.length,
    items,
  };
}

/**
 * Find source file for a given source reference
 */
function findSourceFile(source: string, sourceTextDir?: string): string | null {
  if (!sourceTextDir || !fs.existsSync(sourceTextDir)) {
    return null;
  }
  
  // Source format: "filename.pdf" or "subfolder/filename.pdf"
  const sourcePath = path.join(sourceTextDir, source);
  if (fs.existsSync(sourcePath)) {
    return sourcePath;
  }
  
  // Try to find in subdirectories
  try {
    const files = fs.readdirSync(sourceTextDir, { recursive: true, withFileTypes: true });
    const sourceBaseName = path.basename(source);
    for (const file of files) {
      if (file.isFile() && file.name.includes(sourceBaseName)) {
        const fullPath = path.join(file.path || sourceTextDir, file.name);
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }
    }
  } catch (error) {
    // Directory might not be readable or might not support recursive
    console.warn(`Warning: Could not search ${sourceTextDir} recursively: ${error}`);
  }
  
  return null;
}

/**
 * Extract relevant text around the item name
 */
function extractRelevantText(sourceText: string, itemName: string, dataType: string): string {
  const namePattern = new RegExp(itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const match = sourceText.search(namePattern);
  
  if (match === -1) {
    return 'Source text not found';
  }
  
  // Extract 2000 characters before and after
  const start = Math.max(0, match - 2000);
  const end = Math.min(sourceText.length, match + 2000);
  return sourceText.substring(start, end);
}

/**
 * Extract context (wider view) around the item
 */
function extractContext(sourceText: string, itemName: string, dataType: string): string {
  const namePattern = new RegExp(itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const match = sourceText.search(namePattern);
  
  if (match === -1) {
    return 'Source text not found';
  }
  
  // Extract 5000 characters before and after for context
  const start = Math.max(0, match - 5000);
  const end = Math.min(sourceText.length, match + 5000);
  return sourceText.substring(start, end);
}

/**
 * Generate HTML report for review
 */
function generateHTMLReport(report: QCReport, outputFile: string): void {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>QC Report: ${report.dataType}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #2c3e50;
      color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .item {
      background: white;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3498db;
    }
    .item-name {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }
    .confidence {
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      background: #ecf0f1;
    }
    .confidence.high { background: #2ecc71; color: white; }
    .confidence.medium { background: #f39c12; color: white; }
    .confidence.low { background: #e74c3c; color: white; }
    .section {
      margin: 15px 0;
    }
    .section-title {
      font-weight: bold;
      color: #34495e;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .data-field {
      margin: 8px 0;
      padding: 8px;
      background: #f8f9fa;
      border-left: 3px solid #3498db;
    }
    .data-label {
      font-weight: bold;
      color: #555;
      margin-right: 10px;
    }
    .source-text {
      background: #fff3cd;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #ffc107;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      white-space: pre-wrap;
      max-height: 400px;
      overflow-y: auto;
    }
    .feedback-form {
      margin-top: 20px;
      padding: 15px;
      background: #e8f4f8;
      border-radius: 5px;
    }
    .feedback-form textarea {
      width: 100%;
      min-height: 100px;
      padding: 10px;
      border: 1px solid #bdc3c7;
      border-radius: 3px;
      font-family: Arial, sans-serif;
    }
    .feedback-form select {
      padding: 8px;
      border: 1px solid #bdc3c7;
      border-radius: 3px;
      margin-bottom: 10px;
    }
    .btn {
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 14px;
    }
    .btn:hover {
      background: #2980b9;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: white;
      padding: 15px;
      border-radius: 5px;
      flex: 1;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #3498db;
    }
    .stat-label {
      color: #7f8c8d;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Quality Control Report: ${report.dataType.toUpperCase()}</h1>
    <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    <p>Total Items: ${report.totalItems} | Reviewing: ${report.items.length}</p>
  </div>
  
  <div class="stats">
    <div class="stat-box">
      <div class="stat-value">${report.totalItems}</div>
      <div class="stat-label">Total Extracted</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${report.items.length}</div>
      <div class="stat-label">Items in Review</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${Math.round(report.items.reduce((sum, item) => sum + (item.confidenceScore || 0), 0) / report.items.length)}</div>
      <div class="stat-label">Avg Confidence</div>
    </div>
  </div>
  
  ${report.items.map((item, index) => `
    <div class="item" id="item-${index}">
      <div class="item-header">
        <div class="item-name">${item.name}</div>
        <div class="confidence ${getConfidenceClass(item.confidenceScore || 0)}">
          Confidence: ${item.confidenceScore || 'N/A'}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Source Information</div>
        <div class="data-field">
          <span class="data-label">Source:</span> ${item.source}
        </div>
        ${item.pageReference ? `<div class="data-field"><span class="data-label">Page:</span> ${item.pageReference}</div>` : ''}
      </div>
      
      <div class="section">
        <div class="section-title">Extracted Data</div>
        ${Object.entries(item.extractedData)
          .filter(([key]) => !['source', 'page_reference', 'extraction_confidence_score'].includes(key))
          .map(([key, value]) => `
            <div class="data-field">
              <span class="data-label">${key}:</span>
              <span>${formatValue(value)}</span>
            </div>
          `).join('')}
      </div>
      
      ${item.sourceText ? `
        <div class="section">
          <div class="section-title">Source Text (Relevant Section)</div>
          <div class="source-text">${escapeHtml(item.sourceText)}</div>
        </div>
      ` : ''}
      
      <div class="feedback-form">
        <div class="section-title">Feedback</div>
        <form onsubmit="submitFeedback(event, '${item.id}', '${report.dataType}')">
          <select name="issue" required>
            <option value="">Select Issue Type</option>
            <option value="missing_data">Missing Data</option>
            <option value="incorrect_data">Incorrect Data</option>
            <option value="false_positive">False Positive</option>
            <option value="formatting">Formatting Issue</option>
            <option value="other">Other</option>
          </select>
          <textarea name="description" placeholder="Describe the issue..." required></textarea>
          <textarea name="expectedValue" placeholder="Expected value (if applicable)"></textarea>
          <textarea name="actualValue" placeholder="Actual value (if applicable)"></textarea>
          <textarea name="suggestedFix" placeholder="Suggested fix or improvement"></textarea>
          <button type="submit" class="btn">Submit Feedback</button>
        </form>
      </div>
    </div>
  `).join('')}
  
  <script>
    function submitFeedback(event, itemId, dataType) {
      event.preventDefault();
      const form = event.target;
      const feedback = {
        itemId,
        itemName: form.closest('.item').querySelector('.item-name').textContent,
        dataType,
        issue: form.issue.value,
        description: form.description.value,
        expectedValue: form.expectedValue.value,
        actualValue: form.actualValue.value,
        suggestedFix: form.suggestedFix.value,
        timestamp: new Date().toISOString()
      };
      
      // Save to feedback file
      fetch('/api/qc-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      }).then(() => {
        alert('Feedback submitted!');
        form.reset();
      }).catch(err => {
        console.error('Error submitting feedback:', err);
        // Fallback: save to localStorage
        const existing = JSON.parse(localStorage.getItem('qc-feedback') || '[]');
        existing.push(feedback);
        localStorage.setItem('qc-feedback', JSON.stringify(existing));
        alert('Feedback saved locally (will sync when API is available)');
      });
    }
    
    function getConfidenceClass(score) {
      if (score >= 80) return 'high';
      if (score >= 50) return 'medium';
      return 'low';
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(outputFile, html);
  console.log(`QC report generated: ${outputFile}`);
}

function getConfidenceClass(score: number): string {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: qc-review <dataType> [dataFile] [sourceTextDir] [outputDir]');
    console.error('Example: qc-review spell data/free5e/processed/spells-final.json Downloads data/free5e/qc-reports');
    process.exit(1);
  }
  
  const dataType = args[0] as 'spell' | 'monster' | 'item' | 'feat' | 'class' | 'subclass' | 'race';
  const dataFile = args[1] || `data/free5e/processed/${dataType}s-final.json`;
  const sourceTextDir = args[2] || 'Downloads';
  const outputDir = args[3] || 'data/free5e/qc-reports';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`Generating QC report for ${dataType}...`);
  console.log(`Data file: ${dataFile}`);
  console.log(`Source text dir: ${sourceTextDir}`);
  
  try {
    const report = generateQCReport(dataType, dataFile, sourceTextDir);
    const jsonFile = path.join(outputDir, `${dataType}-qc-report.json`);
    const htmlFile = path.join(outputDir, `${dataType}-qc-report.html`);
    
    fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));
    generateHTMLReport(report, htmlFile);
    
    console.log(`\nQC Report Complete:`);
    console.log(`  JSON: ${jsonFile}`);
    console.log(`  HTML: ${htmlFile}`);
    console.log(`\nReview ${report.items.length} items out of ${report.totalItems} total`);
  } catch (error) {
    console.error(`Error generating QC report: ${error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generateQCReport, QCReport, QCItem, FeedbackItem };

