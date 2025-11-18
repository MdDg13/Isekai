# Analyze NPC quality from Supabase
# Reads from .env.local if environment variables not set

param(
    [Parameter(Mandatory=$true)]
    [string]$WorldId
)

# Try to load from .env.local if env vars not set
$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if (-not (Get-Variable -Name $key -ErrorAction SilentlyContinue)) {
                Set-Item -Path "env:$key" -Value $value
            }
        }
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
# Use service role key to bypass RLS for analysis
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY
if (-not $supabaseKey) {
    # Fallback to anon key if service role not available
    $supabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
    Write-Host "WARNING: Using anon key - RLS may block access. Set SUPABASE_SERVICE_ROLE_KEY for full access." -ForegroundColor Yellow
}

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set" -ForegroundColor Red
    Write-Host "Set them in environment or create .env.local file in project root" -ForegroundColor Yellow
    exit 1
}

Write-Host "Fetching NPCs for world: $WorldId" -ForegroundColor Cyan

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

# Query with service role key to bypass RLS
$url = "$supabaseUrl/rest/v1/world_npc?world_id=eq.$WorldId&select=id,name,bio,backstory,traits,stats,created_at&order=created_at.desc&limit=10"
Write-Host "Query URL: $url" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
} catch {
    Write-Host "ERROR: Failed to fetch NPCs" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    } else {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host "`nTIP: Add SUPABASE_SERVICE_ROLE_KEY to .env.local to bypass RLS" -ForegroundColor Yellow
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
    $bio = if ($npc.bio) { $npc.bio } else { "" }
    $backstory = if ($npc.backstory) { $npc.backstory } else { "" }
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
        $ideal = if ($traits.ideal) { $traits.ideal } else { "" }
        $bond = if ($traits.bond) { $traits.bond } else { "" }
        $flaw = if ($traits.flaw) { $traits.flaw } else { "" }
        
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
        $level = if ($stats.level) { $stats.level } else { 0 }
        $abilities = $stats.abilities
        $class = if ($traits.class) { $traits.class } else { "" }
        
        if ($abilities) {
            $str = if ($abilities.str) { $abilities.str } else { '-' }
            $dex = if ($abilities.dex) { $abilities.dex } else { '-' }
            $con = if ($abilities.con) { $abilities.con } else { '-' }
            $int = if ($abilities.int) { $abilities.int } else { '-' }
            $wis = if ($abilities.wis) { $abilities.wis } else { '-' }
            $cha = if ($abilities.cha) { $abilities.cha } else { '-' }
            Write-Host "  Stats: Level $level, Class: $class"
            Write-Host "    STR: $str, DEX: $dex, CON: $con"
            Write-Host "    INT: $int, WIS: $wis, CHA: $cha"
            
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
            $hp = if ($combat.hitpoints) { $combat.hitpoints } else { '-' }
            $maxHp = if ($combat.maxHitpoints) { $combat.maxHitpoints } else { '-' }
            $ac = if ($combat.armorClass) { $combat.armorClass } else { '-' }
            $speed = if ($combat.speed) { $combat.speed } else { '-' }
            Write-Host "  Combat: HP: $hp/$maxHp, AC: $ac, Speed: $speed ft"
            if ($combat.weapons -and $combat.weapons.Count -gt 0) {
                Write-Host "  Weapons:"
                foreach ($weapon in $combat.weapons) {
                    $wName = if ($weapon.name) { $weapon.name } else { 'Unnamed' }
                    $wDamage = if ($weapon.damage) { $weapon.damage } else { '-' }
                    $wType = if ($weapon.damageType) { $weapon.damageType } else { '' }
                    $wToHit = if ($weapon.toHit) { $weapon.toHit } else { '-' }
                    Write-Host "    - $wName : $wDamage $wType, To Hit: $wToHit"
                }
            } else {
                Write-Host "  ⚠️  No weapons defined" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠️  No combat stats defined" -ForegroundColor Yellow
        }
    }
    
    # Check for summary field (new structured format)
    $summary = if ($traits.summary) { $traits.summary } else { $null }
    if ($summary) {
        Write-Host "  ✅ Summary field present" -ForegroundColor Green
        if ($summary.oneLiner) {
            Write-Host "    One-liner: $($summary.oneLiner.Substring(0, [Math]::Min(80, $summary.oneLiner.Length)))..." -ForegroundColor Gray
        }
        if ($summary.keyPoints -and $summary.keyPoints.Count -gt 0) {
            Write-Host "    Key points: $($summary.keyPoints.Count) items" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ Summary field MISSING (new structured format not present)" -ForegroundColor Red
    }
    
    # Check for broken bio patterns
    $brokenBioPatterns = @()
    if ($bio -match '\bknown for \w+ and \w+\.?\s*$') {
        $brokenBioPatterns += "Broken 'known for X and Y' pattern"
    }
    if ($bio -match '\bknown for \w+ and \w+\b' -and $bio.Length -lt 50) {
        $brokenBioPatterns += "Short bio with 'known for' pattern (likely broken)"
    }
    if ($brokenBioPatterns.Count -gt 0) {
        Write-Host "  ❌ BROKEN BIO PATTERNS:" -ForegroundColor Red
        $brokenBioPatterns | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    } else {
        Write-Host "  ✅ Bio: No broken patterns detected" -ForegroundColor Green
    }
    
    # Check prompt interpretation (for ex-mercenary prompt)
    $promptKeywords = @("mercenary", "peace", "meditation", "wandering", "help", "poor", "defend", "weak")
    $foundKeywords = @()
    $allTextLower = "$bio $backstory".ToLower()
    foreach ($keyword in $promptKeywords) {
        if ($allTextLower -match $keyword) {
            $foundKeywords += $keyword
        }
    }
    if ($foundKeywords.Count -ge 3) {
        Write-Host "  ✅ Prompt interpretation: Found $($foundKeywords.Count)/$($promptKeywords.Count) keywords" -ForegroundColor Green
        Write-Host "    Found: $($foundKeywords -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  Prompt interpretation: Only found $($foundKeywords.Count)/$($promptKeywords.Count) keywords" -ForegroundColor Yellow
        if ($foundKeywords.Count -gt 0) {
            Write-Host "    Found: $($foundKeywords -join ', ')" -ForegroundColor Gray
        }
    }
    
    # Bio/Backstory quality
    Write-Host "  Bio: $($bio.Substring(0, [Math]::Min(80, $bio.Length)))..." -ForegroundColor Gray
    Write-Host "  Backstory: $($backstory.Substring(0, [Math]::Min(100, $backstory.Length)))..." -ForegroundColor Gray
    
    Write-Host ""
}

Write-Host "`n=== Analysis Complete ===" -ForegroundColor Green

