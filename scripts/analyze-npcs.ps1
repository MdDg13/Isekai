# Analyze NPC quality from Supabase
# Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment

param(
    [Parameter(Mandatory=$true)]
    [string]$WorldId
)

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set" -ForegroundColor Red
    exit 1
}

Write-Host "Fetching NPCs for world: $WorldId" -ForegroundColor Cyan

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

$url = "$supabaseUrl/rest/v1/world_npc?world_id=eq.$WorldId&select=id,name,bio,backstory,traits,stats,created_at&order=created_at.desc&limit=10"

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
} catch {
    Write-Host "ERROR: Failed to fetch NPCs: $_" -ForegroundColor Red
    exit 1
}

if ($response.Count -eq 0) {
    Write-Host "No NPCs found for this world" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n=== Found $($response.Count) NPCs ===`n" -ForegroundColor Green

foreach ($npc in $response) {
    Write-Host "NPC: $($npc.name)" -ForegroundColor Cyan
    Write-Host "  Created: $($npc.created_at)"
    
    # Grammar check
    $bio = $npc.bio ?? ""
    $backstory = $npc.backstory ?? ""
    $allText = "$bio $backstory"
    
    $firstPersonIssues = @()
    if ($allText -match '\bI\s+(am|will|have|learned|know|protect|served)\b') {
        $firstPersonIssues += "First person 'I' found"
    }
    if ($allText -match '\bmy\s+(work|temple|life)\b') {
        $firstPersonIssues += "First person 'my' found"
    }
    if ($allText -match '\bme\b') {
        $firstPersonIssues += "First person 'me' found"
    }
    
    if ($firstPersonIssues.Count -gt 0) {
        Write-Host "  ❌ GRAMMAR ISSUES:" -ForegroundColor Red
        $firstPersonIssues | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    } else {
        Write-Host "  ✅ Grammar: Third person consistent" -ForegroundColor Green
    }
    
    # Specificity check
    $vagueTerms = @("a punishment", "an event", "something", "a thing", "certain", "various")
    $vagueFound = @()
    foreach ($term in $vagueTerms) {
        if ($allText -match $term) {
            $vagueFound += $term
        }
    }
    
    if ($vagueFound.Count -gt 0) {
        Write-Host "  ❌ SPECIFICITY ISSUES: Vague references found:" -ForegroundColor Red
        $vagueFound | ForEach-Object { Write-Host "    - '$_'" -ForegroundColor Red }
    } else {
        Write-Host "  ✅ Specificity: No vague references detected" -ForegroundColor Green
    }
    
    # Coherence check (basic)
    $traits = $npc.traits
    if ($traits) {
        $ideal = $traits.ideal ?? ""
        $bond = $traits.bond ?? ""
        $flaw = $traits.flaw ?? ""
        
        if ($ideal -and $bond -and $backstory) {
            # Check if ideal/bond are mentioned in backstory
            $idealInStory = $backstory -match [regex]::Escape($ideal)
            $bondInStory = $backstory -match [regex]::Escape($bond)
            
            if (-not $idealInStory -and -not $bondInStory) {
                Write-Host "  ⚠️  COHERENCE: Ideal/bond may not connect to backstory" -ForegroundColor Yellow
            } else {
                Write-Host "  ✅ Coherence: Traits connect to backstory" -ForegroundColor Green
            }
        }
    }
    
    # Stats analysis
    $stats = $npc.stats
    if ($stats) {
        $level = $stats.level ?? 0
        $abilities = $stats.abilities
        $class = $traits.class ?? ""
        
        if ($abilities) {
            Write-Host "  Stats: Level $level, Class: $class"
            Write-Host "    STR: $($abilities.str ?? '-'), DEX: $($abilities.dex ?? '-'), CON: $($abilities.con ?? '-')"
            Write-Host "    INT: $($abilities.int ?? '-'), WIS: $($abilities.wis ?? '-'), CHA: $($abilities.cha ?? '-')"
            
            # Check if stats make sense for class
            if ($class) {
                $primaryStat = switch ($class.ToLower()) {
                    { $_ -in @("warrior", "fighter", "paladin", "barbarian") } { "str" }
                    { $_ -in @("rogue", "ranger") } { "dex" }
                    { $_ -in @("wizard", "scholar") } { "int" }
                    { $_ -in @("cleric", "druid") } { "wis" }
                    { $_ -in @("bard", "sorcerer") } { "cha" }
                    default { $null }
                }
                
                if ($primaryStat -and $abilities.$primaryStat) {
                    $primaryValue = $abilities.$primaryStat
                    if ($primaryValue -lt 10) {
                        Write-Host "  ⚠️  STAT ALLOCATION: Primary stat ($primaryStat) is low ($primaryValue) for a $class" -ForegroundColor Yellow
                    } else {
                        Write-Host "  ✅ Stat allocation: Primary stat appropriate" -ForegroundColor Green
                    }
                }
            }
        }
        
        # Combat stats
        $combat = $stats.combat
        if ($combat) {
            Write-Host "  Combat: HP: $($combat.hitpoints ?? '-')/$($combat.maxHitpoints ?? '-'), AC: $($combat.armorClass ?? '-'), Speed: $($combat.speed ?? '-') ft"
            if ($combat.weapons -and $combat.weapons.Count -gt 0) {
                Write-Host "  Weapons:"
                foreach ($weapon in $combat.weapons) {
                    Write-Host "    - $($weapon.name ?? 'Unnamed'): $($weapon.damage ?? '-') $($weapon.damageType ?? ''), To Hit: $($weapon.toHit ?? '-')"
                }
            } else {
                Write-Host "  ⚠️  No weapons defined" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠️  No combat stats defined" -ForegroundColor Yellow
        }
    }
    
    # Bio/Backstory quality
    Write-Host "  Bio: $($bio.Substring(0, [Math]::Min(80, $bio.Length)))..." -ForegroundColor Gray
    Write-Host "  Backstory: $($backstory.Substring(0, [Math]::Min(100, $backstory.Length)))..." -ForegroundColor Gray
    
    Write-Host ""
}

Write-Host "`n=== Analysis Complete ===" -ForegroundColor Green

