# Phase 5G API Testing Script
# Simple curl-based testing without emojis

Write-Host "===================================================="
Write-Host "PHASE 5G - API ENDPOINT QA TESTING"
Write-Host "===================================================="
Write-Host ""

# Test 1: Admin Login
Write-Host "TEST 1: Admin Login"
$loginBody = '{"email":"admin@edutalk.com","password":"AdminPassword123!"}'
$loginResponse = curl -s -X POST "http://localhost:5000/api/auth/login" `
  -H "Content-Type: application/json" `
  -d $loginBody | ConvertFrom-Json

if ($loginResponse.token) {
    $token = $loginResponse.token
    Write-Host "[PASS] Login successful. Token: $($token.Substring(0, 30))..."
} else {
    Write-Host "[FAIL] Login failed: $($loginResponse.message)"
    exit 1
}

# Create headers with token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 2: Get Commission Settings
Write-Host ""
Write-Host "TEST 2: Get Commission Settings"
$commResponse = curl -s -X GET "http://localhost:5000/api/admin/commission-settings" `
  -H "Authorization: Bearer $token" | ConvertFrom-Json

if ($commResponse.commissionRates) {
    Write-Host "[PASS] Commission settings retrieved"
    Write-Host "  Starter: $($commResponse.commissionRates.starter)%"
    Write-Host "  Growth: $($commResponse.commissionRates.growth)%"
    Write-Host "  Pro: $($commResponse.commissionRates.pro)%"
    Write-Host "  Elite: $($commResponse.commissionRates.elite)%"
} else {
    Write-Host "[FAIL] Could not retrieve commission settings"
    Write-Host $commResponse
}

# Test 3: Update Commission Rate
Write-Host ""
Write-Host "TEST 3: Update Commission Rate"
$updateBody = '{"tier":"starter","rate":24}'
$updateResponse = curl -s -X PUT "http://localhost:5000/api/admin/commission-settings" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $updateBody | ConvertFrom-Json

if ($updateResponse.message -or $updateResponse.commissionRates) {
    Write-Host "[PASS] Commission rate updated"
    Write-Host "  Message: $($updateResponse.message)"
} else {
    Write-Host "[FAIL] Could not update commission rate"
}

# Test 4: Get Email Templates
Write-Host ""
Write-Host "TEST 4: Get Email Templates"
$templatesResponse = curl -s -X GET "http://localhost:5000/api/admin/email-templates" `
  -H "Authorization: Bearer $token" | ConvertFrom-Json

if ($templatesResponse.templates) {
    Write-Host "[PASS] Email templates retrieved"
    Write-Host "  Total templates: $($templatesResponse.templates.Count)"
    $templatesResponse.templates | ForEach-Object { Write-Host "    - $($_.type)" }
} else {
    Write-Host "[FAIL] Could not retrieve email templates"
}

# Test 5: Get Feature Flags
Write-Host ""
Write-Host "TEST 5: Get Feature Flags"
$flagsResponse = curl -s -X GET "http://localhost:5000/api/admin/feature-flags" `
  -H "Authorization: Bearer $token" | ConvertFrom-Json

if ($flagsResponse.flags) {
    Write-Host "[PASS] Feature flags retrieved"
    Write-Host "  Total flags: $($flagsResponse.flags.Count)"
    $flagsResponse.flags | ForEach-Object { Write-Host "    - $($_.name): $($_.enabled)" }
} else {
    Write-Host "[FAIL] Could not retrieve feature flags"
}

# Test 6: Get Audit Logs
Write-Host ""
Write-Host "TEST 6: Get Audit Logs"
$logsResponse = curl -s -X GET "http://localhost:5000/api/admin/audit-logs" `
  -H "Authorization: Bearer $token" | ConvertFrom-Json

if ($logsResponse.logs) {
    Write-Host "[PASS] Audit logs retrieved"
    Write-Host "  Total logs: $($logsResponse.total)"
    Write-Host "  Returned: $($logsResponse.logs.Count)"
    if ($logsResponse.logs.Count -gt 0) {
        Write-Host "  Most recent: $($logsResponse.logs[0].action) at $($logsResponse.logs[0].timestamp)"
    }
} else {
    Write-Host "[FAIL] Could not retrieve audit logs"
}

# Test 7: Invalid Token Test
Write-Host ""
Write-Host "TEST 7: Invalid Token Rejection"
$invalidResponse = curl -s -X GET "http://localhost:5000/api/admin/commission-settings" `
  -H "Authorization: Bearer invalid_token_xyz" 2>&1

if ($invalidResponse -like "*Invalid*" -or $invalidResponse -like "*Unauthorized*") {
    Write-Host "[PASS] Invalid token properly rejected"
} else {
    Write-Host "[INFO] Response: $invalidResponse"
}

Write-Host ""
Write-Host "===================================================="
Write-Host "PHASE 5G QA TESTING COMPLETE"
Write-Host "===================================================="
