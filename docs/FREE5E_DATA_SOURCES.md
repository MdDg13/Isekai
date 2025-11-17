# Free5e Data Sources

## Official Sources

### Primary Sources

1. **Wyrmworks Publishing - Free5e**
   - Website: https://wyrmworkspublishing.com/free5e/
   - License: Creative Commons Attribution 4.0 (CC-BY-4.0)
   - Formats: PDF, potentially JSON/CSV exports
   - Content: Player Handbook, Game Master Guide, Monster Manual

2. **Free5e Press Release**
   - Date: March 2025
   - Announcement: https://wyrmworkspublishing.com/wp-content/uploads/2025/03/Free5e-Press-Release.pdf
   - Details: 1,000+ pages of core rules, multiple formats available

### Data Formats

- **PDF**: Primary format, requires parsing
- **JSON**: Preferred format if available (structured, easy to process)
- **CSV**: Alternative format for tabular data

## Acquisition URLs

**Note**: Update these URLs when official Free5e sources are confirmed.

```powershell
# Placeholder URLs - update with actual Free5e download links
$Free5eSources = @{
    "PlayerHandbook" = "https://wyrmworkspublishing.com/free5e/player-handbook"
    "GameMasterGuide" = "https://wyrmworkspublishing.com/free5e/game-master-guide"
    "MonsterManual" = "https://wyrmworkspublishing.com/free5e/monster-manual"
}
```

## License Verification

### Creative Commons Attribution 4.0 (CC-BY-4.0)

**Permissions:**
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

**Conditions:**
- ⚠️ Attribution required (must credit Free5e/Wyrmworks Publishing)
- ⚠️ Indicate changes if modified

**No Restrictions:**
- ✅ No need to share license
- ✅ No need to use same license
- ✅ No trademark use restrictions (beyond attribution)

### Attribution Requirements

When using Free5e content, include:

```
This work includes content from Free5e by Wyrmworks Publishing,
licensed under Creative Commons Attribution 4.0 International License.
https://wyrmworkspublishing.com/free5e/
```

## Data Structure Expectations

### Items
- Name, kind, category, rarity
- Cost (in gold pieces)
- Weight, description
- Properties (finesse, versatile, etc.)
- Attunement requirements

### Spells
- Name, level (0-9), school
- Casting time, range, components
- Duration, description
- Higher level effects
- Ritual/concentration flags

### Monsters
- Name, size, type, alignment
- Armor class, hit points, hit dice
- Speed, stats (STR/DEX/CON/INT/WIS/CHA)
- Challenge rating, XP
- Traits, actions, legendary actions

### Classes
- Name, hit dice
- Proficiencies (armor, weapons, tools, saving throws, skills)
- Starting equipment
- Class features by level
- Spellcasting (if applicable)

### Races
- Name, size, speed
- Ability score increases
- Racial traits
- Languages
- Subraces (if applicable)

### Backgrounds
- Name
- Skill/tool proficiencies
- Languages
- Equipment
- Background feature
- Suggested traits, ideals, bonds, flaws

### Feats
- Name, prerequisites
- Benefits, description

## Processing Notes

### Cost Normalization
- Convert all costs to gold pieces (gp)
- Standard conversion: 1 gp = 10 sp = 100 cp = 0.1 pp
- Store breakdown in `cost_breakdown` JSONB field

### Stat Validation
- Ability scores: 1-30 range
- Challenge rating: 0-30 range
- Spell level: 0-9 range
- Armor class: 1-30 range (typically 10-25)

### Cross-References
- Class spell lists reference spell names
- Monster actions may reference spell names
- Equipment packs reference item names
- Validate all cross-references exist

## Update Procedures

1. **Check for Updates**
   - Monitor Wyrmworks Publishing website
   - Check for new releases or errata
   - Review community forums for corrections

2. **Download New Data**
   - Use `scripts/acquire-free5e-data.ps1`
   - Verify license hasn't changed
   - Check file integrity

3. **Process Updates**
   - Run processing pipeline
   - Validate new/changed content
   - Compare with existing data

4. **Database Updates**
   - Use upsert operations
   - Preserve custom content
   - Log changes for audit

## Community Resources

### Potential Additional Sources

- **Open5e API**: May have compatible data (verify license)
- **Community JSON Exports**: Check licenses before use
- **Fan Conversions**: Verify CC-BY-4.0 compatibility

### Verification Checklist

Before using any source:
- [ ] Verify license is CC-BY-4.0 or compatible
- [ ] Check attribution requirements
- [ ] Validate data structure matches expectations
- [ ] Test processing pipeline
- [ ] Document source in acquisition log

## Troubleshooting

### Missing Data
- Check source URLs are current
- Verify download completed successfully
- Review processing logs for errors

### License Issues
- Confirm source is CC-BY-4.0
- Verify attribution is included
- Check for any additional restrictions

### Data Quality Issues
- Run validation scripts
- Review validation reports
- Fix errors before database insertion

