# Check what's actually in the database

param(
    [string]$Table = ""
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

$headers = @{
    "apikey" = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Prefer" = "count=exact"
}

$tables = @("reference_feat", "reference_item", "reference_spell", "reference_monster", "reference_class", "reference_race", "reference_background")

foreach ($t in $tables) {
    if ($Table -and $t -ne $Table) { continue }
    
    try {
        $url = "$SupabaseUrl/rest/v1/$t?select=name,source&limit=1"
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        $count = $response.Count
        
        # Get actual count
        $countUrl = "$SupabaseUrl/rest/v1/$t?select=id&limit=0"
        $countResponse = Invoke-WebRequest -Uri $countUrl -Method Head -Headers $headers
        $totalCount = if ($countResponse.Headers['Content-Range']) {
            $range = $countResponse.Headers['Content-Range']
            if ($range -match '/(\d+)$') {
                $matches[1]
            } else { "?" }
        } else { "?" }
        
        Write-Host "$t : $totalCount records" -ForegroundColor $(if ($t -eq "reference_feat" -and [int]$totalCount -gt 100) { "Red" } elseif ($t -eq "reference_item" -and [int]$totalCount -lt 500) { "Yellow" } else { "Green" })
        
        # Sample a few names
        $sampleUrl = "$SupabaseUrl/rest/v1/$t?select=name,source&limit=10"
        $sample = Invoke-RestMethod -Uri $sampleUrl -Method Get -Headers $headers
        if ($sample -and $sample.Count -gt 0) {
            Write-Host "  Sample: $($sample[0..4].name -join ', ')" -ForegroundColor Gray
        }
    } catch {
        Write-Host "$t : ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
}

