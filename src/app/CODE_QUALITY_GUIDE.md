# Code Quality System for Plato

This guide explains the automated code quality system that helps maintain clean, secure, and maintainable code.

## 🎯 Purpose

The code quality system prevents:
- **Code duplication** - Multiple files doing the same thing
- **Security gaps** - Missing authorization checks
- **Broken links** - href="#" links that go nowhere
- **Unused files** - Dead code that clutters the codebase
- **Missing error handling** - API routes without try/catch
- **Excessive logging** - Too many console statements

## 🚀 Quick Start

### Run Code Quality Check
```bash
node scripts/code-quality-check.js
```

### Run Before Committing
```bash
node scripts/pre-commit-hook.js
```

## 📋 What Gets Checked

### 1. Duplicate Files
- **What**: Files with identical names and content
- **Impact**: Code duplication, maintenance burden
- **Action**: Remove duplicates, consolidate functionality

### 2. Security Gaps
- **What**: Database operations without company validation
- **Impact**: Potential unauthorized access
- **Action**: Add `getCurrentUserAndCompany()` checks

### 3. Broken Links
- **What**: `href="#"` links that don't go anywhere
- **Impact**: Poor user experience
- **Action**: Replace with proper URLs or remove

### 4. Unused Files
- **What**: Files that aren't imported anywhere
- **Impact**: Dead code, larger bundle size
- **Action**: Remove or fix imports

### 5. Missing Error Handling
- **What**: API routes without try/catch blocks
- **Impact**: Unhandled errors, poor user experience
- **Action**: Add proper error handling

### 6. Excessive Logging
- **What**: More than 5 console statements per file
- **Impact**: Performance, security (sensitive data)
- **Action**: Remove or reduce logging

### 7. TODO Comments
- **What**: TODO, FIXME, HACK, BUG comments
- **Impact**: Technical debt
- **Action**: Address or remove comments

## 🛠️ Integration

### Add to package.json
```json
{
  "scripts": {
    "quality-check": "node scripts/code-quality-check.js",
    "pre-commit": "node scripts/pre-commit-hook.js"
  }
}
```

### Git Hook Setup
```bash
# Make the hook executable
chmod +x scripts/pre-commit-hook.js

# Add to .git/hooks/pre-commit
echo "#!/bin/bash
node scripts/pre-commit-hook.js" > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 📊 Severity Levels

### HIGH (❌ Issues)
- **Security gaps** - Immediate fix required
- **Duplicate files** - Code duplication issues

### MEDIUM (⚠️ Warnings)
- **Missing error handling** - Should be fixed
- **Broken links** - User experience issues

### LOW (⚠️ Warnings)
- **Excessive logging** - Clean up when possible
- **TODO comments** - Address during cleanup
- **Unused files** - Review and remove

## 🎯 Best Practices

### When Writing Code
1. **Always add company validation** to database operations
2. **Use proper error handling** in API routes
3. **Avoid href="#"** - use real URLs or remove links
4. **Don't duplicate code** - extract to shared components
5. **Minimize console statements** - use proper logging

### Before Committing
1. **Run quality check**: `node scripts/code-quality-check.js`
2. **Fix all HIGH severity issues**
3. **Address MEDIUM issues when possible**
4. **Review LOW warnings during cleanup**

### Code Review Checklist
- [ ] No duplicate files
- [ ] All database operations have company validation
- [ ] All API routes have error handling
- [ ] No broken links (href="#")
- [ ] Minimal console statements
- [ ] No TODO/FIXME comments

## 🔧 Customization

### Adding New Checks
Edit `scripts/code-quality-check.js` and add a new method:

```javascript
async newCheck() {
  console.log('🔍 Running new check...');
  
  const files = this.getAllFiles();
  files.forEach(file => {
    // Your check logic here
    if (/* condition */) {
      this.issues.push({
        type: 'NEW_ISSUE',
        message: 'Description of issue',
        file,
        severity: 'HIGH'
      });
    }
  });
}
```

Then add it to the `checks` array:
```javascript
this.checks = [
  // ... existing checks
  'newCheck'
];
```

### Modifying Severity Levels
Change the `severity` field in the issue/warning objects:
- `'HIGH'` - Critical issues that must be fixed
- `'MEDIUM'` - Important issues that should be fixed
- `'LOW'` - Minor issues for cleanup

## 📈 Metrics

The system tracks:
- **Total issues found**
- **Issues by severity**
- **Files with problems**
- **Types of issues**

Use these metrics to:
- Track code quality over time
- Identify problem areas
- Measure improvement

## 🚨 Emergency Override

If you need to commit urgently and can't fix issues immediately:

```bash
# Skip the pre-commit hook (not recommended)
git commit --no-verify -m "Emergency commit"
```

**Always come back and fix the issues later!**

## 📞 Support

If you encounter issues with the code quality system:
1. Check the console output for specific error messages
2. Ensure all dependencies are installed
3. Verify file paths are correct
4. Check file permissions

## 🎉 Success Metrics

A healthy codebase should have:
- ✅ 0 HIGH severity issues
- ✅ < 5 MEDIUM severity warnings
- ✅ < 10 LOW severity warnings
- ✅ All checks passing

Keep your code clean and secure! 🚀
