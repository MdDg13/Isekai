# Complete Data Extraction Examples

This document provides full examples of all data types with all variables populated. These examples show the complete structure expected for each data type after extraction.

## Schema Note: Lair Actions

The `reference_monster` table currently includes `traits`, `actions`, `legendary_actions`, and `reactions`, but **does not include `lair_actions`**. Lair actions are extracted and included in the examples below, but the schema may need to be updated to include a `lair_actions` JSONB field, or they can be stored in a separate `reference_monster_lair_action` table.

## 1. Monster (Complete Example)

```json
{
  "name": "Adult Red Dragon",
  "size": "Huge",
  "type": "dragon",
  "subtype": null,
  "alignment": "chaotic evil",
  "armor_class": 19,
  "armor_class_type": "natural armor",
  "hit_points": 256,
  "hit_dice": "19d12+133",
  "speed": {
    "walk": 40,
    "climb": 40,
    "fly": 80
  },
  "stats": {
    "str": 27,
    "dex": 10,
    "con": 25,
    "int": 16,
    "wis": 13,
    "cha": 21
  },
  "saving_throws": {
    "dex": "+6",
    "con": "+14",
    "wis": "+8",
    "cha": "+12"
  },
  "skills": {
    "perception": "+14",
    "stealth": "+6"
  },
  "damage_resistances": ["fire"],
  "damage_immunities": [],
  "condition_immunities": ["frightened"],
  "senses": "blindsight 60 ft., darkvision 120 ft., passive Perception 24",
  "languages": "Common, Draconic",
  "challenge_rating": 17,
  "xp": 18000,
  "traits": [
    {
      "name": "Legendary Resistance (3/Day)",
      "description": "If the dragon fails a saving throw, it can choose to succeed instead."
    },
    {
      "name": "Multiattack",
      "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
    }
  ],
  "actions": [
    {
      "name": "Bite",
      "description": "Melee Weapon Attack: +15 to hit, reach 10 ft., one target. Hit: 19 (2d10 + 8) piercing damage plus 7 (2d6) fire damage.",
      "attack_bonus": 15,
      "damage": "2d10+8 piercing plus 2d6 fire"
    },
    {
      "name": "Claw",
      "description": "Melee Weapon Attack: +15 to hit, reach 5 ft., one target. Hit: 15 (2d6 + 8) slashing damage.",
      "attack_bonus": 15,
      "damage": "2d6+8 slashing"
    },
    {
      "name": "Tail",
      "description": "Melee Weapon Attack: +15 to hit, reach 15 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage.",
      "attack_bonus": 15,
      "damage": "2d8+8 bludgeoning"
    },
    {
      "name": "Frightful Presence",
      "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 20 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
      "attack_bonus": null,
      "damage": null
    },
    {
      "name": "Fire Breath (Recharge 5-6)",
      "description": "The dragon exhales fire in a 60-foot cone. Each creature in that area must make a DC 21 Dexterity saving throw, taking 63 (18d6) fire damage on a failed save, or half as much damage on a successful one.",
      "attack_bonus": null,
      "damage": "18d6 fire"
    }
  ],
  "legendary_actions": [
    {
      "name": "Detect",
      "description": "The dragon makes a Wisdom (Perception) check.",
      "cost": 1
    },
    {
      "name": "Tail Attack",
      "description": "The dragon makes a tail attack.",
      "cost": 1
    },
    {
      "name": "Wing Attack (Costs 2 Actions)",
      "description": "The dragon beats its wings. Each creature within 10 feet of the dragon must succeed on a DC 23 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed.",
      "cost": 2
    }
  ],
  "reactions": [],
  "lair_actions": [
    {
      "name": "Magma Eruption",
      "description": "The ground in a 20-foot radius around the dragon's lair erupts with magma. Each creature in that area must make a DC 15 Dexterity saving throw, taking 21 (6d6) fire damage on a failed save, or half as much damage on a successful one."
    },
    {
      "name": "Volcanic Gas",
      "description": "The dragon's lair fills with volcanic gas in a 20-foot radius centered on a point the dragon can see within 120 feet of it. The gas spreads around corners, and its area is heavily obscured. It lasts until initiative count 20 on the next round. Each creature that starts its turn in the gas must succeed on a DC 13 Constitution saving throw or be poisoned until the end of its next turn. Creatures that don't need to breathe or are immune to poison automatically succeed on this saving throw."
    }
  ],
  "source": "Free5e",
  "page_reference": "MM 98",
  "tags": ["dragon", "fire", "legendary", "lair"]
}
```

## 2. Class (Complete Example)

```json
{
  "name": "Wizard",
  "hit_dice": "1d6",
  "hit_points_at_1st_level": "6 + Constitution modifier",
  "hit_points_at_higher_levels": "1d6 (or 4) + Constitution modifier per wizard level after 1st",
  "proficiencies": {
    "armor": [],
    "weapons": ["daggers", "darts", "slings", "quarterstaffs", "light crossbows"],
    "tools": [],
    "saving_throws": ["intelligence", "wisdom"],
    "skills": {
      "choose": 2,
      "from": ["arcana", "history", "investigation", "medicine", "religion"]
    }
  },
  "starting_equipment": {
    "options": [
      {
        "choice": "A quarterstaff or (b) a dagger",
        "items": ["quarterstaff", "dagger"]
      },
      {
        "choice": "A component pouch or (b) an arcane focus",
        "items": ["component pouch", "arcane focus"]
      },
      {
        "choice": "A scholar's pack or (b) an explorer's pack",
        "items": ["scholar's pack", "explorer's pack"]
      }
    ],
    "default": [
      "A spellbook"
    ]
  },
  "multiclassing": {
    "prerequisites": {
      "intelligence": 13
    },
    "proficiencies_gained": []
  },
  "class_features": [
    {
      "level": 1,
      "name": "Spellcasting",
      "description": "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power. See Spells Rules for the general rules of spellcasting and the Spells Listing for the wizard spell list."
    },
    {
      "level": 1,
      "name": "Arcane Recovery",
      "description": "You have learned to recover some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher."
    },
    {
      "level": 2,
      "name": "Arcane Tradition",
      "description": "When you reach 2nd level, you choose an arcane tradition, shaping your practice of magic through one of eight schools: Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, or Transmutation. The tradition you choose grants you features at 2nd level and again at 6th, 10th, and 14th level."
    }
  ],
  "spellcasting": {
    "ability": "intelligence",
    "spell_save_dc": "8 + your proficiency bonus + your Intelligence modifier",
    "spell_attack_modifier": "your proficiency bonus + your Intelligence modifier",
    "cantrips_known": {
      "1": 3,
      "4": 4,
      "10": 5
    },
    "spell_slots": {
      "1": [2, 0, 0, 0, 0, 0, 0, 0, 0],
      "2": [3, 0, 0, 0, 0, 0, 0, 0, 0],
      "3": [4, 2, 0, 0, 0, 0, 0, 0, 0],
      "20": [4, 3, 3, 3, 3, 2, 2, 1, 1]
    },
    "spells_known": "You prepare the list of wizard spells that are available for you to cast. To do so, choose a number of wizard spells equal to your Intelligence modifier + your wizard level (minimum of one spell). The spells must be of a level for which you have spell slots."
  },
  "source": "Free5e",
  "page_reference": "PHB 105",
  "tags": ["full-caster", "intelligence", "spellbook"]
}
```

## 3. Subclass (Complete Example)

```json
{
  "name": "School of Evocation",
  "parent_class": "Wizard",
  "level_granted": 2,
  "description": "You focus your study on magic that creates powerful elemental effects such as bitter cold, searing flame, rolling thunder, crackling lightning, and burning acid. Some evokers find employment in military forces, serving as artillery to blast enemy armies from afar. Others use their spectacular power to protect the weak, while some seek their own gain as bandits, adventurers, or aspiring tyrants.",
  "features": [
    {
      "level": 2,
      "name": "Evocation Savant",
      "description": "Beginning when you select this school at 2nd level, the gold and time you must spend to copy an evocation spell into your spellbook is halved."
    },
    {
      "level": 2,
      "name": "Sculpt Spells",
      "description": "Beginning at 2nd level, you can create pockets of relative safety within the effects of your evocation spells. When you cast an evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 + the spell's level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save."
    },
    {
      "level": 6,
      "name": "Potent Cantrip",
      "description": "Starting at 6th level, your damaging cantrips affect even creatures that avoid the brunt of the effect. When a creature succeeds on a saving throw against your cantrip, the creature takes half the cantrip's damage (if any) but suffers no other effect that the cantrip would normally impose."
    },
    {
      "level": 10,
      "name": "Empowered Evocation",
      "description": "Beginning at 10th level, you can add your Intelligence modifier to one damage roll of any wizard evocation spell you cast."
    },
    {
      "level": 14,
      "name": "Overchannel",
      "description": "Starting at 14th level, you can increase the power of your simpler spells. When you cast a wizard spell of 1st through 5th level that deals damage, you can deal maximum damage with that spell. The first time you do so, you suffer no adverse effect. If you use this feature again before you finish a long rest, you take 2d12 necrotic damage for each level of the spell, immediately after you cast it. Each time you use this feature again before finishing a long rest, the necrotic damage per spell level increases by 1d12. This damage ignores resistance and immunity."
    }
  ],
  "source": "Free5e",
  "page_reference": "PHB 117",
  "tags": ["wizard", "evocation", "damage"]
}
```

## 4. Race (Complete Example)

```json
{
  "name": "Elf",
  "size": "Medium",
  "speed": 30,
  "ability_score_increases": {
    "dex": 2
  },
  "traits": [
    {
      "name": "Darkvision",
      "description": "Accustomed to twilit forests and the night sky, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray."
    },
    {
      "name": "Keen Senses",
      "description": "You have proficiency in the Perception skill."
    },
    {
      "name": "Fey Ancestry",
      "description": "You have advantage on saving throws against being charmed, and magic can't put you to sleep."
    },
    {
      "name": "Trance",
      "description": "Elves don't need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. (The Common word for such meditation is \"trance.\") While meditating, you can dream after a fashion; such dreams are actually mental exercises that have become reflexive through years of practice. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep."
    }
  ],
  "languages": ["Common", "Elvish"],
  "subraces": [
    {
      "name": "High Elf",
      "ability_score_increases": {
        "int": 1
      },
      "traits": [
        {
          "name": "Elf Weapon Training",
          "description": "You have proficiency with the longsword, shortsword, shortbow, and longbow."
        },
        {
          "name": "Cantrip",
          "description": "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it."
        },
        {
          "name": "Extra Language",
          "description": "You can speak, read, and write one extra language of your choice."
        }
      ]
    },
    {
      "name": "Wood Elf",
      "ability_score_increases": {
        "wis": 1
      },
      "traits": [
        {
          "name": "Elf Weapon Training",
          "description": "You have proficiency with the longsword, shortsword, shortbow, and longbow."
        },
        {
          "name": "Fleet of Foot",
          "description": "Your base walking speed increases to 35 feet."
        },
        {
          "name": "Mask of the Wild",
          "description": "You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena."
        }
      ]
    },
    {
      "name": "Dark Elf (Drow)",
      "ability_score_increases": {
        "cha": 1
      },
      "traits": [
        {
          "name": "Superior Darkvision",
          "description": "Your darkvision has a radius of 120 feet."
        },
        {
          "name": "Sunlight Sensitivity",
          "description": "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight."
        },
        {
          "name": "Drow Magic",
          "description": "You know the dancing lights cantrip. When you reach 3rd level, you can cast the faerie fire spell once per day. When you reach 5th level, you can also cast the darkness spell once per day. Charisma is your spellcasting ability for these spells."
        },
        {
          "name": "Drow Weapon Training",
          "description": "You have proficiency with rapiers, shortswords, and hand crossbows."
        }
      ]
    }
  ],
  "source": "Free5e",
  "page_reference": "PHB 21",
  "tags": ["fey", "darkvision", "long-lived"]
}
```

## 5. Feat (Complete Example)

```json
{
  "name": "Great Weapon Master",
  "prerequisites": null,
  "benefits": "You've learned to put the weight of a weapon to your advantage, letting its momentum empower your strikes. You gain the following benefits:\n\n• On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action.\n\n• Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack's damage.",
  "description": "You've learned to put the weight of a weapon to your advantage, letting its momentum empower your strikes. You gain the following benefits:\n\n• On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action.\n\n• Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack's damage.",
  "source": "Free5e",
  "page_reference": "PHB 167",
  "tags": ["combat", "melee", "weapon"]
}
```

## 6. Item - Mundane Weapon (Complete Example)

```json
{
  "name": "Longsword",
  "kind": "weapon",
  "category": "martial_melee",
  "rarity": null,
  "cost_gp": 15,
  "cost_breakdown": {
    "gp": 15,
    "sp": 0,
    "cp": 0,
    "pp": 0
  },
  "weight_lb": 3,
  "description": "A versatile one-handed melee weapon. It has a straight blade with a sharp point, suitable for both slashing and thrusting attacks.",
  "properties": {
    "versatile": "1d10",
    "martial": true,
    "melee": true
  },
  "attunement": false,
  "attunement_requirements": null,
  "source": "Free5e",
  "page_reference": "PHB 149",
  "tags": ["weapon", "martial", "melee", "versatile"]
}
```

## 7. Item - Magic Weapon (Complete Example)

```json
{
  "name": "Flametongue",
  "kind": "magic_item",
  "category": "weapon",
  "rarity": "rare",
  "cost_gp": 5000,
  "cost_breakdown": {
    "gp": 5000,
    "sp": 0,
    "cp": 0,
    "pp": 0
  },
  "weight_lb": 3,
  "description": "You can use a bonus action to speak this magic sword's command word, causing flames to erupt from the blade. These flames shed bright light in a 40-foot radius and dim light for an additional 40 feet. While the sword is ablaze, it deals an extra 2d6 fire damage to any target it hits. The flames last until you use a bonus action to speak the command word again or until you drop or sheathe the sword.",
  "properties": {
    "versatile": "1d10",
    "martial": true,
    "melee": true,
    "magical": true,
    "damage_bonus": "2d6 fire"
  },
  "attunement": true,
  "attunement_requirements": null,
  "source": "Free5e",
  "page_reference": "DMG 170",
  "tags": ["weapon", "magic", "rare", "fire", "attunement"]
}
```

## 8. Item - Potion (Complete Example)

```json
{
  "name": "Potion of Healing",
  "kind": "consumable",
  "category": "potion",
  "rarity": "common",
  "cost_gp": 50,
  "cost_breakdown": {
    "gp": 50,
    "sp": 0,
    "cp": 0,
    "pp": 0
  },
  "weight_lb": 0.5,
  "description": "A character who drinks the magical red fluid in this vial regains 2d4 + 2 hit points. Drinking or administering a potion takes an action.",
  "properties": {
    "consumable": true,
    "healing": "2d4+2",
    "action": "action"
  },
  "attunement": false,
  "attunement_requirements": null,
  "source": "Free5e",
  "page_reference": "PHB 153",
  "tags": ["potion", "healing", "consumable", "common"]
}
```

## 9. Item - Poison (Complete Example)

```json
{
  "name": "Purple Worm Poison",
  "kind": "consumable",
  "category": "poison",
  "rarity": "very_rare",
  "cost_gp": 2000,
  "cost_breakdown": {
    "gp": 2000,
    "sp": 0,
    "cp": 0,
    "pp": 0
  },
  "weight_lb": 0,
  "description": "This poison must be harvested from a dead or incapacitated purple worm. A creature subjected to this poison must make a DC 19 Constitution saving throw, taking 12d6 poison damage on a failed save, or half as much damage on a successful one.",
  "properties": {
    "consumable": true,
    "poison": true,
    "dc": 19,
    "damage": "12d6 poison",
    "save": "constitution"
  },
  "attunement": false,
  "attunement_requirements": null,
  "source": "Free5e",
  "page_reference": "DMG 258",
  "tags": ["poison", "consumable", "very_rare", "harvested"]
}
```

## 10. Item - Spell Component (Complete Example)

```json
{
  "name": "Diamond worth at least 300 gp",
  "kind": "consumable",
  "category": "spell_component",
  "rarity": null,
  "cost_gp": 300,
  "cost_breakdown": {
    "gp": 300,
    "sp": 0,
    "cp": 0,
    "pp": 0
  },
  "weight_lb": 0.1,
  "description": "A diamond worth at least 300 gold pieces, consumed as a material component for spells such as Chromatic Orb, Greater Restoration, and Revivify.",
  "properties": {
    "consumable": true,
    "spell_component": true,
    "minimum_value": 300,
    "used_in": ["chromatic orb", "greater restoration", "revivify"]
  },
  "attunement": false,
  "attunement_requirements": null,
  "source": "Free5e",
  "page_reference": "PHB 203",
  "tags": ["spell_component", "gem", "consumable", "expensive"]
}
```

## 11. Item - Enchantment/Characteristic (Complete Example)

```json
{
  "name": "+1 Weapon",
  "kind": "magic_item",
  "category": "weapon_enchantment",
  "rarity": "uncommon",
  "cost_gp": 500,
  "cost_breakdown": {
    "gp": 500,
    "sp": 0,
    "cp": 0,
    "pp": 0
  },
  "weight_lb": 0,
  "description": "You have a bonus to attack and damage rolls made with this magic weapon. The bonus is determined by the weapon's rarity.",
  "properties": {
    "enchantment": true,
    "attack_bonus": 1,
    "damage_bonus": 1,
    "applies_to": ["weapon"],
    "stackable": false
  },
  "attunement": false,
  "attunement_requirements": null,
  "source": "Free5e",
  "page_reference": "DMG 152",
  "tags": ["enchantment", "weapon", "uncommon", "combat"]
}
```

## 12. Background (Complete Example)

```json
{
  "name": "Acolyte",
  "skill_proficiencies": ["insight", "religion"],
  "tool_proficiencies": [],
  "languages": ["two of your choice"],
  "equipment": {
    "default": [
      "A holy symbol (a gift to you when you entered the priesthood)",
      "A prayer book or prayer wheel",
      "5 sticks of incense",
      "Vestments",
      "A set of common clothes",
      "A belt pouch containing 15 gp"
    ]
  },
  "feature_name": "Shelter of the Faithful",
  "feature_description": "As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith, though you must provide any material components needed for spells. Those who share your religion will support you (but only you) at a modest lifestyle.\n\nYou might also have ties to a specific temple dedicated to your chosen deity or pantheon, and you have a residence there. This could be the temple where you used to serve, if you remain on good terms with it, or a temple where you have found a new home. While near your temple, you can call upon the priests for assistance, provided the assistance you ask for is not hazardous and you remain in good standing with your temple.",
  "personality_traits": [
    "I idolize a particular hero of my faith and constantly refer to that person's deeds and example.",
    "I can find common ground between the fiercest enemies, empathizing with them and always working toward peace.",
    "I see omens in every event and action. The gods try to speak to us, we just need to listen.",
    "Nothing can shake my optimistic attitude.",
    "I quote (or misquote) sacred texts and proverbs in almost every situation.",
    "I am tolerant (or intolerant) of other faiths and respect (or condemn) the worship of other gods.",
    "I've enjoyed fine food, drink, and high society among my temple's elite. Rough living grates on me.",
    "I've spent so long in the temple that I have little practical experience dealing with people in the outside world."
  ],
  "ideals": [
    "Tradition. The ancient traditions of worship and sacrifice must be preserved and upheld. (Lawful)",
    "Charity. I always try to help those in need, no matter what the personal cost. (Good)",
    "Change. We must help bring about the changes the gods are constantly working in the world. (Chaotic)",
    "Power. I hope to one day rise to the top of my faith's religious hierarchy. (Lawful)",
    "Faith. I trust that my deity will guide my actions. I have faith that if I work hard, things will go well. (Lawful)",
    "Aspiration. I seek to prove myself worthy of my god's favor by matching my actions against his or her teachings. (Any)"
  ],
  "bonds": [
    "I would die to recover an ancient relic of my faith that was lost long ago.",
    "I will someday get revenge on the corrupt temple hierarchy who branded me a heretic.",
    "I owe my life to the priest who took me in when my parents died.",
    "Everything I do is for the common people.",
    "I will do anything to protect the temple where I served.",
    "I seek to preserve a sacred text that my enemies consider heretical and seek to destroy."
  ],
  "flaws": [
    "I judge others harshly, and myself even more severely.",
    "I put too much trust in those who wield power within my temple's hierarchy.",
    "My piety sometimes leads me to blindly trust those that profess faith in my god.",
    "I am inflexible in my thinking.",
    "I am suspicious of strangers and expect the worst of them.",
    "Once I pick a goal, I become obsessed with it to the detriment of everything else in my life."
  ],
  "source": "Free5e",
  "page_reference": "PHB 127",
  "tags": ["religious", "temple", "faith"]
}
```

---

**Note on Cost Normalization**: When costs are inconsistent or missing, refer to "Sane Magical Prices" PDF for guidance. For items not found there, estimate based on:
- Rarity tier (common: 50-100gp, uncommon: 100-500gp, rare: 500-5000gp, very_rare: 5000-50000gp, legendary: 50000+gp)
- Item type and power level
- Comparable items in the same category

