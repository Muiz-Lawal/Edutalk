# Quick Auth Debug Script
Write-Host "🔍 EduTalk Auth System Diagnostic" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if servers are running
Write-Host "1️⃣  Checking Server Status..." -ForegroundColor Yellow
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
Write-Host "   Node processes: $($nodeProcs.Count)" -ForegroundColor Green

# 2. Test Backend API
Write-Host "`n2️⃣  Testing Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/profile" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Backend responding on port 5000" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend not responding on port 5000" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test MongoDB connection string
Write-Host "`n3️⃣  Checking Backend Configuration..." -ForegroundColor Yellow
$envFile = "C:\Users\abdul\Desktop\class\backend\.env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $mongoUri = $content | Select-String "MONGODB_URI" | Select-Object -First 1
    Write-Host "   $mongoUri" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env file not found" -ForegroundColor Yellow
}

# 4. Check Frontend Configuration
Write-Host "`n4️⃣  Checking Frontend Configuration..." -ForegroundColor Yellow
$frontendEnv = "C:\Users\abdul\Desktop\class\frontend\.env"
if (Test-Path $frontendEnv) {
    $content = Get-Content $frontendEnv
    $apiUrl = $content | Select-String "VITE_API_URL"
    Write-Host "   $apiUrl" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend .env not found" -ForegroundColor Yellow
}

# 5. Test Network connectivity
Write-Host "`n5️⃣  Testing Network Connectivity..." -ForegroundColor Yellow
$body = @{
    email = "test@example.com"
    password = "test123456"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -ErrorAction SilentlyContinue
    Write-Host "   ✅ Network working: Received response" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 400) {
        Write-Host "   ✅ Network working: Got 400 (user likely exists)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Network issue detected" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 6. Check Frontend Build
Write-Host "`n6️⃣  Checking Frontend Build..." -ForegroundColor Yellow
$distFolder = "C:\Users\abdul\Desktop\class\frontend\dist"
if (Test-Path $distFolder) {
    $files = Get-ChildItem $distFolder -Recurse | Measure-Object
    Write-Host "   ✅ Build folder exists with $($files.Count) files" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Build folder not found - run 'npm run build'" -ForegroundColor Yellow
}

# 7. Port Check
Write-Host "`n7️⃣  Checking Ports..." -ForegroundColor Yellow
try {
    $tcpPort5000 = [System.Net.Sockets.TcpClient]::new()
    $tcpPort5000.Connect("127.0.0.1", 5000)
    Write-Host "   ✅ Port 5000 (Backend) is open" -ForegroundColor Green
    $tcpPort5000.Dispose()
} catch {
    Write-Host "   ❌ Port 5000 (Backend) is closed" -ForegroundColor Red
}

try {
    $tcpPort5173 = [System.Net.Sockets.TcpClient]::new()
    $tcpPort5173.Connect("127.0.0.1", 5173)
    Write-Host "   ✅ Port 5173 (Frontend) is open" -ForegroundColor Green
    $tcpPort5173.Dispose()
} catch {
    Write-Host "   ❌ Port 5173 (Frontend) is closed" -ForegroundColor Red
}

# 8. Summary
Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "📋 SUMMARY" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ If all checks pass:" -ForegroundColor Green
Write-Host "   1. Open http://localhost:5173 in browser" -ForegroundColor Green
Write-Host "   2. Press F12 to open DevTools" -ForegroundColor Green
Write-Host "   3. Go to Console tab" -ForegroundColor Green
Write-Host "   4. Try to signup and check for errors" -ForegroundColor Green
Write-Host ""
Write-Host "❌ If any check fails:" -ForegroundColor Red
Write-Host "   1. Backend down? Run: npm run dev (in backend folder)" -ForegroundColor Red
Write-Host "   2. Frontend down? Run: npm run dev (in frontend folder)" -ForegroundColor Red
Write-Host "   3. MongoDB down? Run: mongod (or docker run mongo)" -ForegroundColor Red
Write-Host ""

# Test signup
Write-Host "`n9️⃣  Testing Signup API..." -ForegroundColor Yellow
$testBody = @{
    email = "debug$(Get-Random)@example.com"
    password = "Test123456!"
    firstName = "Debug"
    lastName = "User"
    isHost = $false
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $testBody `
        -ErrorAction SilentlyContinue
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.token) {
        Write-Host "   ✅ Signup working! Token received" -ForegroundColor Green
        Write-Host "   Token length: $($data.token.Length) chars" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Signup test failed" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
