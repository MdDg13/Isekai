# Free5e Reference Table Population Script
# Inserts processed Free5e data into Supabase reference tables

param(
    [string]$InputDir = "data/free5e/processed",
    [int]$BatchSize = 100,
    [switch]$DryRun = $false
)

# Load environment variables
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local not found" -ForegroundColor Red
    Write-Host "Required variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
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

Write-Host "`n=== Free5e Reference Table Population ===" -ForegroundColor Cyan
Write-Host "Input directory: $InputDir" -ForegroundColor Gray
Write-Host "Batch size: $BatchSize" -ForegroundColor Gray
Write-Host "Dry run: $DryRun`n" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "DRY RUN MODE - No data will be inserted" -ForegroundColor Yellow
}

# Statistics
$Stats = @{
    Items = @{ Processed = 0; Inserted = 0; Errors = 0 }
    Spells = @{ Processed = 0; Inserted = 0; Errors = 0 }
    Monsters = @{ Processed = 0; Inserted = 0; Errors = 0 }
    Classes = @{ Processed = 0; Inserted = 0; Errors = 0 }
    Races = @{ Processed = 0; Inserted = 0; Errors = 0 }
    Backgrounds = @{ Processed = 0; Inserted = 0; Errors = 0 }
    Feats = @{ Processed = 0; Inserted = 0; Errors = 0 }
}

# Function to insert batch via API
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
    
    # Get all unique keys from all objects in the batch (PostgREST requires matching keys)
    $allKeys = @()
    foreach ($item in $Batch) {
        $props = if ($item -is [hashtable]) { $item.Keys } else { $item.PSObject.Properties.Name }
        foreach ($key in $props) {
            if ($allKeys -notcontains $key) {
                $allKeys += $key
            }
        }
    }
    
    # Clean the batch data - ensure ALL objects have ALL keys
    $cleanedBatch = $Batch | ForEach-Object {
        $item = @{}
        $sourceProps = if ($_ -is [hashtable]) { $_.Keys } else { $_.PSObject.Properties.Name }
        
        # Add all keys to every object (use null for missing ones)
        foreach ($key in $allKeys) {
            if ($sourceProps -contains $key) {
                $value = if ($_ -is [hashtable]) { $_[$key] } else { $_.$key }
                # Include the value (even if null) to maintain key structure
                $item[$key] = $value
            } else {
                # Key missing - add as null
                $item[$key] = $null
            }
        }
        $item
    }
    
    if ($cleanedBatch.Count -eq 0) {
        return @{ success = $false; error = "No valid records in batch after cleaning" }
    }
    
    # Convert to JSON with proper encoding
    try {
        $body = $cleanedBatch | ConvertTo-Json -Depth 10 -Compress:$false -ErrorAction Stop
        if ([string]::IsNullOrWhiteSpace($body)) {
            return @{ success = $false; error = "JSON conversion resulted in empty string" }
        }
        
        # Validate JSON by trying to parse it back
        try {
            $null = $body | ConvertFrom-Json -ErrorAction Stop
        } catch {
            return @{ success = $false; error = "Generated JSON is invalid: $($_.Exception.Message)" }
        }
    }
    catch {
        return @{ success = $false; error = "JSON conversion failed: $($_.Exception.Message)" }
    }
    
    $headers = @{
        "apikey" = $ServiceRoleKey
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation,resolution=merge-duplicates"
    }
    
    # Determine conflict columns based on table
    $conflictColumns = switch ($Table) {
        "reference_item" { "name,source" }
        "reference_spell" { "name,source" }
        "reference_monster" { "name,source" }
        "reference_class" { "name,source" }
        "reference_race" { "name,source" }
        "reference_feat" { "name,source" }
        "reference_background" { "name,source" }
        default { "name,source" }
    }
    
    $url = "$SupabaseUrl/rest/v1/$Table`?on_conflict=$conflictColumns"
    
    try {
        # Convert body to UTF-8 bytes explicitly
        $utf8 = New-Object System.Text.UTF8Encoding $false
        $bodyBytes = $utf8.GetBytes($body)
        
        # Use Invoke-WebRequest for better control over the request
        $response = Invoke-WebRequest -Uri $url -Method Post -Headers $headers -Body $bodyBytes -ContentType "application/json; charset=utf-8" -ErrorAction Stop
        $responseData = $response.Content | ConvertFrom-Json
        return @{ success = $true; count = if ($responseData -is [array]) { $responseData.Count } else { 1 }; data = $responseData }
    }
    catch {
        $errorDetails = $_.ErrorDetails.Message
        $fullError = $_.Exception.Message
        
        if ($errorDetails) {
            try {
                $errorJson = $errorDetails | ConvertFrom-Json
                $errorMessage = $errorJson.message
                if ($errorJson.details) {
                    $errorMessage += " | Details: $($errorJson.details)"
                }
                if ($errorJson.hint) {
                    $errorMessage += " | Hint: $($errorJson.hint)"
                }
            } catch {
                $errorMessage = $errorDetails
            }
        } else {
            $errorMessage = $fullError
        }
        
        # Log more details for debugging
        Write-Host "    Debug: Batch size: $($cleanedBatch.Count), JSON length: $($body.Length)" -ForegroundColor Gray
        Write-Host "    Debug: Full error: $fullError" -ForegroundColor Yellow
        if ($errorDetails) {
            Write-Host "    Debug: Error details: $errorDetails" -ForegroundColor Yellow
        }
        if ($body.Length -lt 500) {
            Write-Host "    Debug: JSON preview: $($body.Substring(0, [Math]::Min(500, $body.Length)))" -ForegroundColor Gray
        }
        
        return @{ success = $false; error = $errorMessage }
    }
}

# Process items
$ItemsFile = Join-Path $InputDir "items-final.json"
if (-not (Test-Path $ItemsFile)) {
    $ItemsFile = Join-Path $InputDir "items-merged.json"
}
if (Test-Path $ItemsFile) {
    Write-Host "Processing items..." -ForegroundColor Yellow
    try {
        $itemsRaw = Get-Content -Path $ItemsFile -Raw | ConvertFrom-Json
        # Filter out empty objects
        $items = $itemsRaw | Where-Object { $_.name -and ($_.name -ne '') }
        
        if ($items.Count -eq 0) {
            Write-Host "  No valid items found (all empty)" -ForegroundColor Yellow
        } else {
            Write-Host "  Found $($items.Count) valid items (filtered from $($itemsRaw.Count))" -ForegroundColor Gray
        }
        
        # Prepare items for insertion
        $preparedItems = $items | ForEach-Object {
            @{
                name = $_.name
                kind = $_.kind
                category = $_.category
                rarity = $_.rarity
                cost_gp = $_.cost_gp
                cost_breakdown = if ($null -ne $_.cost_breakdown) { ($_.cost_breakdown | ConvertTo-Json -Compress) } else { $null }
                weight_lb = $_.weight_lb
                weight_kg = $_.weight_kg
                estimated_real_weight_kg = $_.estimated_real_weight_kg
                volume_category = $_.volume_category
                extraction_confidence_score = $_.extraction_confidence_score
                description = $_.description
                properties = $_.properties
                attunement = $_.attunement
                attunement_requirements = $_.attunement_requirements
                source = if ($_.source) { $_.source } else { "Free5e" }
                page_reference = $_.page_reference
                tags = $_.tags
            }
        }
        
        # Insert in batches
        for ($i = 0; $i -lt $preparedItems.Count; $i += $BatchSize) {
            $batch = $preparedItems[$i..([Math]::Min($i + $BatchSize - 1, $preparedItems.Count - 1))]
            $Stats.Items.Processed += $batch.Count
            
            $result = Insert-Batch -Table "reference_item" -Batch $batch -SupabaseUrl $SupabaseUrl -ServiceRoleKey $ServiceRoleKey
            
            if ($result.success) {
                $Stats.Items.Inserted += $result.count
                Write-Host "  Inserted batch $([Math]::Floor($i / $BatchSize) + 1): $($result.count) items" -ForegroundColor Green
            } else {
                $Stats.Items.Errors += $batch.Count
                Write-Host "  ERROR: Failed to insert batch: $($result.error)" -ForegroundColor Red
            }
        }
        
        Write-Host "  Total: $($Stats.Items.Processed) processed, $($Stats.Items.Inserted) inserted, $($Stats.Items.Errors) errors" -ForegroundColor $(if ($Stats.Items.Errors -eq 0) { "Green" } else { "Red" })
    }
    catch {
        Write-Host "  ERROR: Failed to process items: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Process spells
$SpellsFile = Join-Path $InputDir "spells-final.json"
if (-not (Test-Path $SpellsFile)) {
    $SpellsFile = Join-Path $InputDir "spells-merged.json"
}
if (Test-Path $SpellsFile) {
    Write-Host "Processing spells..." -ForegroundColor Yellow
    try {
        $spells = Get-Content -Path $SpellsFile -Raw | ConvertFrom-Json
        
        $preparedSpells = $spells | ForEach-Object {
            # Ensure all fields are present (PostgREST requires matching keys)
            @{
                name = $_.name
                level = $_.level
                school = $_.school
                casting_time = $_.casting_time
                range = $_.range
                components = $_.components
                material_components = if ($null -ne $_.material_components -and $_.material_components -ne '') { $_.material_components } else { $null }
                duration = $_.duration
                description = $_.description
                higher_level = if ($null -ne $_.higher_level -and $_.higher_level -ne '') { $_.higher_level } else { $null }
                ritual = if ($null -ne $_.ritual) { $_.ritual } else { $false }
                concentration = if ($null -ne $_.concentration) { $_.concentration } else { $false }
                source = if ($_.source) { $_.source } else { "Free5e" }
                page_reference = if ($null -ne $_.page_reference -and $_.page_reference -ne '') { $_.page_reference } else { $null }
                tags = if ($null -ne $_.tags -and $_.tags.Count -gt 0) { $_.tags } else { $null }
                extraction_confidence_score = $_.extraction_confidence_score
            }
        }
        
        for ($i = 0; $i -lt $preparedSpells.Count; $i += $BatchSize) {
            $batch = $preparedSpells[$i..([Math]::Min($i + $BatchSize - 1, $preparedSpells.Count - 1))]
            $Stats.Spells.Processed += $batch.Count
            
            $result = Insert-Batch -Table "reference_spell" -Batch $batch -SupabaseUrl $SupabaseUrl -ServiceRoleKey $ServiceRoleKey
            
            if ($result.success) {
                $Stats.Spells.Inserted += $result.count
                Write-Host "  Inserted batch $([Math]::Floor($i / $BatchSize) + 1): $($result.count) spells" -ForegroundColor Green
            } else {
                $Stats.Spells.Errors += $batch.Count
                Write-Host "  ERROR: Failed to insert batch: $($result.error)" -ForegroundColor Red
            }
        }
        
        Write-Host "  Total: $($Stats.Spells.Processed) processed, $($Stats.Spells.Inserted) inserted, $($Stats.Spells.Errors) errors" -ForegroundColor $(if ($Stats.Spells.Errors -eq 0) { "Green" } else { "Red" })
    }
    catch {
        Write-Host "  ERROR: Failed to process spells: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Process monsters
$MonstersFile = Join-Path $InputDir "monsters-final.json"
if (-not (Test-Path $MonstersFile)) {
    $MonstersFile = Join-Path $InputDir "monsters-merged.json"
}
if (Test-Path $MonstersFile) {
    Write-Host "Processing monsters..." -ForegroundColor Yellow
    try {
        $monsters = Get-Content -Path $MonstersFile -Raw | ConvertFrom-Json
        
        $preparedMonsters = $monsters | ForEach-Object {
            @{
                name = $_.name
                size = $_.size
                type = $_.type
                subtype = $_.subtype
                alignment = $_.alignment
                armor_class = $_.armor_class
                armor_class_type = $_.armor_class_type
                hit_points = $_.hit_points
                hit_dice = $_.hit_dice
                speed = $_.speed
                stats = $_.stats
                saving_throws = $_.saving_throws
                skills = $_.skills
                damage_resistances = $_.damage_resistances
                damage_immunities = $_.damage_immunities
                condition_immunities = $_.condition_immunities
                senses = $_.senses
                languages = $_.languages
                challenge_rating = $_.challenge_rating
                xp = $_.xp
                traits = $_.traits
                actions = $_.actions
                legendary_actions = $_.legendary_actions
                reactions = if ($null -ne $_.reactions -and $_.reactions.Count -gt 0) { ($_.reactions | ConvertTo-Json -Compress) } else { $null }
                lair_actions = if ($null -ne $_.lair_actions -and $_.lair_actions.Count -gt 0) { ($_.lair_actions | ConvertTo-Json -Compress) } else { $null }
                source = if ($_.source) { $_.source } else { "Free5e" }
                page_reference = if ($null -ne $_.page_reference -and $_.page_reference -ne '') { $_.page_reference } else { $null }
                tags = if ($null -ne $_.tags -and $_.tags.Count -gt 0) { $_.tags } else { $null }
                extraction_confidence_score = $_.extraction_confidence_score
            }
        }
        
        for ($i = 0; $i -lt $preparedMonsters.Count; $i += $BatchSize) {
            $batch = $preparedMonsters[$i..([Math]::Min($i + $BatchSize - 1, $preparedMonsters.Count - 1))]
            $Stats.Monsters.Processed += $batch.Count
            
            $result = Insert-Batch -Table "reference_monster" -Batch $batch -SupabaseUrl $SupabaseUrl -ServiceRoleKey $ServiceRoleKey
            
            if ($result.success) {
                $Stats.Monsters.Inserted += $result.count
                Write-Host "  Inserted batch $([Math]::Floor($i / $BatchSize) + 1): $($result.count) monsters" -ForegroundColor Green
            } else {
                $Stats.Monsters.Errors += $batch.Count
                Write-Host "  ERROR: Failed to insert batch: $($result.error)" -ForegroundColor Red
            }
        }
        
        Write-Host "  Total: $($Stats.Monsters.Processed) processed, $($Stats.Monsters.Inserted) inserted, $($Stats.Monsters.Errors) errors" -ForegroundColor $(if ($Stats.Monsters.Errors -eq 0) { "Green" } else { "Red" })
    }
    catch {
        Write-Host "  ERROR: Failed to process monsters: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Generate summary report
Write-Host "`n=== Population Summary ===" -ForegroundColor Cyan
Write-Host "Items: $($Stats.Items.Inserted) inserted, $($Stats.Items.Errors) errors" -ForegroundColor $(if ($Stats.Items.Errors -eq 0) { "Green" } else { "Red" })
Write-Host "Spells: $($Stats.Spells.Inserted) inserted, $($Stats.Spells.Errors) errors" -ForegroundColor $(if ($Stats.Spells.Errors -eq 0) { "Green" } else { "Red" })
Write-Host "Monsters: $($Stats.Monsters.Inserted) inserted, $($Stats.Monsters.Errors) errors" -ForegroundColor $(if ($Stats.Monsters.Errors -eq 0) { "Green" } else { "Red" })

$TotalErrors = $Stats.Items.Errors + $Stats.Spells.Errors + $Stats.Monsters.Errors + 
               $Stats.Classes.Errors + $Stats.Races.Errors + $Stats.Backgrounds.Errors + $Stats.Feats.Errors

if ($TotalErrors -eq 0 -and -not $DryRun) {
    Write-Host "`nAll data successfully inserted into reference tables!" -ForegroundColor Green
} elseif ($DryRun) {
    Write-Host "`nDry run complete. Remove -DryRun flag to perform actual insertion." -ForegroundColor Yellow
} else {
    Write-Host "`n$TotalErrors error(s) occurred during insertion." -ForegroundColor Red
}

