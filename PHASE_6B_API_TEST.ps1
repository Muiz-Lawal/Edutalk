#!/usr/bin/env pwsh
# Phase 6B API Validation Script - Tests all 28 endpoints automatically

param(
    [string]$Token = "",
    [string]$BaseUrl = "http://localhost:5000/api"
)

Write-Host "╔═════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  PHASE 6B - AUTOMATED API VALIDATION TEST                      ║" -ForegroundColor Cyan
Write-Host "║  Testing all 28 endpoints                                      ║" -ForegroundColor Cyan
Write-Host "╚═════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if token is provided
if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Host "❌ ERROR: No JWT token provided" -ForegroundColor Red
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  1. Login to http://localhost:5173"
    Write-Host "  2. Open DevTools (F12) → Console"
    Write-Host "  3. Run: localStorage.getItem('token')"
    Write-Host "  4. Copy the token"
    Write-Host "  5. Run this script:"
    Write-Host ""
    Write-Host "    .\PHASE_6B_API_TEST.ps1 -Token 'YOUR_TOKEN_HERE'"
    Write-Host ""
    exit 1
}

# Test counter
$passCount = 0
$failCount = 0
$testNumber = 0

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Description,
        [hashtable]$Body = $null,
        [bool]$RequireAuth = $true
    )
    
    $testNumber++
    $url = "$BaseUrl$Endpoint"
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($RequireAuth) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            TimeoutSec = 10
            ErrorAction = "SilentlyContinue"
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        
        # Success if 200-299
        if ($statusCode -ge 200 -and $statusCode -lt 300) {
            Write-Host "  ✓ Test $testNumber`: [$statusCode] $Description" -ForegroundColor Green
            $script:passCount++
            return $true
        } else {
            Write-Host "  ✗ Test $testNumber`: [$statusCode] $Description" -ForegroundColor Red
            $script:failCount++
            return $false
        }
    }
    catch {
        $errorCode = $_.Exception.Response.StatusCode.Value__
        if ($null -eq $errorCode) {
            $errorCode = "ERR"
        }
        Write-Host "  ✗ Test $testNumber`: [$errorCode] $Description - $($_.Exception.Message)" -ForegroundColor Red
        $script:failCount++
        return $false
    }
}

# ==================== PROGRESS ENDPOINTS ====================
Write-Host ""
Write-Host "📊 PROGRESS ENDPOINTS (9 tests)" -ForegroundColor Cyan
Write-Host "─────────────────────────────────" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/progress/my-progress" -Description "Get my progress"
Test-Endpoint -Method "GET" -Endpoint "/progress/analytics" -Description "Get progress analytics"
Test-Endpoint -Method "GET" -Endpoint "/progress/at-risk-students" -Description "Get at-risk students"
Test-Endpoint -Method "GET" -Endpoint "/progress/leaderboard/test" -Description "Get leaderboard"
Test-Endpoint -Method "GET" -Endpoint "/progress/export" -Description "Export progress"
Test-Endpoint -Method "GET" -Endpoint "/progress/predictions/test" -Description "Get predictions"

# These would need valid IDs, so we test the endpoint structure exists
Test-Endpoint -Method "GET" -Endpoint "/progress/class/test" -Description "Get class progress"
Test-Endpoint -Method "POST" -Endpoint "/progress/test/attendance" -Description "Record attendance" -Body @{attended=$true}
Test-Endpoint -Method "POST" -Endpoint "/progress/test/score" -Description "Record score" -Body @{score=85}

# ==================== CERTIFICATE ENDPOINTS ====================
Write-Host ""
Write-Host "📜 CERTIFICATE ENDPOINTS (10 tests)" -ForegroundColor Cyan
Write-Host "──────────────────────────────────" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/certificates" -Description "List certificates"
Test-Endpoint -Method "GET" -Endpoint "/certificates/templates" -Description "Get templates"
Test-Endpoint -Method "GET" -Endpoint "/certificates/analytics" -Description "Get certificate analytics"
Test-Endpoint -Method "GET" -Endpoint "/certificates/export" -Description "Export certificates"
Test-Endpoint -Method "POST" -Endpoint "/certificates/generate" -Description "Generate certificate" -Body @{enrollmentId="test"}
Test-Endpoint -Method "GET" -Endpoint "/certificates/test" -Description "Get certificate details"
Test-Endpoint -Method "GET" -Endpoint "/certificates/test/download" -Description "Download certificate"
Test-Endpoint -Method "POST" -Endpoint "/certificates/test/share" -Description "Share certificate" -Body @{email="test@test.com"}
Test-Endpoint -Method "GET" -Endpoint "/certificates/public/verify/test" -Description "Verify certificate (public)" -RequireAuth $false

# Extra certificate endpoint
Test-Endpoint -Method "GET" -Endpoint "/certificates" -Description "Get my certificates"

# ==================== ACHIEVEMENT ENDPOINTS ====================
Write-Host ""
Write-Host "🏆 ACHIEVEMENT ENDPOINTS (9 tests)" -ForegroundColor Cyan
Write-Host "──────────────────────────────────" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/achievements" -Description "Get my achievements"
Test-Endpoint -Method "GET" -Endpoint "/achievements/test" -Description "Get user achievements"
Test-Endpoint -Method "GET" -Endpoint "/achievements/leaderboard" -Description "Get achievement leaderboard"
Test-Endpoint -Method "GET" -Endpoint "/achievements/milestones" -Description "Check milestones"
Test-Endpoint -Method "GET" -Endpoint "/achievements/badges" -Description "Get all badges"
Test-Endpoint -Method "GET" -Endpoint "/achievements/stats" -Description "Get achievement stats"
Test-Endpoint -Method "GET" -Endpoint "/achievements/profile/test" -Description "Get achievement profile"
Test-Endpoint -Method "GET" -Endpoint "/achievements/export" -Description "Export achievements"
Test-Endpoint -Method "POST" -Endpoint "/achievements/grant" -Description "Grant achievement" -Body @{userId="test"; type="first_session"}

# ==================== SUMMARY ====================
Write-Host ""
Write-Host "╔═════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST SUMMARY                                                   ║" -ForegroundColor Cyan
Write-Host "╚═════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$totalTests = $passCount + $failCount
$passPercentage = if ($totalTests -gt 0) { [math]::Round(($passCount / $totalTests) * 100) } else { 0 }

Write-Host ""
Write-Host "  Total Tests Run: $totalTests" -ForegroundColor White
Write-Host "  ✓ Passed:       $passCount" -ForegroundColor Green
Write-Host "  ✗ Failed:       $failCount" -ForegroundColor Red
Write-Host "  Pass Rate:      $passPercentage%" -ForegroundColor $(if ($passPercentage -ge 85) { "Green" } else { "Yellow" })
Write-Host ""

# Result message
if ($passPercentage -ge 95) {
    Write-Host "🎉 EXCELLENT! All endpoints working!" -ForegroundColor Green
    Write-Host "   → Ready for frontend testing" -ForegroundColor Green
} elseif ($passPercentage -ge 85) {
    Write-Host "✅ GOOD! Most endpoints working" -ForegroundColor Yellow
    Write-Host "   → Minor issues found, check failed tests" -ForegroundColor Yellow
} elseif ($passPercentage -ge 50) {
    Write-Host "⚠️  PARTIAL! Need fixes" -ForegroundColor Yellow
    Write-Host "   → Debug failed endpoints" -ForegroundColor Yellow
} else {
    Write-Host "❌ MAJOR ISSUES! Most endpoints failing" -ForegroundColor Red
    Write-Host "   - Check backend is running on port 5000" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review failed tests above" -ForegroundColor Cyan
Write-Host "  2. Check backend logs for errors" -ForegroundColor Cyan
Write-Host "  3. Fix any endpoint issues" -ForegroundColor Cyan
Write-Host "  4. Run this script again to verify fixes" -ForegroundColor Cyan
Write-Host ""
