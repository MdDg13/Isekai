# Data Extraction Quality Improvements

## Overview
Refined the extraction process to ensure high-quality data that matches or aligns with 5etools standards. The improvements focus on:
1. **Reducing false positives** through better pattern matching
2. **Validating data quality** during extraction
3. **Cross-referencing with known patterns** (5etools-compatible)
4. **Comprehensive validation** after extraction

## Improvements Made

### 1. Enhanced Pattern Matching

#### Spells
- **Improved regex**: More specific character class `[A-Za-z\s'-]{2,50}` to avoid matching table headers
- **False positive filtering**: Excludes common table/section headers (Table, Chapter, Section, etc.)
- **Minimum name length**: Increased from 2 to 3 characters
- **School validation**: Only accepts known spell schools (abjuration, conjuration, etc.)
- **Casting time validation**: Requires valid format (action, bonus action, reaction, minute, hour, day)
- **Description quality**: Minimum 30 characters to filter out incomplete entries

#### Items
- **Improved regex**: More specific pattern with character limits
- **False positive filtering**: Excludes table headers and metadata
- **Data validation**: Validates cost (0-1,000,000 gp) and weight (0-10,000 lb)
- **Quality checks**: Requires at least cost, weight, or substantial description

#### Traps
- **Improved pattern**: More specific DeviousTraps format matching
- **False positive filtering**: Excludes generic "The Traps" headers
- **Minimum name length**: Increased from 5 to 8 characters
- **DC validation**: Ensures DC is between 1-30
- **Threat level validation**: Only accepts setback, dangerous, or deadly
- **Description quality**: Minimum 60 characters

#### Puzzles
- **Improved pattern**: More specific Tasha's Cauldron format matching
- **False positive filtering**: Expanded to catch short words (to, or, is, not, the, etc.)
- **Minimum name length**: Increased from 3 to 5 characters
- **Difficulty validation**: Only accepts easy, medium, or hard
- **Description quality**: Minimum 60 characters

### 2. Inline Validation

All parsing functions now include:
- **Field validation**: Checks for required fields and valid formats
- **Range validation**: Ensures numeric values are within expected ranges
- **Format validation**: Validates casting times, ranges, components, etc.
- **Quality thresholds**: Minimum description lengths and data completeness

### 3. Comprehensive Validation Script

Created `scripts/validate-extracted-data.ts` that:
- **Validates against schema**: Checks all required fields
- **Validates against known patterns**: Uses 5etools-compatible patterns
- **Quality scoring**: Assigns 0-100 score based on completeness and correctness
- **Error reporting**: Identifies invalid entries and low-quality data
- **Detailed reports**: Generates JSON reports with full validation results

## Validation Results

### Current Data Quality

**Traps**: 100% valid (4 total)
- All entries pass validation
- Average score: 100/100

**Puzzles**: 95% valid (210 total, 10 invalid)
- Most invalid entries are false positives with very short names
- Average score: 89/100
- 80% have warnings (mostly missing structured sections)

### Known Issues

1. **False Positives**: Some very short words (to, or, is, not, the) are still being captured
   - **Solution**: Enhanced false positive filtering with expanded short word list
   - **Status**: Fixed in latest extraction patterns

2. **Missing Structured Sections**: Some puzzles/traps lack trigger/effect/solution sections
   - **Impact**: Low - these are warnings, not errors
   - **Solution**: Continue refining extraction patterns to capture structured sections

3. **Truncated Descriptions**: Some entries may have truncated descriptions
   - **Impact**: Low - validation flags these as warnings
   - **Solution**: Improve block boundary detection in extraction patterns

## 5etools Compatibility

The validation script checks against patterns commonly found in 5etools:
- **Spell schools**: All 8 standard schools
- **Spell levels**: 0-9 (cantrip = 0)
- **Monster types**: All 14 standard types
- **Monster sizes**: All 6 standard sizes
- **Item rarities**: Common through Artifact
- **Threat levels**: Setback, Dangerous, Deadly
- **Difficulty levels**: Easy, Medium, Hard

## Usage

### Run Extraction with Improved Patterns
```bash
npm run extract-all-content -- Downloads data/free5e/processed 5
```

### Validate Extracted Data
```bash
npm run validate-extracted -- data/free5e/processed
```

### View Validation Report
The validation script generates a detailed JSON report at:
```
data/free5e/processed/validation-report.json
```

## Next Steps

1. **Re-extract data** with improved patterns to reduce false positives
2. **Review validation reports** to identify remaining issues
3. **Refine patterns** based on validation feedback
4. **Add more validation rules** as needed (e.g., spell component validation)
5. **Cross-reference with 5etools** data if available for comparison

## Files Modified

- `scripts/extract-all-content.ts`: Enhanced parsing patterns and inline validation
- `scripts/validate-extracted-data.ts`: New comprehensive validation script
- `package.json`: Added `validate-extracted` script

## Validation Criteria

### Spells
- ✅ Name (min 3 chars)
- ✅ Level (0-9)
- ✅ School (known schools only)
- ✅ Casting time (valid format)
- ✅ Range (valid format)
- ✅ Components (V, S, M)
- ✅ Duration (present)
- ✅ Description (min 30 chars)

### Items
- ✅ Name (min 3 chars)
- ✅ Kind (known kinds)
- ✅ Cost (0-1,000,000 gp if present)
- ✅ Weight (0-10,000 lb if present)
- ✅ Description (min 15 chars if no cost/weight)

### Monsters
- ✅ Name (min 3 chars)
- ✅ Type (known types)
- ✅ Size (known sizes)
- ✅ AC (1-30)
- ✅ HP (1-1000)
- ✅ CR (0-30)
- ✅ Stats (all 6 abilities)

### Traps
- ✅ Name (min 8 chars)
- ✅ Description (min 60 chars)
- ✅ DC (1-30 if present)
- ✅ Threat level (known levels if present)

### Puzzles
- ✅ Name (min 5 chars)
- ✅ Description (min 60 chars)
- ✅ Difficulty (known difficulties)

---

**Last Updated**: 2025-01-13
**Status**: Active improvements in progress

