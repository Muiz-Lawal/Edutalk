param(
  [string]$StagingHost = '',
  [string]$StagingUser = '',
  [string]$StagingPath = '/var/www/edutalk-staging',
  [string]$SshKeyPath = ''
)

if (-not $StagingHost) {
  Write-Output 'Please set $StagingHost and $StagingUser before running this script.'
  exit 1
}

# Build frontend
Write-Output 'Building frontend...'
Push-Location -Path "..\frontend"
npm ci
npm run build
Pop-Location

# Create a temporary package directory
$packageDir = Join-Path $env:TEMP "edutalk_staging_$(Get-Date -Format yyyyMMddHHmmss)"
New-Item -ItemType Directory -Path $packageDir | Out-Null

# Copy frontend build
Copy-Item -Path "..\frontend\dist\*" -Destination (Join-Path $packageDir 'frontend') -Recurse -Force

# Copy backend source (excluding node_modules)
Copy-Item -Path "..\backend\src" -Destination (Join-Path $packageDir 'backend\src') -Recurse -Force
Copy-Item -Path "..\backend\package.json" -Destination (Join-Path $packageDir 'backend') -Force

Write-Output "Package created at: $packageDir"

# Upload to staging via scp (user should provide SSH key or have agent)
if ($SshKeyPath -ne '') {
  $scpKeyArg = "-i $SshKeyPath"
} else {
  $scpKeyArg = ''
}

Write-Output "Ready to upload to $StagingUser@$StagingHost:$StagingPath"
Write-Output "Use the following command (run locally with appropriate SSH access):"
Write-Output "scp -r $packageDir/* $StagingUser@$StagingHost:$StagingPath"

Write-Output "After upload, on the staging host run:"
Write-Output "  cd $StagingPath/backend && npm ci && pm2 restart edutalk-staging --update-env"
Write-Output "  cd $StagingPath/frontend && (serve dist or configure nginx to point to dist)"

Write-Output 'Note: This script is a helper to prepare artifacts for manual upload. It does not perform remote operations by itself.'
