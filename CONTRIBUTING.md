# Contributing to EduTalk

Thank you for your interest in contributing to EduTalk! We appreciate your help in making this platform better.

## 🎯 How to Contribute

### Bug Reports

Found a bug? Help us fix it!

1. **Check existing issues** - Make sure it hasn't been reported already
2. **Create an issue** with:
   - Clear title describing the bug
   - Detailed description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (Node version, OS, browser if frontend)
   - Screenshots if applicable

### Feature Requests

Have an idea? We'd love to hear it!

1. **Check existing discussions** - Avoid duplicates
2. **Create an issue** with:
   - Clear title
   - Why this feature is needed
   - How it would work
   - Potential implementation approach
   - Any alternatives considered

### Code Contributions

Want to submit code? Excellent! Here's the process:

## 📝 Getting Started

### 1. Fork the Repository

```bash
# Go to https://github.com/yourusername/edutalk
# Click "Fork" button
```

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/edutalk.git
cd edutalk
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/original-owner/edutalk.git
```

### 4. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix-name
```

### 5. Setup Development Environment

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev

# Frontend (in new terminal)
cd frontend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

## 💻 Development Guidelines

### Code Style

#### JavaScript/Node.js

```javascript
// ✅ DO: Use arrow functions and const
const calculatePrice = (basePrice, days) => {
  const multiplier = getPricingMultiplier(days);
  return basePrice * multiplier;
};

// ❌ DON'T: Use var or function declarations
var calculatePrice = function (basePrice, days) {
  // ...
};

// ✅ DO: Use async/await
async function fetchClasses() {
  try {
    const response = await fetch("/api/classes");
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

// ❌ DON'T: Use .then() chains unless necessary
```

#### React Components

```jsx
// ✅ DO: Use functional components with hooks
import { useState, useEffect } from "react";

export default function ClassCard({ classData }) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // Effect logic
  }, []);

  return <div className="ClassCard">{/* JSX */}</div>;
}

// ❌ DON'T: Use class components
class ClassCard extends React.Component {
  // ...
}
```

#### CSS/Styling

```css
/* ✅ DO: Use BEM naming convention */
.ClassCard {
}
.ClassCard__header {
}
.ClassCard__title {
}
.ClassCard__title--highlighted {
}

/* ❌ DON'T: Use non-semantic names */
.card-section {
}
.big-title {
}
.red-text {
}
```

### Commit Messages

Use conventional commits format:

```bash
# Feature
git commit -m "feat: Add real-time notifications for new students"

# Bug fix
git commit -m "fix: Correct pricing calculation for 7-day purchases"

# Documentation
git commit -m "docs: Update API endpoint documentation"

# Code styling
git commit -m "style: Format payment controller code"

# Refactoring
git commit -m "refactor: Extract pricing logic to separate service"

# Performance
git commit -m "perf: Optimize class query with database indexes"

# Tests
git commit -m "test: Add tests for access code generation"

# Chore/Maintenance
git commit -m "chore: Update dependencies"
```

**Format**: `<type>: <subject>`

- Keep subject under 50 characters
- Use imperative mood ("Add" not "Added")
- Don't end with period

### Commit Best Practices

- ✅ Commit frequently with logical chunks
- ✅ Each commit should be a single logical change
- ✅ Write meaningful commit messages
- ✅ Don't include sensitive data
- ✅ Test before committing

```bash
# ✅ Good: Multiple focused commits
git commit -m "feat: Add email notification service"
git commit -m "feat: Send notification when student enrolls"
git commit -m "test: Add tests for notification service"

# ❌ Bad: One large commit with everything
git commit -m "Update stuff"
git commit -m "WIP"
```

## 🧪 Testing

### Before Submitting PR

```bash
# Backend
cd backend
npm run integration-test

# Frontend
cd frontend
npm run build
npm run preview
```

### Manual Testing Checklist

- [ ] Feature works as intended
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] No breaking changes to existing features
- [ ] All API calls work correctly
- [ ] Error handling is appropriate

## 📋 Pull Request Process

### 1. Update Your Branch

```bash
# Fetch latest upstream changes
git fetch upstream

# Rebase your branch
git rebase upstream/main

# If conflicts occur, resolve them
# Then continue rebase
git rebase --continue
```

### 2. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

On GitHub:

1. Go to your forked repository
2. Click "New pull request"
3. Set:
   - **Base repository**: original-owner/edutalk
   - **Base branch**: main
   - **Head repository**: YOUR-USERNAME/edutalk
   - **Compare branch**: your-feature-name
4. Add title and description:

```markdown
## Description

Brief explanation of what this PR does

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)

## Related Issues

Closes #123

## Changes Made

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Manual testing completed
- [ ] No breaking changes
- [ ] Backward compatible
- [ ] Tested on: (Desktop/Mobile/Tablet)

## Screenshots (if UI changes)

[Add screenshots here]

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

### 4. Address Feedback

- Respond to comments respectfully
- Make requested changes
- Push updates to same branch
- Resolve conversations

### 5. Merge

Once approved, maintainers will merge your PR.

## 📚 Documentation Standards

### Code Comments

```javascript
// ✅ DO: Explain WHY, not WHAT
// Calculate daily rate with commitment multiplier to incentivize longer purchases
const dailyRate = (monthlyPrice / 30) * getMultiplier(days);

// ❌ DON'T: State the obvious
// Multiply price by 30 and get multiplier
const dailyRate = (monthlyPrice / 30) * getMultiplier(days);
```

### Function Documentation

```javascript
/**
 * Calculate pricing for a class enrollment
 * @param {number} basePrice - Monthly price in cents
 * @param {number} days - Number of days for access (1-30)
 * @returns {number} Total price in cents
 * @throws {Error} If days is outside 1-30 range
 */
export const calculatePrice = (basePrice, days) => {
  if (days < 1 || days > 30) {
    throw new Error("Days must be between 1 and 30");
  }
  const multiplier = getPricingMultiplier(days);
  return basePrice * multiplier;
};
```

## 🔐 Security Guidelines

- ❌ Never commit `.env` files or secrets
- ❌ Don't expose API keys in code
- ❌ Never log sensitive user data
- ❌ Validate all user inputs
- ✅ Use environment variables
- ✅ Hash passwords with bcrypt
- ✅ Sanitize user input
- ✅ Use HTTPS in production

## 🚀 Large Feature Contributions

For major features:

1. **Open an issue first** - Discuss approach
2. **Create a design document** (if needed)
3. **Break into smaller PRs** - Easier to review
4. **Update documentation** - Keep everything in sync
5. **Add tests** - Cover new functionality

## 💬 Communication

- Be respectful and inclusive
- Assume good intentions
- Ask questions if unclear
- Help others learn
- No harassment or discrimination

## 🎓 Learning Resources

- [Git Guide](https://git-scm.com/book/en/v2)
- [GitHub Docs](https://docs.github.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)

## 📞 Questions or Need Help?

- Check existing issues/discussions
- Create a new issue with `question` label
- Reach out to maintainers
- Comment on related PR/issue

## 🙏 Thank You!

Your contributions make EduTalk better. We appreciate your time and effort!

---

**Happy contributing! 🎉**
