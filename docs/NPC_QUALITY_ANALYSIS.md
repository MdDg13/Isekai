# NPC Quality Analysis: Model vs Implementation

## Current Implementation Overview

The NPC generation pipeline has **5 AI passes**:
1. **Initial Enhancement** - Creates NPC from procedural base with user intent
2. **Self-Critique** - AI critiques its own output and proposes edits
3. **Style Normalization** - Fixes grammar, specificity, coherence
4. **Grammar Pass** - Removes first-person references
5. **Final Quality Check** - Fixes broken sentences and ensures coherence

## Potential Issues: Model vs Implementation

### 🔴 **IMPLEMENTATION ISSUES** (Fixable in Code)

#### 1. **Tag Parsing May Miss Keywords**
**Problem**: The code only looks for specific keywords in tags:
```typescript
const classFromTags = body.tags?.find(t => ['commoner', 'guard', 'noble', ...].includes(t.toLowerCase()));
```
**Issue**: "wizard" is in the list, but "training to become a wizard" won't match because it's a phrase, not a single tag.

**Fix**: Parse phrases and extract keywords:
- "training to become a wizard" → extract "wizard"
- "against parent's wishes" → extract "family conflict" or "parent disapproval"

#### 2. **Intent String May Not Emphasize Critical Elements**
**Problem**: The intent is built as:
```typescript
if (body.tags && body.tags.length) intentParts.push(`tags=${body.tags.join(', ')}`);
const intent = intentParts.length ? `User intent: ${intentParts.join(' | ')}.` : 'User intent: none specified.';
```

**Issue**: If tags are "shy, dwarf, training to become a wizard, against parent's wishes", the AI sees:
- `tags=shy, dwarf, training to become a wizard, against parent's wishes`

But it doesn't explicitly emphasize:
- **Race MUST be dwarf** (not just a tag)
- **Class MUST be wizard** (not just "training to become")
- **Conflict MUST be family disapproval** (not just "against wishes")

**Fix**: Parse tags and extract explicit constraints:
```typescript
// Extract race from tags
const raceFromTags = extractRace(body.tags);
// Extract class from tags (handle phrases like "training to become wizard")
const classFromTags = extractClass(body.tags);
// Extract conflict from tags
const conflictFromTags = extractConflict(body.tags);

// Then in intent:
if (raceFromTags) intentParts.push(`race=${raceFromTags} (REQUIRED)`);
if (classFromTags) intentParts.push(`class=${classFromTags} (REQUIRED)`);
if (conflictFromTags) intentParts.push(`conflict=${conflictFromTags} (REQUIRED)`);
```

#### 3. **Initial Enhancement Prompt Doesn't Emphasize Tag Constraints**
**Problem**: The enhancement prompt says:
```
- Respect all explicit user constraints (class, race, background, temperament). Do not change them.
```

But if class/race come from tags (not explicit body.class/body.race), they're not treated as "explicit constraints" in the prompt.

**Fix**: Make tag-derived constraints explicit in the prompt:
```typescript
const explicitConstraints = [];
if (body.class || classFromTags) explicitConstraints.push(`class: ${body.class || classFromTags}`);
if (body.race || raceFromTags) explicitConstraints.push(`race: ${body.race || raceFromTags}`);
// ... etc

const enhancePrompt = `You are improving a D&D 5e NPC so it is creative, coherent, and immediately usable by a DM.
${intent}

CRITICAL CONSTRAINTS (DO NOT CHANGE THESE):
${explicitConstraints.map(c => `- ${c}`).join('\n')}

Rules:
- Respect ALL constraints listed above. These are MANDATORY and cannot be changed.
...
```

#### 4. **Guardrails Only Apply to Explicit body.class/body.race**
**Problem**: The guardrails enforce constraints:
```typescript
if (body.class) { mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), class: body.class }; }
if (body.race) { mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), race: body.race }; }
else if (raceFromTags) { mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), race: raceFromTags }; }
```

**Issue**: If `classFromTags` exists but `body.class` doesn't, the class isn't enforced!

**Fix**: Enforce tag-derived constraints too:
```typescript
const finalClass = body.class || classFromTags;
if (finalClass) { mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), class: finalClass }; }

const finalRace = body.race || raceFromTags;
if (finalRace) { mergedAfterCritique.traits = { ...(mergedAfterCritique.traits || {}), race: finalRace }; }
```

#### 5. **Name Generation Only Triggers on nameHint, Not Tags**
**Problem**: Name validation only checks `body.nameHint`:
```typescript
} else if (body.nameHint && isPromptText) {
```

**Issue**: If the prompt is in tags (not nameHint), bad names won't be regenerated.

**Fix**: Check tags too:
```typescript
const promptText = body.nameHint || body.tags?.join(' ') || '';
if (isPromptText && promptText) {
  // Generate proper name
}
```

#### 6. **Temperature May Be Too High for Constraint Adherence**
**Problem**: Initial enhancement uses `temperature: 0.5`, which allows creativity but may ignore constraints.

**Issue**: Lower temperature (0.3-0.4) is better for constraint adherence, but current setup prioritizes creativity.

**Fix**: Use lower temperature for constraint-heavy prompts:
```typescript
const hasExplicitConstraints = !!(body.class || body.race || classFromTags || raceFromTags);
const temperature = hasExplicitConstraints ? 0.3 : 0.5; // Lower temp when constraints exist
```

### 🟡 **MODEL LIMITATIONS** (Workarounds Needed)

#### 1. **Llama 3.1 8B May Not Follow Complex Instructions**
**Issue**: Smaller models (8B) struggle with:
- Multi-step instructions
- Constraint adherence when creativity is also requested
- Maintaining context across 5 passes

**Workaround**: 
- Simplify prompts (one clear instruction per pass)
- Use more explicit examples in prompts
- Increase repetition of critical constraints

#### 2. **Model May "Forget" Constraints Across Passes**
**Issue**: Each pass only sees the current state, not the original constraints.

**Workaround**: Include original constraints in every prompt:
```typescript
const originalConstraints = `Original user requirements: ${intent}`;
// Include in every prompt
```

#### 3. **Model May Prioritize Creativity Over Constraints**
**Issue**: When asked to be "creative" and "respect constraints", model may choose creativity.

**Workaround**: 
- Put constraints FIRST in prompt
- Use stronger language: "MANDATORY", "DO NOT CHANGE", "REQUIRED"
- Use examples that show constraint adherence

### 🟢 **PROMPT ENGINEERING ISSUES** (Fixable)

#### 1. **Initial Prompt Doesn't Show Examples**
**Current**: Just rules, no examples of good constraint adherence.

**Fix**: Add examples:
```typescript
Examples of proper constraint adherence:
- User wants "dwarf wizard" → NPC MUST be dwarf race, wizard class
- User wants "shy, against parents" → NPC MUST be shy personality, family conflict in backstory
```

#### 2. **Critique Prompt Doesn't Check Constraint Adherence**
**Current**: Critique checks "adherence to constraints" but doesn't explicitly list what to check.

**Fix**: Make critique explicit:
```typescript
Critique the NPC for:
1. CONSTRAINT ADHERENCE (CRITICAL):
   - Is race exactly "${finalRace}"? (not similar, not changed)
   - Is class exactly "${finalClass}"? (not similar, not changed)
   - Are all user-specified elements present?
2. Clarity and DM usability...
3. Creativity...
```

#### 3. **Style Passes Don't Reinforce Constraints**
**Current**: Style/grammar passes focus on text quality, not constraint adherence.

**Fix**: Add constraint check to each pass:
```typescript
const stylePrompt = `CRITICAL: Fix grammar AND ensure constraints are still met.
Current NPC: race="${finalRace}", class="${finalClass}"
...
After fixes, verify race is still "${finalRace}" and class is still "${finalClass}".
```

## Recommended Improvements (Priority Order)

### **HIGH PRIORITY** (Fixes Core Issues)

1. **Extract Keywords from Tag Phrases**
   - Parse "training to become wizard" → extract "wizard"
   - Parse "against parent's wishes" → extract "family conflict"
   - Make extracted keywords explicit constraints

2. **Enforce Tag-Derived Constraints**
   - Apply guardrails to `classFromTags` and `raceFromTags`
   - Include tag-derived constraints in every AI prompt
   - Make constraints explicit in intent string

3. **Strengthen Constraint Language in Prompts**
   - Use "MANDATORY", "REQUIRED", "DO NOT CHANGE"
   - Put constraints FIRST in every prompt
   - Add examples of proper constraint adherence

4. **Include Original Constraints in Every Pass**
   - Pass original intent to every AI call
   - Remind model of constraints in each step

### **MEDIUM PRIORITY** (Improves Quality)

5. **Lower Temperature for Constraint-Heavy Prompts**
   - Use 0.3 for explicit constraints, 0.5 for creative prompts

6. **Add Constraint Checks to Critique**
   - Explicitly verify race/class match in critique step

7. **Improve Name Generation**
   - Check tags for prompt-like names, not just nameHint

### **LOW PRIORITY** (Polish)

8. **Add More Examples to Prompts**
   - Show good vs bad constraint adherence

9. **Simplify Multi-Pass Pipeline**
   - Consider reducing to 3-4 passes if model struggles with 5

10. **Add Validation After Each Pass**
    - Verify constraints still met after each AI call

## Testing Strategy

1. **Generate 10 NPCs with same prompt**: "shy dwarf, training to become a wizard, against parent's wishes"
2. **Measure**:
   - % with correct race (dwarf)
   - % with correct class (wizard)
   - % with family conflict in backstory
   - % with shy personality evident
   - Grammar quality (first-person issues)
   - Specificity (vague terms)
   - Coherence (elements connect)

3. **Compare**:
   - Before fixes vs after fixes
   - Different temperature settings
   - Different prompt structures

## Conclusion

**Most issues are IMPLEMENTATION problems**, not model limitations:
- Tag parsing doesn't extract keywords from phrases
- Tag-derived constraints aren't enforced
- Constraints aren't emphasized strongly enough in prompts
- Guardrails don't apply to tag-derived values

**Model limitations exist but can be worked around**:
- Smaller models need clearer, more explicit instructions
- Constraints must be repeated in every pass
- Examples help model understand expectations

**Recommended approach**: Fix implementation issues first (HIGH PRIORITY items), then test. If quality still poor, address model limitations with better prompt engineering.

