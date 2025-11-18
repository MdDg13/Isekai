# Populate feats, classes, races, subclasses, backgrounds

param(
    [string]$InputDir = "data/free5e/processed",
    [int]$BatchSize = 50,
    [switch]$DryRun = $false
)

# Load environment variables
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local not found" -ForegroundColor Red
    exit 1
}

$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

$SupabaseUrl = $envVars['NEXT_PUBLIC_SUPABASE_URL']
$ServiceRoleKey = $envVars['SUPABASE_SERVICE_ROLE_KEY']

if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
    Write-Host "ERROR: Missing required environment variables" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Populating Feats, Classes, Subclasses, Races ===" -ForegroundColor Cyan

# Reuse Insert-Batch function from populate-reference-tables.ps1
function Insert-Batch {
    param(
        [string]$Table,
        [array]$Batch,
        [string]$SupabaseUrl,
        [string]$ServiceRoleKey
    )
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would insert $($Batch.Count) records into $Table" -ForegroundColor Gray
        return @{ success = $true; count = $Batch.Count }
    }
    
    # Get all unique keys
    $allKeys = @()
    foreach ($item in $Batch) {
        $props = if ($item -is [hashtable]) { $item.Keys } else { $item.PSObject.Properties.Name }
        foreach ($key in $props) {
            if ($allKeys -notcontains $key) {
                $allKeys += $key
            }
        }
    }
    
    # Clean batch data
    $cleanedBatch = $Batch | ForEach-Object {
        $item = @{}
        $sourceProps = if ($_ -is [hashtable]) { $_.Keys } else { $_.PSObject.Properties.Name }
        foreach ($key in $allKeys) {
            if ($sourceProps -contains $key) {
                $value = if ($_ -is [hashtable]) { $_[$key] } else { $_.$key }
                $item[$key] = $value
            } else {
                $item[$key] = $null
            }
        }
        $item
    }
    
    try {
        $body = $cleanedBatch | ConvertTo-Json -Depth 10 -Compress:$false -ErrorAction Stop
        $utf8 = New-Object System.Text.UTF8Encoding $false
        $bodyBytes = $utf8.GetBytes($body)
        
        $headers = @{
            "apikey" = $ServiceRoleKey
            "Authorization" = "Bearer $ServiceRoleKey"
            "Content-Type" = "application/json"
            "Prefer" = "return=representation,resolution=merge-duplicates"
        }
        
        $conflictColumns = "name,source"
        $url = "$SupabaseUrl/rest/v1/$Table`?on_conflict=$conflictColumns"
        
        $response = Invoke-WebRequest -Uri $url -Method Post -Headers $headers -Body $bodyBytes -ContentType "application/json; charset=utf-8" -ErrorAction Stop
        $responseData = $response.Content | ConvertFrom-Json
        return @{ success = $true; count = if ($responseData -is [array]) { $responseData.Count } else { 1 }; data = $responseData }
    }
    catch {
        $errorDetails = $_.ErrorDetails.Message
        return @{ success = $false; error = $errorDetails }
    }
}

# Process feats
$FeatsFile = Join-Path $InputDir "feats-final.json"
if (-not (Test-Path $FeatsFile)) {
    $FeatsFile = Join-Path $InputDir "feats-extracted.json"
}
if (Test-Path $FeatsFile) {
    Write-Host "Processing feats..." -ForegroundColor Yellow
    try {
        $feats = Get-Content -Path $FeatsFile -Raw | ConvertFrom-Json
        
        $preparedFeats = $feats | ForEach-Object {
            @{
                name = $_.name
                prerequisites = $_.prerequisites
                benefits = $_.benefits
                description = $_.description
                source = if ($_.source) { $_.source } else { "Free5e" }
                page_reference = if ($null -ne $_.page_reference -and $_.page_reference -ne '') { $_.page_reference } else { $null }
                tags = if ($null -ne $_.tags -and $_.tags.Count -gt 0) { $_.tags } else { $null }
                extraction_confidence_score = $_.extraction_confidence_score
            }
        }
        
        for ($i = 0; $i -lt $preparedFeats.Count; $i += $BatchSize) {
            $batch = $preparedFeats[$i..([Math]::Min($i + $BatchSize - 1, $preparedFeats.Count - 1))]
            $result = Insert-Batch -Table "reference_feat" -Batch $batch -SupabaseUrl $SupabaseUrl -ServiceRoleKey $ServiceRoleKey
            
            if ($result.success) {
                Write-Host "  Inserted batch $([Math]::Floor($i / $BatchSize) + 1): $($result.count) feats" -ForegroundColor Green
            } else {
                Write-Host "  ERROR: Failed to insert batch: $($result.error)" -ForegroundColor Red
            }
        }
        
        Write-Host "  Total: $($preparedFeats.Count) feats processed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: Failed to process feats: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Process classes
$ClassesFile = Join-Path $InputDir "classes-final.json"
if (-not (Test-Path $ClassesFile)) {
    $ClassesFile = Join-Path $InputDir "classes-extracted.json"
}
if (Test-Path $ClassesFile) {
    Write-Host "Processing classes..." -ForegroundColor Yellow
    try {
        $classes = Get-Content -Path $ClassesFile -Raw | ConvertFrom-Json
        
        $preparedClasses = $classes | ForEach-Object {
            @{
                name = $_.name
                hit_dice = $_.hit_dice
                hit_points_at_1st_level = $_.hit_points_at_1st_level
                hit_points_at_higher_levels = $_.hit_points_at_higher_levels
                proficiencies = if ($null -ne $_.proficiencies) { ($_.proficiencies | ConvertTo-Json -Compress) } else { $null }
                starting_equipment = if ($null -ne $_.starting_equipment) { ($_.starting_equipment | ConvertTo-Json -Compress) } else { $null }
                multiclassing = if ($null -ne $_.multiclassing) { ($_.multiclassing | ConvertTo-Json -Compress) } else { $null }
                class_features = if ($null -ne $_.class_features -and $_.class_features.Count -gt 0) { ($_.class_features | ConvertTo-Json -Compress) } else { $null }
                spellcasting = if ($null -ne $_.spellcasting) { ($_.spellcasting | ConvertTo-Json -Compress) } else { $null }
                source = if ($_.source) { $_.source } else { "Free5e" }
                page_reference = if ($null -ne $_.page_reference -and $_.page_reference -ne '') { $_.page_reference } else { $null }
                tags = if ($null -ne $_.tags -and $_.tags.Count -gt 0) { $_.tags } else { $null }
                extraction_confidence_score = $_.extraction_confidence_score
            }
        }
        
        for ($i = 0; $i -lt $preparedClasses.Count; $i += $BatchSize) {
            $batch = $preparedClasses[$i..([Math]::Min($i + $BatchSize - 1, $preparedClasses.Count - 1))]
            $result = Insert-Batch -Table "reference_class" -Batch $batch -SupabaseUrl $SupabaseUrl -ServiceRoleKey $ServiceRoleKey
            
            if ($result.success) {
                Write-Host "  Inserted batch $([Math]::Floor($i / $BatchSize) + 1): $($result.count) classes" -ForegroundColor Green
            } else {
                Write-Host "  ERROR: Failed to insert batch: $($result.error)" -ForegroundColor Red
            }
        }
        
        Write-Host "  Total: $($preparedClasses.Count) classes processed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: Failed to process classes: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Process subclasses
$SubclassesFile = Join-Path $InputDir "subclasses-final.json"
if (-not (Test-Path $SubclassesFile)) {
    $SubclassesFile = Join-Path $InputDir "subclasses-pdf-extracted.json"
}
if (Test-Path $SubclassesFile) {
    Write-Host "Processing subclasses..." -ForegroundColor Yellow
    try {
        $subclasses = Get-Content -Path $SubclassesFile -Raw | ConvertFrom-Json
        
        $preparedSubclasses = $subclasses | ForEach-Object {
            @{
                name = $_.name
                parent_class = $_.parent_class
                level_granted = if ($null -ne $_.level_granted) { $_.level_granted } else { 2 }
                description = $_.description
                features = if ($null -ne $_.features -and $_.features.Count -gt 0) { ($_.features | ConvertTo-Json -Compress) } else { $null }
                source = if ($_.source) { $_.source } else { "Free5e" }
                page_reference = if ($null -ne $_.page_reference -and $_.page_reference -ne '') { $_.page_reference } else { $null }
                tags = if ($null -ne $_.tags -and $_.tags.Count -gt 0) { $_.tags } else { $null }
                extraction_confidence_score = $_.extraction_confidence_score
            }
        }
        
        for ($i = 0; $i -lt $preparedSubclasses.Count; $i += $BatchSize) {
            $batch = $preparedSubclasses[$i..([Math]::Min($i + $BatchSize - 1, $preparedSubclasses.Count - 1))]
            $result = Insert-Batch -Table "reference_subclass" -Batch $batch -SupabaseUrl $SupabaseUrl -ServiceRoleKey $ServiceRoleKey
            
            if ($result.success) {
                Write-Host "  Inserted batch $([Math]::Floor($i / $BatchSize) + 1): $($result.count) subclasses" -ForegroundColor Green
            } else {
                Write-Host "  ERROR: Failed to insert batch: $($result.error)" -ForegroundColor Red
            }
        }
        
        Write-Host "  Total: $($preparedSubclasses.Count) subclasses processed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: Failed to process subclasses: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Process races
$RacesFile = Join-Path $InputDir "races-final.json"
if (-not (Test-Path $RacesFile)) {
    $RacesFile = Join-Path $InputDir "races-extracted.json"
}
if (Test-Path $RacesFile) {
    Write-Host "Processing races..." -ForegroundColor Yellow
    try {
        $races = Get-Content -Path $RacesFile -Raw | ConvertFrom-Json
        
        $preparedRaces = $races | ForEach-Object {
            @{
                name = $_.name
                size = $_.size
                speed = $_.speed
                ability_score_increases = if ($null -ne $_.ability_score_increases) { ($_.ability_score_increases | ConvertTo-Json -Compress) } else { '{"choose": 1, "from": ["str", "dex", "con", "int", "wis", "cha"]}' }
                traits = if ($null -ne $_.traits -and $_.traits.Count -gt 0) { ($_.traits | ConvertTo-Json -Compress) } else { $null }
                languages = if ($null -ne $_.languages -and $_.languages.Count -gt 0) { $_.languages } else { @() }
                subraces = if ($null -ne $_.subraces -and $_.subraces.Count -gt 0) { ($_.subraces | ConvertTo-Json -Compress) } else { $null }
                source = if ($_.source) { $_.source } else { "Free5e" }
                page_reference = if ($null -ne $_.page_reference -and $_.page_reference -ne '') { $_.page_reference } else { $null }
                tags = if ($null -ne $_.tags -and $_.tags.Count -gt 0) { $_.tags } else { $null }
                extraction_confidence_score = $_.extraction_confidence_score
            }
        }
        
        for ($i = 0; $i -lt $preparedRaces.Count; $i += $BatchSize) {
            $batch = $preparedRaces[$i..([Math]::Min($i + $BatchSize - 1, $preparedRaces.Count - 1))]
            $result = Insert-Batch -Table "reference_race" -Batch $batch -SupabaseUrl $SupabaseUrl -ServiceRoleKey $ServiceRoleKey
            
            if ($result.success) {
                Write-Host "  Inserted batch $([Math]::Floor($i / $BatchSize) + 1): $($result.count) races" -ForegroundColor Green
            } else {
                Write-Host "  ERROR: Failed to insert batch: $($result.error)" -ForegroundColor Red
            }
        }
        
        Write-Host "  Total: $($preparedRaces.Count) races processed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: Failed to process races: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Upload Complete ===`n" -ForegroundColor Cyan

