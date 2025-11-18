/**
 * Collect and analyze QC feedback
 * 
 * Processes feedback from QC reviews and generates improvement suggestions
 */

import * as fs from 'fs';
import * as path from 'path';

interface FeedbackItem {
  itemId: string;
  itemName: string;
  dataType: string;
  issue: 'missing_data' | 'incorrect_data' | 'false_positive' | 'formatting' | 'other';
  description: string;
  expectedValue?: string;
  actualValue?: string;
  suggestedFix?: string;
  timestamp: string;
}

interface FeedbackAnalysis {
  totalFeedback: number;
  byIssueType: Record<string, number>;
  byDataType: Record<string, number>;
  commonPatterns: PatternIssue[];
  suggestedImprovements: Improvement[];
}

interface PatternIssue {
  pattern: string;
  count: number;
  examples: FeedbackItem[];
}

interface Improvement {
  priority: 'high' | 'medium' | 'low';
  dataType: string;
  issue: string;
  suggestedChange: string;
  affectedFiles: string[];
}

/**
 * Load feedback from various sources
 */
function loadFeedback(feedbackDir: string): FeedbackItem[] {
  const feedback: FeedbackItem[] = [];
  
  // Load from JSON files
  if (fs.existsSync(feedbackDir)) {
    const files = fs.readdirSync(feedbackDir);
    for (const file of files) {
      if (file.endsWith('-feedback.json')) {
        const filePath = path.join(feedbackDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(data)) {
          feedback.push(...data);
        } else {
          feedback.push(data);
        }
      }
    }
  }
  
  // Load from localStorage backup (if available)
  const localStorageFile = path.join(feedbackDir, 'localStorage-backup.json');
  if (fs.existsSync(localStorageFile)) {
    const data = JSON.parse(fs.readFileSync(localStorageFile, 'utf-8'));
    if (Array.isArray(data)) {
      feedback.push(...data);
    }
  }
  
  return feedback;
}

/**
 * Analyze feedback and generate improvement suggestions
 */
function analyzeFeedback(feedback: FeedbackItem[]): FeedbackAnalysis {
  const byIssueType: Record<string, number> = {};
  const byDataType: Record<string, number> = {};
  const patternMap: Record<string, FeedbackItem[]> = {};
  
  for (const item of feedback) {
    // Count by issue type
    byIssueType[item.issue] = (byIssueType[item.issue] || 0) + 1;
    
    // Count by data type
    byDataType[item.dataType] = (byDataType[item.dataType] || 0) + 1;
    
    // Group by pattern (simplified - look for common keywords)
    const pattern = extractPattern(item);
    if (!patternMap[pattern]) {
      patternMap[pattern] = [];
    }
    patternMap[pattern].push(item);
  }
  
  // Find common patterns (appearing 3+ times)
  const commonPatterns: PatternIssue[] = Object.entries(patternMap)
    .filter(([, items]) => items.length >= 3)
    .map(([pattern, items]) => ({
      pattern,
      count: items.length,
      examples: items.slice(0, 5), // Top 5 examples
    }))
    .sort((a, b) => b.count - a.count);
  
  // Generate improvement suggestions
  const improvements = generateImprovements(feedback, commonPatterns);
  
  return {
    totalFeedback: feedback.length,
    byIssueType,
    byDataType,
    commonPatterns,
    suggestedImprovements: improvements,
  };
}

/**
 * Extract pattern from feedback item
 */
function extractPattern(item: FeedbackItem): string {
  const desc = item.description.toLowerCase();
  
  // Common patterns
  if (desc.includes('missing')) return 'missing_data';
  if (desc.includes('incorrect') || desc.includes('wrong')) return 'incorrect_data';
  if (desc.includes('false positive') || desc.includes('should not')) return 'false_positive';
  if (desc.includes('format') || desc.includes('structure')) return 'formatting';
  
  // Field-specific patterns
  if (desc.includes('material component')) return 'missing_material_components';
  if (desc.includes('higher level')) return 'missing_higher_level';
  if (desc.includes('trait') || desc.includes('action')) return 'incomplete_traits_actions';
  if (desc.includes('stat') || desc.includes('ability score')) return 'missing_stats';
  
  return 'other';
}

/**
 * Generate improvement suggestions based on feedback
 */
function generateImprovements(
  feedback: FeedbackItem[],
  patterns: PatternIssue[]
): Improvement[] {
  const improvements: Improvement[] = [];
  
  // Analyze by data type and issue
  const byDataTypeAndIssue: Record<string, Record<string, FeedbackItem[]>> = {};
  
  for (const item of feedback) {
    if (!byDataTypeAndIssue[item.dataType]) {
      byDataTypeAndIssue[item.dataType] = {};
    }
    if (!byDataTypeAndIssue[item.dataType][item.issue]) {
      byDataTypeAndIssue[item.dataType][item.issue] = [];
    }
    byDataTypeAndIssue[item.dataType][item.issue].push(item);
  }
  
  // Generate improvements for each data type
  for (const [dataType, issues] of Object.entries(byDataTypeAndIssue)) {
    // Missing data improvements
    if (issues.missing_data && issues.missing_data.length >= 3) {
      const missingFields = extractMissingFields(issues.missing_data);
      improvements.push({
        priority: 'high',
        dataType,
        issue: 'missing_data',
        suggestedChange: `Add extraction patterns for missing fields: ${missingFields.join(', ')}`,
        affectedFiles: [`scripts/extract-from-pdfs.ts`, `scripts/extract-enhanced-content.ts`],
      });
    }
    
    // False positive improvements
    if (issues.false_positive && issues.false_positive.length >= 2) {
      improvements.push({
        priority: 'high',
        dataType,
        issue: 'false_positive',
        suggestedChange: 'Add context validation to ensure items are only extracted from appropriate sections. Add false positive filters.',
        affectedFiles: [`scripts/extract-from-pdfs.ts`],
      });
    }
    
    // Formatting improvements
    if (issues.formatting && issues.formatting.length >= 3) {
      improvements.push({
        priority: 'medium',
        dataType,
        issue: 'formatting',
        suggestedChange: 'Improve data normalization: separate material components, normalize whitespace, extract higher level descriptions.',
        affectedFiles: [`scripts/extract-from-pdfs.ts`],
      });
    }
  }
  
  // Pattern-specific improvements
  for (const pattern of patterns) {
    if (pattern.count >= 5) {
      const examples = pattern.examples;
      const dataType = examples[0].dataType;
      
      improvements.push({
        priority: pattern.count >= 10 ? 'high' : 'medium',
        dataType,
        issue: pattern.pattern,
        suggestedChange: `Fix pattern affecting ${pattern.count} items. Examples: ${examples.map(e => e.itemName).join(', ')}`,
        affectedFiles: [`scripts/extract-from-pdfs.ts`],
      });
    }
  }
  
  return improvements.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Extract missing field names from feedback
 */
function extractMissingFields(feedback: FeedbackItem[]): string[] {
  const fields = new Set<string>();
  
  for (const item of feedback) {
    if (item.expectedValue) {
      // Try to extract field names from expected value
      const matches = item.expectedValue.match(/(\w+):\s*['"]/g);
      if (matches) {
        for (const match of matches) {
          const field = match.split(':')[0];
          fields.add(field);
        }
      }
    }
    
    // Also check description
    const descMatches = item.description.match(/missing\s+(\w+)/gi);
    if (descMatches) {
      for (const match of descMatches) {
        const field = match.replace(/missing\s+/i, '').trim();
        if (field.length > 2) {
          fields.add(field);
        }
      }
    }
  }
  
  return Array.from(fields);
}

/**
 * Generate improvement report
 */
function generateReport(analysis: FeedbackAnalysis, outputFile: string): void {
  const report = `# QC Feedback Analysis Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Feedback Items**: ${analysis.totalFeedback}
- **Issue Types**: ${Object.keys(analysis.byIssueType).length}
- **Data Types Affected**: ${Object.keys(analysis.byDataType).length}
- **Common Patterns**: ${analysis.commonPatterns.length}
- **Suggested Improvements**: ${analysis.suggestedImprovements.length}

## Feedback by Issue Type

${Object.entries(analysis.byIssueType)
  .map(([type, count]) => `- **${type}**: ${count} (${Math.round((count / analysis.totalFeedback) * 100)}%)`)
  .join('\n')}

## Feedback by Data Type

${Object.entries(analysis.byDataType)
  .map(([type, count]) => `- **${type}**: ${count} (${Math.round((count / analysis.totalFeedback) * 100)}%)`)
  .join('\n')}

## Common Patterns

${analysis.commonPatterns
  .map(
    (pattern, i) => `
### Pattern ${i + 1}: ${pattern.pattern}

**Occurrences**: ${pattern.count}

**Examples**:
${pattern.examples
  .map(
    (ex, j) => `
${j + 1}. **${ex.itemName}** (${ex.dataType})
   - Issue: ${ex.issue}
   - Description: ${ex.description}
   ${ex.suggestedFix ? `- Suggested Fix: ${ex.suggestedFix}` : ''}
`
  )
  .join('')}
`
  )
  .join('')}

## Suggested Improvements

${analysis.suggestedImprovements
  .map(
    (imp, i) => `
### ${i + 1}. [${imp.priority.toUpperCase()}] ${imp.dataType} - ${imp.issue}

**Priority**: ${imp.priority}

**Affected Files**:
${imp.affectedFiles.map(f => `- ${f}`).join('\n')}

**Suggested Change**:
${imp.suggestedChange}
`
  )
  .join('')}

## Next Steps

1. Review high-priority improvements
2. Update extraction patterns in affected files
3. Re-run extraction on test sources
4. Compare before/after results
5. Iterate until quality threshold met

## Implementation Priority

1. **High Priority** (${analysis.suggestedImprovements.filter(i => i.priority === 'high').length} items)
   - Address false positives
   - Fix missing critical data
   - Resolve incorrect data issues

2. **Medium Priority** (${analysis.suggestedImprovements.filter(i => i.priority === 'medium').length} items)
   - Improve formatting
   - Add missing optional fields
   - Enhance validation

3. **Low Priority** (${analysis.suggestedImprovements.filter(i => i.priority === 'low').length} items)
   - Minor formatting improvements
   - Edge case handling
`;

  fs.writeFileSync(outputFile, report);
  console.log(`Analysis report generated: ${outputFile}`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const feedbackDir = args[0] || 'data/free5e/qc-feedback';
  const outputFile = args[1] || 'data/free5e/qc-analysis-report.md';
  
  console.log('Loading feedback...');
  const feedback = loadFeedback(feedbackDir);
  console.log(`Loaded ${feedback.length} feedback items`);
  
  if (feedback.length === 0) {
    console.log('No feedback found. Run QC review first to generate feedback.');
    return;
  }
  
  console.log('Analyzing feedback...');
  const analysis = analyzeFeedback(feedback);
  
  console.log('Generating report...');
  generateReport(analysis, outputFile);
  
  // Also save JSON for programmatic use
  const jsonFile = outputFile.replace('.md', '.json');
  fs.writeFileSync(jsonFile, JSON.stringify(analysis, null, 2));
  console.log(`JSON analysis saved: ${jsonFile}`);
}

if (require.main === module) {
  main();
}

export { loadFeedback, analyzeFeedback };
export type { FeedbackAnalysis, Improvement };

