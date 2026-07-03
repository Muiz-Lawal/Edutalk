# ============================================================================
# PHASE 5G - API ENDPOINT QA TESTING SCRIPT
# ============================================================================
# Comprehensive testing of all Phase 5G admin endpoints
# Run this script after starting both backend (port 5000) and frontend

# Test Configuration
$API_URL = "http://localhost:5000/api"
$ADMIN_EMAIL = "admin@edutalk.com"
$ADMIN_PASSWORD = "AdminPassword123!"

$passCount = 0
$failCount = 0
$testResults = @()

# Helper Functions
function Test-Endpoint {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers,
        [string]$Body,
        [int]$ExpectedStatus = 200
    )
    
    $testStartTime = Get-Date
    
    try {
        $params = @{
            Uri = "$API_URL$Endpoint"
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params['Body'] = $Body
            $params['ContentType'] = 'application/json'
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        $statusCode = $response.StatusCode
        $responseData = $response.Content | ConvertFrom-Json
        
        $elapsed = ((Get-Date) - $testStartTime).TotalMilliseconds
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ PASS: $TestName ($($statusCode) - ${elapsed}ms)" -ForegroundColor Green
            $passCount++
            $testResults += @{
                Test = $TestName
                Status = "PASS"
                StatusCode = $statusCode
                Time = $elapsed
            }
            return $responseData
        } else {
            Write-Host "❌ FAIL: $TestName (Expected $ExpectedStatus, got $statusCode)" -ForegroundColor Red
            $failCount++
            $testResults += @{
                Test = $TestName
                Status = "FAIL"
                Expected = $ExpectedStatus
                Got = $statusCode
            }
            return $null
        }
    }
    catch {
        $elapsed = ((Get-Date) - $testStartTime).TotalMilliseconds
        Write-Host "❌ FAIL: $TestName - $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
        $testResults += @{
            Test = $TestName
            Status = "ERROR"
            Error = $_.Exception.Message
            Time = $elapsed
        }
        return $null
    }
}

# ============================================================================
# PART 1: AUTHENTICATION & TOKEN
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ PART 1: AUTHENTICATION & TOKEN VALIDATION                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 1A: Admin Login
Write-Host "`n[1A] Testing Admin Login..."
$loginBody = @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

$loginResponse = Test-Endpoint `
    -TestName "Admin Login" `
    -Method "POST" `
    -Endpoint "/auth/login" `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $loginBody `
    -ExpectedStatus 200

if ($loginResponse) {
    $token = $loginResponse.token
    Write-Host "📦 Token obtained: $($token.Substring(0, 30))..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
}

# ============================================================================
# PART 2: PHASE 5G - COMMISSION ENDPOINTS
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ PART 2: COMMISSION RATES & SETTINGS                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 2A: Get Commission Settings
Write-Host "`n[2A] Testing GET Commission Settings..."
$commissionSettings = Test-Endpoint `
    -TestName "Get Commission Settings" `
    -Method "GET" `
    -Endpoint "/admin/commission-settings" `
    -Headers $headers `
    -ExpectedStatus 200

if ($commissionSettings) {
    Write-Host "  Tiers found: $($commissionSettings.commissionRates.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
}

# Test 2B: Update Commission Rate
Write-Host "`n[2B] Testing PUT Update Commission Rate..."
$updateCommissionBody = @{
    tier = "starter"
    rate = 24
} | ConvertTo-Json

$updatedCommission = Test-Endpoint `
    -TestName "Update Commission Rate (Starter to 24%)" `
    -Method "PUT" `
    -Endpoint "/admin/commission-settings" `
    -Headers $headers `
    -Body $updateCommissionBody `
    -ExpectedStatus 200

# ============================================================================
# PART 3: PHASE 5G - EMAIL TEMPLATE ENDPOINTS
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ PART 3: EMAIL TEMPLATES                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 3A: Get Email Templates
Write-Host "`n[3A] Testing GET Email Templates..."
$emailTemplates = Test-Endpoint `
    -TestName "Get Email Templates" `
    -Method "GET" `
    -Endpoint "/admin/email-templates" `
    -Headers $headers `
    -ExpectedStatus 200

if ($emailTemplates) {
    Write-Host "  Templates found: $($emailTemplates.templates.Count) templates" -ForegroundColor Gray
    $emailTemplates.templates | ForEach-Object { Write-Host "    - $($_.type)" -ForegroundColor Gray }
}

# Test 3B: Update Email Template
Write-Host "`n[3B] Testing PUT Update Email Template..."
$updateTemplateBody = @{
    templateType = "rejection"
    subject = "Your Content Was Rejected"
    body = "Thank you for your submission. Unfortunately, it does not meet our guidelines."
} | ConvertTo-Json

$updatedTemplate = Test-Endpoint `
    -TestName "Update Email Template (Rejection)" `
    -Method "PUT" `
    -Endpoint "/admin/email-templates" `
    -Headers $headers `
    -Body $updateTemplateBody `
    -ExpectedStatus 200

# ============================================================================
# PART 4: PHASE 5G - FEATURE FLAGS ENDPOINTS
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ PART 4: FEATURE FLAGS                                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 4A: Get Feature Flags
Write-Host "`n[4A] Testing GET Feature Flags..."
$featureFlags = Test-Endpoint `
    -TestName "Get Feature Flags" `
    -Method "GET" `
    -Endpoint "/admin/feature-flags" `
    -Headers $headers `
    -ExpectedStatus 200

if ($featureFlags) {
    Write-Host "  Feature flags found: $($featureFlags.flags.Count) flags" -ForegroundColor Gray
    $featureFlags.flags | ForEach-Object { Write-Host "    - $($_.name): $($_.enabled)" -ForegroundColor Gray }
}

# Test 4B: Toggle Feature Flag
Write-Host "`n[4B] Testing PUT Toggle Feature Flag..."
$toggleFlagBody = @{
    featureId = "live-streaming"
    enabled = $true
    rolloutPercentage = 50
} | ConvertTo-Json

$toggledFlag = Test-Endpoint `
    -TestName "Toggle Feature Flag (Live Streaming)" `
    -Method "PUT" `
    -Endpoint "/admin/feature-flags" `
    -Headers $headers `
    -Body $toggleFlagBody `
    -ExpectedStatus 200

# ============================================================================
# PART 5: PHASE 5G - AUDIT LOGS ENDPOINTS
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ PART 5: AUDIT LOGS                                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 5A: Get Audit Logs
Write-Host "`n[5A] Testing GET Audit Logs..."
$auditLogs = Test-Endpoint `
    -TestName "Get Audit Logs" `
    -Method "GET" `
    -Endpoint "/admin/audit-logs?limit=10&skip=0" `
    -Headers $headers `
    -ExpectedStatus 200

if ($auditLogs) {
    Write-Host "  Total logs: $($auditLogs.total)" -ForegroundColor Gray
    Write-Host "  Logs returned: $($auditLogs.logs.Count)" -ForegroundColor Gray
    if ($auditLogs.logs.Count -gt 0) {
        Write-Host "  Recent action: $($auditLogs.logs[0].action) by $($auditLogs.logs[0].adminEmail)" -ForegroundColor Gray
    }
}

# Test 5B: Get Audit Logs with Filters
Write-Host "`n[5B] Testing GET Audit Logs with Date Filter..."
$logsWithFilter = Test-Endpoint `
    -TestName "Get Audit Logs (with date range)" `
    -Method "GET" `
    -Endpoint "/admin/audit-logs?startDate=$(Get-Date -Format 'yyyy-MM-dd')&endDate=$(Get-Date -Format 'yyyy-MM-dd')" `
    -Headers $headers `
    -ExpectedStatus 200

# Test 5C: Export Audit Logs
Write-Host "`n[5C] Testing POST Export Audit Logs (CSV)..."
$exportBody = @{
    filters = @{
        action = "update"
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$API_URL/admin/audit-logs/export" `
        -Method "POST" `
        -Headers $headers `
        -Body $exportBody `
        -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Export Audit Logs CSV ($($response.StatusCode))" -ForegroundColor Green
        $passCount++
        Write-Host "  Response length: $($response.Content.Length) bytes" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ FAIL: Export Audit Logs - $($_.Exception.Message)" -ForegroundColor Red
    $failCount++
}

# ============================================================================
# PART 6: ERROR HANDLING & EDGE CASES
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ PART 6: ERROR HANDLING & EDGE CASES                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 6A: Invalid Token
Write-Host "`n[6A] Testing Invalid Authorization Token..."
$badHeaders = @{
    "Authorization" = "Bearer invalid_token_xyz"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "$API_URL/admin/commission-settings" `
        -Method "GET" `
        -Headers $badHeaders `
        -UseBasicParsing
    Write-Host "❌ FAIL: Should reject invalid token" -ForegroundColor Red
    $failCount++
}
catch {
    if ($_.Exception.Response.StatusCode -eq "Unauthorized" -or $_.Exception.Response.StatusCode -eq "401") {
        Write-Host "✅ PASS: Invalid token rejected (401 Unauthorized)" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "⚠️  Got status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# Test 6B: Missing Authorization Header
Write-Host "`n[6B] Testing Missing Authorization Header..."
try {
    $response = Invoke-WebRequest -Uri "$API_URL/admin/commission-settings" `
        -Method "GET" `
        -UseBasicParsing
    Write-Host "❌ FAIL: Should require authorization" -ForegroundColor Red
    $failCount++
}
catch {
    if ($_.Exception.Response.StatusCode -eq "Unauthorized" -or $_.Exception.Response.StatusCode -eq "401") {
        Write-Host "✅ PASS: Authorization required (401 Unauthorized)" -ForegroundColor Green
        $passCount++
    }
}

# Test 6C: Invalid Commission Rate
Write-Host "`n[6C] Testing Invalid Commission Rate (>100%)..."
$invalidRateBody = @{
    tier = "starter"
    rate = 150
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$API_URL/admin/commission-settings" `
        -Method "PUT" `
        -Headers $headers `
        -Body $invalidRateBody `
        -UseBasicParsing
    
    if ($response.StatusCode -ne 200) {
        Write-Host "✅ PASS: Rejected invalid rate (Status: $($response.StatusCode))" -ForegroundColor Green
        $passCount++
    }
}
catch {
    Write-Host "✅ PASS: Rejected invalid rate - $($_.Exception.Response.StatusCode)" -ForegroundColor Green
    $passCount++
}

# ============================================================================
# PART 7: PERFORMANCE TESTS
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ PART 7: PERFORMANCE TESTS                                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 7A: Response Time - Commission Settings
Write-Host "`n[7A] Testing Response Time (Commission Settings)..."
$times = @()
for ($i = 1; $i -le 5; $i++) {
    $startTime = Get-Date
    Test-Endpoint -TestName "Commission Settings (iteration $i)" `
        -Method "GET" `
        -Endpoint "/admin/commission-settings" `
        -Headers $headers `
        -ExpectedStatus 200 | Out-Null
    $elapsed = ((Get-Date) - $startTime).TotalMilliseconds
    $times += $elapsed
}

$avgTime = ($times | Measure-Object -Average).Average
$maxTime = ($times | Measure-Object -Maximum).Maximum
$minTime = ($times | Measure-Object -Minimum).Minimum

Write-Host "  Average: ${avgTime}ms | Min: ${minTime}ms | Max: ${maxTime}ms" -ForegroundColor Yellow
if ($avgTime -lt 500) {
    Write-Host "  ✅ Performance acceptable (<500ms average)" -ForegroundColor Green
    $passCount++
} else {
    Write-Host "  ⚠️  Performance warning (>500ms average)" -ForegroundColor Yellow
}

# ============================================================================
# SUMMARY & RESULTS
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ TEST SUMMARY                                               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$totalTests = $passCount + $failCount
$passPercentage = if ($totalTests -gt 0) { [math]::Round(($passCount / $totalTests) * 100, 2) } else { 0 }

Write-Host "`nTotal Tests Run: $totalTests" -ForegroundColor White
Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "Success Rate: $passPercentage%" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Phase 5G is ready for deployment." -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Review errors above." -ForegroundColor Yellow
}

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor White
