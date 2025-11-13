# Generate 5 example NPCs to demonstrate proper prompt interpretation
# This script creates example NPCs that correctly interpret: "shy dwarf, training to become a wizard, against parent's wishes"

param(
    [Parameter(Mandatory=$false)]
    [string]$WorldId = "9d3f8a90-4f31-43cf-9431-f3df1517459e"
)

# Load environment variables from .env.local
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
if (-not $supabaseUrl) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_URL must be set in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Generating 5 Example NPCs ===" -ForegroundColor Cyan
Write-Host "Prompt: 'shy dwarf, training to become a wizard, against parent's wishes'" -ForegroundColor Yellow
Write-Host "Level: 1`n" -ForegroundColor Yellow

# Example NPCs that properly interpret the prompt
$examples = @(
    @{
        name = "Thorin Spellweaver"
        keywords = "shy, dwarf, wizard, apprentice, against parents wishes"
        description = "A timid dwarf who secretly studies magic despite family's mining tradition"
    },
    @{
        name = "Balin Ironforge"
        keywords = "dwarf, shy, wizard training, family disapproval"
        description = "A reserved dwarf apprentice mage, hiding magical studies from warrior parents"
    },
    @{
        name = "Gareth Runestone"
        keywords = "shy dwarf, becoming wizard, parent conflict"
        description = "A quiet dwarf breaking from clan's warrior path to pursue arcane arts"
    },
    @{
        name = "Dorin Brightforge"
        keywords = "dwarf, timid, wizard apprentice, family opposition"
        description = "A bashful dwarf secretly learning magic, defying traditionalist parents"
    },
    @{
        name = "Korin Deepdelver"
        keywords = "shy, dwarf, wizard training, against wishes"
        description = "A withdrawn dwarf studying spells in secret, against miner family's expectations"
    }
)

$headers = @{
    "Content-Type" = "application/json"
}

$successCount = 0
$failCount = 0

foreach ($example in $examples) {
    Write-Host "Generating: $($example.name)" -ForegroundColor Cyan
    Write-Host "  Keywords: $($example.keywords)" -ForegroundColor Gray
    Write-Host "  Expected: $($example.description)" -ForegroundColor Gray
    
    $tags = $example.keywords -split ',' | ForEach-Object { $_.Trim() }
    
    $body = @{
        worldId = $WorldId
        level = 1
        tags = $tags
        ruleset = "DND5E_2024"
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-world-npc" -Method Post -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "  ✅ Success: NPC created" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Response: $responseBody" -ForegroundColor Red
        }
        $failCount++
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2  # Rate limiting
}

Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host "`nCheck the world NPCs list to see the generated characters." -ForegroundColor Yellow

