# GitHub Setup & Deployment Guide for EduTalk

Complete step-by-step instructions for preparing your project and pushing it to GitHub.

## 📋 Table of Contents

1. [Pre-Push Checklist](#pre-push-checklist)
2. [Prepare Your Project](#prepare-your-project)
3. [Create GitHub Repository](#create-github-repository)
4. [Push to GitHub](#push-to-github)
5. [Repository Configuration](#repository-configuration)
6. [Ongoing Git Workflow](#ongoing-git-workflow)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Push Checklist

Before pushing to GitHub, ensure:

- [ ] `.env` files are NOT in the repository (check `.gitignore`)
- [ ] `node_modules/` directories are NOT in the repository
- [ ] All sensitive information is removed or in `.env` files
- [ ] `.gitignore` is properly configured
- [ ] README.md is comprehensive and clear
- [ ] LICENSE file exists
- [ ] Project structure is clean and organized
- [ ] All local testing is complete

### Verify Files Won't Be Committed

```powershell
# Check what will be added to git
git status

# Verify .env files are ignored
git check-ignore -v .env backend/.env frontend/.env

# Verify node_modules are ignored
git check-ignore -v node_modules backend/node_modules frontend/node_modules
```

---

## 🛠️ Prepare Your Project

### 1. Clean Up Development Files

Remove or clean up local development documentation:

```powershell
# Navigate to project root
cd c:\Users\abdul\Desktop\class

# Remove unnecessary phase documentation if not needed
# (Keep as reference in your local copy, but these can be excluded from git)
git status  # Review what needs to be tracked
```

### 2. Create .env.example Files

If not already done, create `.env.example` templates:

#### backend/.env.example

```env
# ===== Server Configuration =====
NODE_ENV=development
PORT=5000

# ===== Database =====
MONGODB_URI=mongodb://localhost:27017/edutalk
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edutalk

# ===== Authentication =====
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# ===== Stripe Keys =====
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# ===== SendGrid Email =====
SENDGRID_API_KEY=your_sendgrid_api_key

# ===== OpenAI (for moderation) =====
OPENAI_API_KEY=your_openai_api_key

# ===== CORS & URLs =====
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# ===== Email Configuration =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password

# ===== Logging =====
LOG_LEVEL=debug
```

#### frontend/.env.example

```env
# ===== API Configuration =====
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000

# ===== Stripe =====
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY_HERE

# ===== Environment =====
VITE_ENV=development
```

### 3. Create a LICENSE File

Create `LICENSE` file (MIT License recommended):

```
MIT License

Copyright (c) 2026 [Your Name/Organization]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### 4. Verify .gitignore

Your `.gitignore` should include:

```
# Environment variables
.env
.env.*.local
.env.local

# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build files
dist/
build/
.next/

# IDE files
.vscode/settings.json
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log

# Development files (optional - exclude phase docs if desired)
PHASE_*.md
ADMIN_*.md
```

---

## 🌐 Create GitHub Repository

### Step 1: Create Repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `edutalk` (or your preferred name)
3. **Description**: "Paid Video Conferencing and Virtual Classroom Platform"
4. **Public** or **Private**: Choose based on your needs
5. **Initialize repository**: Leave unchecked (you already have git locally)
6. Click **Create repository**

### Step 2: Note Your Repository URL

After creation, you'll see:

```
https://github.com/yourusername/edutalk.git
```

Or if using SSH:

```
git@github.com:yourusername/edutalk.git
```

---

## 🚀 Push to GitHub

### Step 1: Configure Git (If First Time)

```powershell
# Set global git configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list
```

### Step 2: Add Remote Origin

Navigate to your project root and add the remote:

```powershell
cd c:\Users\abdul\Desktop\class

# Add remote repository
git remote add origin https://github.com/yourusername/edutalk.git

# Verify remote was added
git remote -v
```

### Step 3: Create Initial Commit

```powershell
# Check current status
git status

# Add all files (excluding those in .gitignore)
git add .

# Verify what's being added
git status

# Create initial commit
git commit -m "Initial commit: EduTalk platform with backend and frontend setup"
```

### Step 4: Push to GitHub

```powershell
# Push to main branch
git branch -M main
git push -u origin main

# For subsequent pushes:
git push origin main
```

### Step 5: Verify on GitHub

1. Go to your repository on GitHub: `https://github.com/yourusername/edutalk`
2. Verify all files are present
3. Check that `.env` files are NOT visible
4. Verify `node_modules/` is NOT present

---

## ⚙️ Repository Configuration

### Step 1: Add Repository Topics

On GitHub, go to **Settings** → **General** → **Topics** and add:

- `education`
- `video-conferencing`
- `stripe`
- `react`
- `nodejs`
- `mongodb`

### Step 2: Configure Branch Protection

1. Go to **Settings** → **Branches**
2. Click **Add rule** under "Branch protection rules"
3. Pattern name: `main`
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Include administrators

### Step 3: Add Contributing Guidelines

Create `CONTRIBUTING.md`:

````markdown
# Contributing to EduTalk

Thank you for your interest in contributing!

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/edutalk.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Follow the setup instructions in [SETUP.md](./SETUP.md)

## Commit Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code formatting
- `refactor:` - Code restructuring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Example:

```bash
git commit -m "feat: Add real-time notifications"
```
````

## Pull Request Process

1. Update SETUP.md with any new setup steps
2. Ensure all tests pass
3. Update documentation as needed
4. Submit PR with clear description
5. Address review feedback
6. Squash commits if requested

## Code Style

- Use ES6+ syntax
- Functional React components with hooks
- Async/await over promises
- Consistent error handling

## Questions?

Create an issue with the `question` label.

````

### Step 4: Add Code of Conduct

Create `CODE_OF_CONDUCT.md`:

```markdown
# Contributor Code of Conduct

## Our Pledge

We are committed to providing a welcoming and inspiring community for all.

## Standards

Examples of behavior that contribute to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing opinions and experiences
- Giving and gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:

- Harassment or discrimination
- Insulting/derogatory comments
- Personal attacks
- Public or private harassment

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team.

[Contact: your-email@example.com]
````

---

## 📚 Ongoing Git Workflow

### Daily Development Workflow

```powershell
# 1. Start each day: Fetch latest changes
git fetch origin

# 2. Create feature branch from main
git checkout -b feature/your-feature-name

# 3. Make changes and commit regularly
git add src/file-you-changed.js
git commit -m "feat: Add specific feature"

# 4. Keep your branch updated
git rebase origin/main

# 5. Push your branch
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
# (GitHub will show option to create PR)
```

### Making Changes to Existing Code

```powershell
# 1. Check status
git status

# 2. See what changed
git diff src/file.js

# 3. Stage changes
git add src/file.js
# Or stage all changes:
git add .

# 4. Commit
git commit -m "fix: Correct pricing calculation"

# 5. Push
git push origin main
# (or your feature branch)
```

### Creating and Merging Pull Requests

**On GitHub:**

1. Go to your repository
2. Click "Compare & pull request" button (or "New pull request")
3. Set:
   - **Base**: `main` (destination)
   - **Compare**: your feature branch
4. Add title and description
5. Click "Create pull request"
6. After reviews, click "Merge pull request"
7. Click "Confirm merge"
8. Click "Delete branch" (optional cleanup)

**Back in Terminal:**

```powershell
# After merge, update local main
git checkout main
git pull origin main

# Delete local feature branch
git branch -d feature/your-feature-name
```

### Version Tagging

```powershell
# Create a tag for a release
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin v1.0.0
# Or push all tags:
git push origin --tags

# List tags
git tag -l
```

---

## 🔑 Using SSH for GitHub (Recommended)

SSH is more secure than HTTPS. Set it up once:

### Step 1: Generate SSH Key

```powershell
# Generate new SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# When prompted, accept default location
# Enter a passphrase (optional but recommended)
```

### Step 2: Add SSH Key to GitHub

```powershell
# Copy your public key
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard

# Go to GitHub: Settings → SSH and GPG keys → New SSH key
# Paste your key and save
```

### Step 3: Switch Remote URL (Optional)

```powershell
# Change from HTTPS to SSH
git remote set-url origin git@github.com:yourusername/edutalk.git

# Verify
git remote -v
```

---

## 🐛 Troubleshooting

### Problem: "fatal: not a git repository"

```powershell
# Initialize git in correct directory
cd c:\Users\abdul\Desktop\class
git init
git add remote origin https://github.com/yourusername/edutalk.git
```

### Problem: Changes not being tracked

```powershell
# Files might be in .gitignore
git check-ignore -v *

# Or check if they're already committed
git ls-files
```

### Problem: ".env file is in repository"

```powershell
# Remove from git tracking
git rm --cached .env backend/.env frontend/.env

# Commit the removal
git commit -m "chore: Remove .env files from tracking"

# Verify in .gitignore
# Then push
git push origin main
```

### Problem: "Branch main doesn't exist on remote"

```powershell
# Create main branch locally
git branch -M main

# Push to create on remote
git push -u origin main
```

### Problem: Cannot push - Permission denied

```powershell
# If using SSH, verify SSH setup
ssh -T git@github.com

# If using HTTPS, update credentials in Windows Credential Manager
# Settings → Credential Manager → Windows Credentials → Edit GitHub credentials
```

### Problem: Large files causing issues

```powershell
# Check file sizes
Get-ChildItem -Recurse -File | Sort-Object Length -Descending | Select-Object -First 20

# If node_modules/ is being tracked:
git rm -r --cached node_modules/
git commit -m "Remove node_modules"
git push
```

---

## 📊 Repository Health Checklist

After pushing, verify your repository has:

- ✅ Comprehensive README.md
- ✅ SETUP.md with installation instructions
- ✅ CONTRIBUTING.md for contributors
- ✅ CODE_OF_CONDUCT.md
- ✅ LICENSE file
- ✅ .gitignore properly configured
- ✅ .env.example files (not actual .env)
- ✅ No node_modules/ directories
- ✅ No .env files with secrets
- ✅ Clear project structure
- ✅ Meaningful commit history
- ✅ Up-to-date dependencies documentation

---

## 🎯 Next Steps After GitHub Setup

1. **Enable GitHub Actions**
   - Create `.github/workflows/` directory
   - Add CI/CD pipelines for testing

2. **Add Release Notes**
   - Go to Releases → Create a release
   - Add version and changelog

3. **Monitor Repository**
   - Enable Dependabot alerts
   - Enable branch protection
   - Watch for security updates

4. **Documentation**
   - Keep README updated
   - Add troubleshooting guide
   - Document API endpoints
   - Create FAQ section

5. **Community**
   - Respond to issues promptly
   - Review pull requests
   - Foster community contribution

---

## 📧 Support & Questions

For GitHub-specific help:

- [GitHub Help Documentation](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Community](https://github.community)

---

**Happy coding! Your project is now ready for the world! 🚀**
