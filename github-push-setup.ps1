#!/usr/bin/env pwsh
# ============================================================================
# EduTalk - GitHub Push Quick Setup Script
# ============================================================================
# 
# This script automates the initial GitHub push process
# 
# Usage:
#   .\github-push-setup.ps1
#
# ============================================================================

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "EduTalk - GitHub Push Setup Script" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Colors
$Success = "Green"
$Warning = "Yellow"
$Error = "Red"
$Info = "Cyan"

# ============================================================================
# 1. PRE-FLIGHT CHECKS
# ============================================================================

Write-Host "📋 Running pre-flight checks..." -ForegroundColor $Info
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path ".git")) {
    Write-Host "❌ .git folder not found!" -ForegroundColor $Error
    Write-Host "Please run this script from the project root directory"
    exit 1
}

Write-Host "✅ Git repository found" -ForegroundColor $Success

# Check if git is installed
$gitCheck = git --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git is installed: $gitCheck" -ForegroundColor $Success
} else {
    Write-Host "❌ Git is not installed!" -ForegroundColor $Error
    exit 1
}

# Check .gitignore
if (Test-Path ".gitignore") {
    Write-Host "✅ .gitignore found" -ForegroundColor $Success
} else {
    Write-Host "⚠️  .gitignore not found - creating one" -ForegroundColor $Warning
}

# Check if .env files are ignored
$envCheck1 = git check-ignore -v ".env" 2>&1
$envCheck2 = git check-ignore -v "backend\.env" 2>&1
$envCheck3 = git check-ignore -v "frontend\.env" 2>&1

if ($envCheck1 -match "\.env" -and $envCheck2 -match "backend" -and $envCheck3 -match "frontend") {
    Write-Host "✅ .env files are properly ignored" -ForegroundColor $Success
} else {
    Write-Host "⚠️  Some .env files might not be ignored" -ForegroundColor $Warning
    Write-Host "   Please check .gitignore" -ForegroundColor $Warning
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 2. CONFIGURE GIT
# ============================================================================

Write-Host "⚙️  Git Configuration" -ForegroundColor $Info
Write-Host ""

# Check existing config
$userName = git config user.name
$userEmail = git config user.email

if ($userName -and $userEmail) {
    Write-Host "ℹ️  Current git config:" -ForegroundColor $Info
    Write-Host "   Name:  $userName" -ForegroundColor $Info
    Write-Host "   Email: $userEmail" -ForegroundColor $Info
    Write-Host ""
    
    $useExisting = Read-Host "Use existing config? (y/n)"
    if ($useExisting -ne "y") {
        $userName = Read-Host "Enter your name"
        $userEmail = Read-Host "Enter your email"
    }
} else {
    $userName = Read-Host "Enter your name"
    $userEmail = Read-Host "Enter your email"
}

git config user.name "$userName"
git config user.email "$userEmail"

Write-Host "✅ Git configured" -ForegroundColor $Success
Write-Host ""

# ============================================================================
# 3. CHECK GIT STATUS
# ============================================================================

Write-Host "📊 Git Status" -ForegroundColor $Info
Write-Host ""

$status = git status --short
if ($status.Count -eq 0) {
    Write-Host "✅ Clean working directory" -ForegroundColor $Success
} else {
    Write-Host "📝 Changes detected:" -ForegroundColor $Warning
    git status --short | Select-Object -First 10
    if ((git status --short | Measure-Object).Count -gt 10) {
        Write-Host "   ... and more" -ForegroundColor $Warning
    }
}

Write-Host ""

# ============================================================================
# 4. GITHUB REPOSITORY INFO
# ============================================================================

Write-Host "🌐 GitHub Repository Setup" -ForegroundColor $Info
Write-Host ""

$checkRemote = git remote -v
if ($checkRemote) {
    Write-Host "ℹ️  Existing remote found:" -ForegroundColor $Info
    git remote -v
} else {
    Write-Host "ℹ️  No remote repository configured yet" -ForegroundColor $Warning
}

Write-Host ""
Write-Host "Please follow these steps:" -ForegroundColor $Info
Write-Host "1. Go to: https://github.com/new" -ForegroundColor $Info
Write-Host "2. Name: edutalk" -ForegroundColor $Info
Write-Host "3. Create repository (DON'T initialize with README)" -ForegroundColor $Info
Write-Host "4. Copy the repository URL" -ForegroundColor $Info
Write-Host ""

$repoURL = Read-Host "Enter your GitHub repository URL"

if (-not $repoURL) {
    Write-Host "❌ No repository URL provided" -ForegroundColor $Error
    exit 1
}

Write-Host ""

# ============================================================================
# 5. ADD REMOTE & PUSH
# ============================================================================

Write-Host "🚀 Setting up remote and pushing..." -ForegroundColor $Info
Write-Host ""

# Check if remote already exists
$existingRemote = git remote | grep origin
if ($existingRemote) {
    Write-Host "Removing existing remote..." -ForegroundColor $Warning
    git remote remove origin
}

# Add remote
Write-Host "Adding remote origin..." -ForegroundColor $Info
git remote add origin "$repoURL"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote added" -ForegroundColor $Success
} else {
    Write-Host "❌ Failed to add remote" -ForegroundColor $Error
    exit 1
}

# Set main branch
Write-Host "Setting main branch..." -ForegroundColor $Info
git branch -M main
Write-Host "✅ Main branch set" -ForegroundColor $Success

# Stage all files
Write-Host "Staging files..." -ForegroundColor $Info
git add .

$fileCount = (git diff --cached --name-only | Measure-Object).Count
Write-Host "✅ Staged $fileCount files" -ForegroundColor $Success

Write-Host ""

# Show what will be committed
$commitFiles = git diff --cached --name-only | Select-Object -First 10
Write-Host "Files to be committed:" -ForegroundColor $Info
$commitFiles | ForEach-Object {
    Write-Host "   ✓ $_"
}

if ((git diff --cached --name-only | Measure-Object).Count -gt 10) {
    $remaining = (git diff --cached --name-only | Measure-Object).Count - 10
    Write-Host "   ... and $remaining more files" -ForegroundColor $Info
}

Write-Host ""

# Create commit
$commitMsg = "Initial commit: EduTalk platform"
Write-Host "Creating commit: '$commitMsg'" -ForegroundColor $Info
git commit -m "$commitMsg"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit created" -ForegroundColor $Success
} else {
    Write-Host "❌ Failed to create commit" -ForegroundColor $Error
    exit 1
}

Write-Host ""

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor $Info
Write-Host "(This may take a few minutes on first push)" -ForegroundColor $Warning

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor $Success
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor $Error
    Write-Host "Common causes:" -ForegroundColor $Warning
    Write-Host "  - Invalid GitHub credentials" -ForegroundColor $Warning
    Write-Host "  - Network connection issue" -ForegroundColor $Warning
    Write-Host "  - Repository already has commits" -ForegroundColor $Warning
    exit 1
}

Write-Host ""

# ============================================================================
# 6. VERIFY ON GITHUB
# ============================================================================

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor $Success
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor $Info
Write-Host "1. Visit your repository: $repoURL" -ForegroundColor $Info
Write-Host "2. Verify files are present" -ForegroundColor $Info
Write-Host "3. Check that .env files are NOT visible" -ForegroundColor $Info
Write-Host ""

Write-Host "Common commands:" -ForegroundColor $Info
Write-Host "  git status          - Check status" -ForegroundColor $Info
Write-Host "  git log --oneline   - View commits" -ForegroundColor $Info
Write-Host "  git branch -a       - List branches" -ForegroundColor $Info
Write-Host "  git push            - Push changes" -ForegroundColor $Info
Write-Host "  git pull            - Pull changes" -ForegroundColor $Info
Write-Host ""

Write-Host "Documentation:" -ForegroundColor $Info
Write-Host "  README.md           - Project overview" -ForegroundColor $Info
Write-Host "  SETUP.md            - Installation guide" -ForegroundColor $Info
Write-Host "  CONTRIBUTING.md     - How to contribute" -ForegroundColor $Info
Write-Host "  GITHUB_SETUP.md     - GitHub workflow guide" -ForegroundColor $Info
Write-Host ""

$openBrowser = Read-Host "Open repository in browser? (y/n)"
if ($openBrowser -eq "y") {
    Start-Process $repoURL
}

Write-Host "✅ All done! Happy coding! 🚀" -ForegroundColor $Success
