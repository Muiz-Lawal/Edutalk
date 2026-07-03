param([string]$Token)

if (!$Token) {
    Write-Host "Usage: .\PHASE_6B_QUICK_TEST.ps1 -Token 'YOUR_JWT_TOKEN'" -ForegroundColor Red
    exit 1
}

$baseUrl = "http://localhost:5000/api"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $Token"
}

$passed = 0
$failed = 0

function Test-Endpoint {
    param([string]$Method, [string]$Endpoint, [string]$Name, [object]$Body = $null)
    
    try {
        $uri = "$baseUrl$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $headers
            ErrorAction = 'Stop'
            TimeoutSec = 5
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "[PASS] $Name" -ForegroundColor Green
        $script:passed++
        return $true
    } catch {
        $status = $_.Exception.Response.StatusCode
        Write-Host "[FAIL] $Name - HTTP $status" -ForegroundColor Red
        $script:failed++
        return $false
    }
}

Write-Host ""
Write-Host "====== PROGRESS ENDPOINTS (7 tests) ======" -ForegroundColor Cyan
Write-Host ""
Test-Endpoint "GET" "/progress/my-progress" "1. Get My Progress"
Test-Endpoint "GET" "/progress/class/6a1eddd45cddc2a564689a8e" "2. Get Class Progress"
Test-Endpoint "GET" "/progress/class/6a1eddd45cddc2a564689a8e/analytics" "3. Class Analytics"
Test-Endpoint "GET" "/progress/class/6a1eddd45cddc2a564689a8e/at-risk" "4. At-Risk Students"
Test-Endpoint "GET" "/progress/class/6a1eddd45cddc2a564689a8e/leaderboard" "5. Leaderboard"
Test-Endpoint "GET" "/progress/enrollment/6a1eddd45cddc2a564689a92/prediction" "6. Predict Completion"
Test-Endpoint "GET" "/progress/class/6a1eddd45cddc2a564689a8e/export" "7. Export Progress"

Write-Host ""
Write-Host "====== CERTIFICATE ENDPOINTS (8 tests) ======" -ForegroundColor Cyan
Write-Host ""
Test-Endpoint "GET" "/certificates" "8. List My Certificates"
Test-Endpoint "POST" "/certificates" "9. Generate Certificate" @{
    classId = "675f1234567890abcd123456"
    studentId = "675f1234567890abcd123457"
    courseName = "Test Course"
}
Test-Endpoint "GET" "/certificates/675f1234567890abcd123456" "10. Get Certificate"
Test-Endpoint "GET" "/certificates/675f1234567890abcd123456/download" "11. Download Certificate"
Test-Endpoint "POST" "/certificates/675f1234567890abcd123456/share" "12. Share Certificate" @{
    email = "test@example.com"
}
Test-Endpoint "GET" "/certificates/templates/all" "13. Get Templates"
Test-Endpoint "GET" "/certificates/analytics/675f1234567890abcd123456" "14. Certificate Analytics"
Test-Endpoint "GET" "/certificates/export/675f1234567890abcd123456" "15. Export Certificates"

Write-Host ""
Write-Host "====== ACHIEVEMENT ENDPOINTS (8 tests) ======" -ForegroundColor Cyan
Write-Host ""
Test-Endpoint "GET" "/achievements" "16. Get My Achievements"
Test-Endpoint "GET" "/achievements/badges/all" "17. Get All Badges"
Test-Endpoint "GET" "/achievements/profile/6a1eddd45cddc2a564689a92" "18. Student Profile"
Test-Endpoint "GET" "/achievements/leaderboard/6a1eddd45cddc2a564689a8e" "19. Achievement Leaderboard"
Test-Endpoint "GET" "/achievements/stats/6a1eddd45cddc2a564689a8e" "20. Achievement Stats"
Test-Endpoint "GET" "/achievements/export/6a1eddd45cddc2a564689a8e" "21. Export Achievements"
Test-Endpoint "POST" "/achievements" "22. Grant Achievement" @{
    studentId = "6a1eddd45cddc2a564689a92"
    achievementType = "completion"
    classId = "6a1eddd45cddc2a564689a8e"
}
Test-Endpoint "POST" "/achievements/check/6a1eddd45cddc2a564689a92" "23. Check Milestones" @{
    progress = 50
}

Write-Host ""
Write-Host "========== SUMMARY ==========" -ForegroundColor Yellow
Write-Host "PASSED: $passed" -ForegroundColor Green
Write-Host "FAILED: $failed" -ForegroundColor Red
$total = $passed + $failed
Write-Host "TOTAL:  $total" -ForegroundColor White

if ($total -gt 0) {
    $passRate = [math]::Round(($passed / $total * 100), 1)
    Write-Host "PASS RATE: $passRate%" -ForegroundColor Cyan
    Write-Host ""
    
    if ($passed -ge 20) {
        Write-Host "SUCCESS! System mostly working!" -ForegroundColor Green
    } elseif ($passed -ge 15) {
        Write-Host "PARTIAL! Some issues to fix" -ForegroundColor Yellow
    } else {
        Write-Host "ISSUES! Check backend and database" -ForegroundColor Red
    }
}

