# Check NPC images in database
# Run this to verify if NPCs have image_url values

param(
    [string]$WorldId = ""
)

Write-Host "`n=== Checking NPC Images ===" -ForegroundColor Cyan

# Load environment variables
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
    Write-Host "ERROR: Supabase credentials not found" -ForegroundColor Red
    exit 1
}

# Use Supabase REST API to query
$headers = @{
    "apikey" = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
}

$url = "$SupabaseUrl/rest/v1/world_npc"
if ($WorldId) {
    $url += "?world_id=eq.$WorldId"
}
$url += "&select=id,name,image_url,created_at"

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    
    if ($response.Count -eq 0) {
        Write-Host "No NPCs found" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "`nFound $($response.Count) NPC(s):`n" -ForegroundColor Green
    
    $withImages = 0
    $withoutImages = 0
    
    foreach ($npc in $response) {
        $hasImage = $npc.image_url -and $npc.image_url -ne ""
        if ($hasImage) {
            $withImages++
            Write-Host "✓ $($npc.name)" -ForegroundColor Green
            Write-Host "  Image URL: $($npc.image_url)" -ForegroundColor Gray
        } else {
            $withoutImages++
            Write-Host "✗ $($npc.name)" -ForegroundColor Red
            Write-Host "  No image URL" -ForegroundColor Gray
        }
        Write-Host "  Created: $($npc.created_at)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "`nSummary:" -ForegroundColor Cyan
    Write-Host "  With images: $withImages" -ForegroundColor Green
    if ($withoutImages -gt 0) {
        Write-Host "  Without images: $withoutImages" -ForegroundColor Red
    } else {
        Write-Host "  Without images: $withoutImages" -ForegroundColor Green
    }
    
} catch {
    Write-Host "ERROR: Failed to query NPCs" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

