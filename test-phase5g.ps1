# Phase 5G - Simple API Testing
# Uses proper PowerShell Invoke-WebRequest syntax

$passCount = 0
$failCount = 0

function Test-API {
    param(
        [string]$name,
        [string]$method,
        [string]$url,
        [hashtable]$headers,
        [string]$body
    )
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
            UseBasicParsing = $true
        }
        
        if ($body) {
            $params['Body'] = $body
            $params['ContentType'] = 'application/json'
        }
        
        $response = Invoke-WebRequest @params
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "[PASS] $name (Status: $($response.StatusCode))" -ForegroundColor Green
        global:$passCount++
        return $data
    }
    catch {
        Write-Host "[FAIL] $name - $($_.Exception.Message)" -ForegroundColor Red
        global:$failCount++
        return $null
    }
}

Write-Host "===================================================="
Write-Host "PHASE 5G - API ENDPOINT QA TESTING"
Write-Host "===================================================="
Write-Host ""

# Test 1: Admin Login
Write-Host "TEST 1: Admin Login"
$loginBody = @{
    email = "admin@edutalk.com"
    password = "AdminPassword123!"
} | ConvertTo-Json

try {
    $loginResp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginBody `
        -UseBasicParsing
    
    $login = $loginResp.Content | ConvertFrom-Json
    $token = $login.token
    Write-Host "[PASS] Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    $passCount++
}
catch {
    Write-Host "[FAIL] Login failed - $($_.Exception.Message)" -ForegroundColor Red
    $failCount++
    exit 1
}

# Set up headers for authenticated requests
$authHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 2: Get Commission Settings
Write-Host ""
Write-Host "TEST 2: Get Commission Settings"
$commData = Test-API -name "Commission Settings" `
    -method GET `
    -url "http://localhost:5000/api/admin/commission-settings" `
    -headers $authHeaders

if ($commData) {
    Write-Host "  Starter: $($commData.commissionRates.starter)%" -ForegroundColor Gray
    Write-Host "  Growth: $($commData.commissionRates.growth)%" -ForegroundColor Gray
    Write-Host "  Pro: $($commData.commissionRates.pro)%" -ForegroundColor Gray
    Write-Host "  Elite: $($commData.commissionRates.elite)%" -ForegroundColor Gray
}

# Test 3: Update Commission Rate
Write-Host ""
Write-Host "TEST 3: Update Commission Rate (Starter to 24%)"
$updateBody = @{
    tier = "starter"
    rate = 24
} | ConvertTo-Json

Test-API -name "Update Commission Rate" `
    -method PUT `
    -url "http://localhost:5000/api/admin/commission-settings" `
    -headers $authHeaders `
    -body $updateBody | Out-Null

# Test 4: Get Email Templates
Write-Host ""
Write-Host "TEST 4: Get Email Templates"
$templateData = Test-API -name "Email Templates" `
    -method GET `
    -url "http://localhost:5000/api/admin/email-templates" `
    -headers $authHeaders

if ($templateData) {
    Write-Host "  Total: $($templateData.templates.Count) templates" -ForegroundColor Gray
    $templateData.templates | ForEach-Object {
        Write-Host "    - $($_.type)" -ForegroundColor Gray
    }
}

# Test 5: Update Email Template
Write-Host ""
Write-Host "TEST 5: Update Email Template"
$templateUpdateBody = @{
    templateType = "rejection"
    subject = "Your Content Was Rejected"
    body = "Thank you for your submission. It does not meet our guidelines."
} | ConvertTo-Json

Test-API -name "Update Email Template" `
    -method PUT `
    -url "http://localhost:5000/api/admin/email-templates" `
    -headers $authHeaders `
    -body $templateUpdateBody | Out-Null

# Test 6: Get Feature Flags
Write-Host ""
Write-Host "TEST 6: Get Feature Flags"
$flagData = Test-API -name "Feature Flags" `
    -method GET `
    -url "http://localhost:5000/api/admin/feature-flags" `
    -headers $authHeaders

if ($flagData) {
    Write-Host "  Total: $($flagData.flags.Count) flags" -ForegroundColor Gray
    $flagData.flags | ForEach-Object {
        $status = if ($_.enabled) { "ENABLED" } else { "DISABLED" }
        Write-Host "    - $($_.name): $status" -ForegroundColor Gray
    }
}

# Test 7: Toggle Feature Flag
Write-Host ""
Write-Host "TEST 7: Toggle Feature Flag"
$flagToggleBody = @{
    featureId = "live-streaming"
    enabled = $true
    rolloutPercentage = 50
} | ConvertTo-Json

Test-API -name "Toggle Feature Flag" `
    -method PUT `
    -url "http://localhost:5000/api/admin/feature-flags" `
    -headers $authHeaders `
    -body $flagToggleBody | Out-Null

# Test 8: Get Audit Logs
Write-Host ""
Write-Host "TEST 8: Get Audit Logs"
$logsData = Test-API -name "Audit Logs" `
    -method GET `
    -url "http://localhost:5000/api/admin/audit-logs" `
    -headers $authHeaders

if ($logsData) {
    Write-Host "  Total logs: $($logsData.total)" -ForegroundColor Gray
    Write-Host "  Returned: $($logsData.logs.Count)" -ForegroundColor Gray
    if ($logsData.logs.Count -gt 0) {
        Write-Host "  Most recent: $($logsData.logs[0].action)" -ForegroundColor Gray
    }
}

# Test 9: Get Audit Logs with Filter
Write-Host ""
Write-Host "TEST 9: Get Audit Logs (with filter)"
Test-API -name "Audit Logs (filtered)" `
    -method GET `
    -url "http://localhost:5000/api/admin/audit-logs?limit=5" `
    -headers $authHeaders | Out-Null

# Test 10: Invalid Token
Write-Host ""
Write-Host "TEST 10: Invalid Token Rejection"
$badHeaders = @{"Authorization"="Bearer invalid_token_xyz"}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/commission-settings" `
        -Method GET `
        -Headers $badHeaders `
        -UseBasicParsing -ErrorAction Stop
    Write-Host "[FAIL] Should reject invalid token" -ForegroundColor Red
    $failCount++
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Message -like "*401*") {
        Write-Host "[PASS] Invalid token rejected (401)" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "[FAIL] Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

# Summary
Write-Host ""
Write-Host "===================================================="
Write-Host "TEST SUMMARY"
Write-Host "===================================================="
$total = $passCount + $failCount
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "PASSED: $passCount" -ForegroundColor Green
Write-Host "FAILED: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: All Phase 5G tests passed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "WARNING: Some tests failed. Review output above." -ForegroundColor Yellow
}
