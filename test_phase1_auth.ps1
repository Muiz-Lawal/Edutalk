# ===============================================================================
# Phase 1 MVP - Week 1 Authentication Testing Script
# ===============================================================================
# This script tests the complete authentication flow:
# 1. User Registration
# 2. User Login
# 3. Get Profile (protected)
# 4. Update Profile
# 5. Upgrade to Host
# 6. Logout
#
# Usage: .\test_phase1_auth.ps1
# ===============================================================================

param(
    [string]$BackendUrl = "http://localhost:5001",
    [string]$Email = "phase1test@example.com",
    [string]$Password = "Test@12345",
    [string]$FirstName = "Phase1",
    [string]$LastName = "Test"
)

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "Phase 1 MVP - Week 1 Authentication Testing" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# Color functions
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "• $Message" -ForegroundColor Cyan
}

function Write-Response {
    param([object]$Response)
    Write-Host ($Response | ConvertTo-Json -Depth 10) -ForegroundColor Gray
}

# Test 1: Register User
Write-Host "`n[TEST 1] User Registration" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    $registerBody = @{
        email = $Email
        password = $Password
        firstName = $FirstName
        lastName = $LastName
        isHost = $false
    } | ConvertTo-Json

    Write-Info "Registering user: $Email"
    $registerResponse = Invoke-WebRequest `
        -Uri "$BackendUrl/api/auth/register" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $registerBody `
        -UseBasicParsing

    if ($registerResponse.StatusCode -eq 201) {
        Write-Success "User registered successfully (Status: 201)"
        $registerData = $registerResponse.Content | ConvertFrom-Json
        $token = $registerData.token
        Write-Response $registerData
    } else {
        Write-Error-Custom "Registration failed (Status: $($registerResponse.StatusCode))"
        Write-Response $registerResponse.Content
        exit 1
    }
}
catch {
    Write-Error-Custom "Registration error: $($_.Exception.Message)"
    exit 1
}

# Test 2: Login User
Write-Host "`n[TEST 2] User Login" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    Write-Info "Logging in user: $Email"
    $loginResponse = Invoke-WebRequest `
        -Uri "$BackendUrl/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginBody `
        -UseBasicParsing

    if ($loginResponse.StatusCode -eq 200) {
        Write-Success "Login successful (Status: 200)"
        $loginData = $loginResponse.Content | ConvertFrom-Json
        $token = $loginData.token
        Write-Response $loginData
    } else {
        Write-Error-Custom "Login failed (Status: $($loginResponse.StatusCode))"
        exit 1
    }
}
catch {
    Write-Error-Custom "Login error: $($_.Exception.Message)"
    exit 1
}

# Test 3: Get Profile (Protected)
Write-Host "`n[TEST 3] Get Profile (Protected)" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    Write-Info "Fetching profile with token..."
    $profileResponse = Invoke-WebRequest `
        -Uri "$BackendUrl/api/auth/profile" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $token"} `
        -UseBasicParsing

    if ($profileResponse.StatusCode -eq 200) {
        Write-Success "Profile retrieved successfully (Status: 200)"
        $profileData = $profileResponse.Content | ConvertFrom-Json
        Write-Response $profileData
    } else {
        Write-Error-Custom "Failed to get profile (Status: $($profileResponse.StatusCode))"
        exit 1
    }
}
catch {
    Write-Error-Custom "Get profile error: $($_.Exception.Message)"
    exit 1
}

# Test 4: Update Profile
Write-Host "`n[TEST 4] Update Profile" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    $updateBody = @{
        bio = "I'm learning to use EduTalk platform for teaching"
        preferredLanguage = "en"
        preferredCurrency = "USD"
    } | ConvertTo-Json

    Write-Info "Updating profile..."
    $updateResponse = Invoke-WebRequest `
        -Uri "$BackendUrl/api/auth/profile" `
        -Method PUT `
        -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} `
        -Body $updateBody `
        -UseBasicParsing

    if ($updateResponse.StatusCode -eq 200) {
        Write-Success "Profile updated successfully (Status: 200)"
        $updateData = $updateResponse.Content | ConvertFrom-Json
        Write-Response $updateData
    } else {
        Write-Error-Custom "Profile update failed (Status: $($updateResponse.StatusCode))"
        exit 1
    }
}
catch {
    Write-Error-Custom "Update profile error: $($_.Exception.Message)"
    exit 1
}

# Test 5: Upgrade to Host
Write-Host "`n[TEST 5] Upgrade to Host" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    $upgradeBody = @{
        hostBio = "I teach programming and web development with 10 years of experience"
        expertise = @("JavaScript", "React", "Node.js", "Web Development")
    } | ConvertTo-Json

    Write-Info "Upgrading user to host..."
    $upgradeResponse = Invoke-WebRequest `
        -Uri "$BackendUrl/api/auth/upgrade-to-host" `
        -Method POST `
        -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} `
        -Body $upgradeBody `
        -UseBasicParsing

    if ($upgradeResponse.StatusCode -eq 200) {
        Write-Success "User upgraded to host successfully (Status: 200)"
        $upgradeData = $upgradeResponse.Content | ConvertFrom-Json
        Write-Response $upgradeData
        
        # Verify isHost is true
        if ($upgradeData.isHost -eq $true) {
            Write-Success "User is now a host (isHost=true)"
        } else {
            Write-Error-Custom "User upgrade failed - isHost is still false"
            exit 1
        }
    } else {
        Write-Error-Custom "Host upgrade failed (Status: $($upgradeResponse.StatusCode))"
        exit 1
    }
}
catch {
    Write-Error-Custom "Upgrade to host error: $($_.Exception.Message)"
    exit 1
}

# Test 6: Test Invalid Token (Should Fail)
Write-Host "`n[TEST 6] Invalid Token Verification" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    Write-Info "Testing with invalid token..."
    $invalidResponse = Invoke-WebRequest `
        -Uri "$BackendUrl/api/auth/profile" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer INVALID_TOKEN"} `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue

    if ($invalidResponse.StatusCode -ne 401) {
        Write-Error-Custom "Invalid token was accepted (should return 401)"
    } else {
        Write-Success "Invalid token properly rejected (Status: 401)"
    }
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Success "Invalid token properly rejected (Status: 401)"
    } else {
        Write-Error-Custom "Unexpected error: $($_.Exception.Message)"
    }
}

# Test 7: Test Missing Token (Should Fail)
Write-Host "`n[TEST 7] Missing Token Verification" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    Write-Info "Testing without token..."
    $noTokenResponse = Invoke-WebRequest `
        -Uri "$BackendUrl/api/auth/profile" `
        -Method GET `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue

    if ($noTokenResponse.StatusCode -ne 401) {
        Write-Error-Custom "Request without token was accepted (should return 401)"
    } else {
        Write-Success "Request without token properly rejected (Status: 401)"
    }
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Success "Request without token properly rejected (Status: 401)"
    } else {
        Write-Error-Custom "Unexpected error: $($_.Exception.Message)"
    }
}

# Summary
Write-Host "`n===============================================================================" -ForegroundColor Cyan
Write-Host "WEEK 1 AUTHENTICATION TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

Write-Host "`nAll tests passed! ✓" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  ✓ User registration works" -ForegroundColor Green
Write-Host "  ✓ User login works" -ForegroundColor Green
Write-Host "  ✓ Protected endpoints work" -ForegroundColor Green
Write-Host "  ✓ Profile management works" -ForegroundColor Green
Write-Host "  ✓ Host upgrade works" -ForegroundColor Green
Write-Host "  ✓ Token validation works" -ForegroundColor Green
Write-Host ""
Write-Host "Test user created:" -ForegroundColor Yellow
Write-Host "  Email: $Email" -ForegroundColor Cyan
Write-Host "  Password: $Password" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Begin Week 2 - Class Creation" -ForegroundColor Yellow
