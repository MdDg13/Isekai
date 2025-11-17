# Quality Control Process

This document describes the quality control process for reviewing and improving extracted data.

## Overview

The QC process consists of:
1. **Generate QC Reports** - Create reviewable reports with extracted data and source context
2. **Review Data** - Human reviewers check extracted data against source PDFs
3. **Collect Feedback** - Structured feedback is collected on issues found
4. **Analyze Feedback** - Automated analysis identifies patterns and suggests improvements
5. **Improve Extraction** - Update extraction patterns based on feedback
6. **Iterate** - Repeat until quality threshold is met

## Step 1: Generate QC Reports

Generate a QC report for a specific data type:

```bash
npm run qc-review spell data/free5e/processed/spells-final.json Downloads data/free5e/qc-reports
```

This creates:
- `spells-qc-report.json` - Structured data for programmatic processing
- `spells-qc-report.html` - Interactive HTML report for human review

The report includes:
- Top 5 items by confidence score
- Bottom 5 items by confidence score
- 5 random items for sampling
- Source text context for each item
- Feedback forms for each item

## Step 2: Review Data

1. Open the HTML report in a browser
2. For each item:
   - Compare extracted data to source PDF
   - Check for missing fields
   - Verify accuracy of values
   - Note any formatting issues
   - Identify false positives

3. Fill out feedback form for items with issues:
   - Select issue type
   - Describe the problem
   - Provide expected value (if applicable)
   - Suggest fixes

## Step 3: Collect Feedback

Feedback is collected in two ways:

### Method 1: Via API (Preferred)
- Feedback is submitted through the QC report interface
- Stored in `data/free5e/qc-feedback/` directory
- Each feedback item saved as JSON

### Method 2: Manual Collection
- Export feedback from browser localStorage (if API unavailable)
- Save to `data/free5e/qc-feedback/localStorage-backup.json`

## Step 4: Analyze Feedback

Run analysis on collected feedback:

```bash
npm run qc-analyze data/free5e/qc-feedback data/free5e/qc-analysis-report.md
```

This generates:
- `qc-analysis-report.md` - Human-readable analysis
- `qc-analysis-report.json` - Structured data for automation

The analysis includes:
- Summary statistics
- Feedback grouped by issue type and data type
- Common patterns identified
- Prioritized improvement suggestions

## Step 5: Improve Extraction

Based on feedback analysis:

1. **High Priority Issues**:
   - Fix false positives (add context validation)
   - Add missing critical fields (update extraction patterns)
   - Correct incorrect data (refine regex patterns)

2. **Medium Priority Issues**:
   - Improve formatting (normalize data)
   - Add missing optional fields
   - Enhance validation

3. **Low Priority Issues**:
   - Minor formatting improvements
   - Edge case handling

### Example: Fixing Missing Material Components

**Feedback Pattern**: "Missing material_components field"

**Fix**:
1. Update `parseSpellsFromPDF` in `scripts/extract-from-pdfs.ts`
2. Add pattern to extract material components from components field:
   ```typescript
   // Extract material components if M is present
   if (componentsMatch && componentsMatch[1].includes('M')) {
     const materialMatch = text.match(/Material Components?[:\s]+([^\n]+)/i);
     if (materialMatch) {
       spell.material_components = materialMatch[1].trim();
     }
   }
   ```
3. Re-run extraction
4. Verify improvement

## Step 6: Iterate

1. Re-run extraction on same sources
2. Generate new QC report
3. Compare before/after metrics
4. Continue until quality threshold met

## Quality Metrics

Track these metrics:
- **Completeness**: % of required fields populated
- **Accuracy**: % of fields with correct values
- **False Positive Rate**: % of extractions that shouldn't exist
- **False Negative Rate**: % of items that should exist but weren't extracted
- **Confidence Score Accuracy**: Correlation between confidence scores and actual quality

## Examples

See `docs/QC_EXAMPLES.md` for:
- Examples of good extractions
- Examples of bad extractions
- Feedback format examples
- Improvement strategies

## Automation

Future automation could include:
- Automated pattern suggestion based on feedback
- Test suite generation from feedback
- Regression testing before/after changes
- Confidence score calibration based on feedback

## Best Practices

1. **Review Diverse Samples**: Include high, low, and random confidence items
2. **Provide Specific Feedback**: Include expected values and suggested fixes
3. **Track Patterns**: Group similar issues to identify systemic problems
4. **Prioritize Fixes**: Address high-impact issues first
5. **Verify Improvements**: Always re-test after making changes

