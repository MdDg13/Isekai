Param(
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Error "pg_dump is required. Install PostgreSQL CLI or add it to PATH."
  exit 1
}

if (-not $env:NEXT_PUBLIC_SUPABASE_URL -or -not $env:SUPABASE_SERVICE_ROLE_KEY) {
  Write-Error "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment."
  exit 1
}

$uri = [System.Uri]$env:NEXT_PUBLIC_SUPABASE_URL
$host = $uri.Host
$dbName = "postgres"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$fileName = "supabase-backup-$timestamp.sql"

$fullPath = Join-Path -Path $OutputPath -ChildPath $fileName

Write-Host "Backing up Supabase to $fullPath"

$env:PGPASSWORD = $env:SUPABASE_SERVICE_ROLE_KEY
pg_dump `
  --host=$host `
  --port=5432 `
  --username=postgres `
  --dbname=$dbName `
  --format=custom `
  --verbose `
  --file=$fullPath

if ($LASTEXITCODE -eq 0) {
  Write-Host "Backup complete."
} else {
  Write-Error "Backup failed with exit code $LASTEXITCODE."
}

