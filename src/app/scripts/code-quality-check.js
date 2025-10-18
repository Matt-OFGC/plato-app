#!/usr/bin/env node

/**
 * Code Quality Check System for Plato
 * 
 * This script performs comprehensive checks to ensure code quality and prevent:
 * - Code duplication
 * - Security gaps
 * - Broken links
 * - Unused files
 * - Missing error handling
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CodeQualityChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.srcPath = path.join(__dirname, '..');
    this.checks = [
      'duplicateFiles',
      'securityGaps',
      'brokenLinks',
      'unusedFiles',
      'missingErrorHandling',
      'excessiveLogging',
      'todoComments'
    ];
  }

  log(level, message, file = null) {
    const prefix = level === 'ERROR' ? '❌' : level === 'WARNING' ? '⚠️' : '✅';
    const fileInfo = file ? ` (${file})` : '';
    console.log(`${prefix} ${message}${fileInfo}`);
  }

  async runAllChecks() {
    console.log('🔍 Running Code Quality Checks...\n');
    
    for (const check of this.checks) {
      await this[check]();
    }
    
    this.printSummary();
  }

  async duplicateFiles() {
    console.log('📁 Checking for duplicate files...');
    
    const files = this.getAllFiles();
    const fileGroups = {};
    
    // Group files by name
    files.forEach(file => {
      const basename = path.basename(file);
      if (!fileGroups[basename]) {
        fileGroups[basename] = [];
      }
      fileGroups[basename].push(file);
    });
    
    // Find duplicates
    Object.entries(fileGroups).forEach(([name, paths]) => {
      if (paths.length > 1) {
        // Check if they're actually different
        const contents = paths.map(p => fs.readFileSync(p, 'utf8'));
        const isDuplicate = contents.every(content => content === contents[0]);
        
        if (isDuplicate) {
          this.issues.push({
            type: 'DUPLICATE_FILE',
            message: `Duplicate file: ${name}`,
            files: paths,
            severity: 'HIGH'
          });
        } else {
          this.warnings.push({
            type: 'SIMILAR_FILES',
            message: `Similar files with same name: ${name}`,
            files: paths,
            severity: 'MEDIUM'
          });
        }
      }
    });
  }

  async securityGaps() {
    console.log('🔒 Checking for security gaps...');
    
    const actionFiles = this.getFilesByPattern('**/actions*.ts');
    const apiFiles = this.getFilesByPattern('**/api/**/*.ts');
    
    [...actionFiles, ...apiFiles].forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for missing company validation
      if (content.includes('prisma.') && !content.includes('getCurrentUserAndCompany')) {
        this.issues.push({
          type: 'SECURITY_GAP',
          message: 'Missing company validation',
          file,
          severity: 'HIGH'
        });
      }
      
      // Check for missing error handling
      if (content.includes('await prisma.') && !content.includes('try') && !content.includes('catch')) {
        this.warnings.push({
          type: 'MISSING_ERROR_HANDLING',
          message: 'Database operation without error handling',
          file,
          severity: 'MEDIUM'
        });
      }
    });
  }

  async brokenLinks() {
    console.log('🔗 Checking for broken links...');
    
    const htmlFiles = this.getFilesByPattern('**/*.tsx');
    
    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Find href="#" links
      const brokenLinks = content.match(/href=["']#["']/g);
      if (brokenLinks) {
        this.issues.push({
          type: 'BROKEN_LINK',
          message: `Found ${brokenLinks.length} broken links (href="#")`,
          file,
          severity: 'MEDIUM'
        });
      }
    });
  }

  async unusedFiles() {
    console.log('🗑️ Checking for unused files...');
    
    const allFiles = this.getAllFiles();
    const usedFiles = new Set();
    
    // Find all import statements
    allFiles.forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(file, 'utf8');
        const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
        
        imports.forEach(imp => {
          const importPath = imp.match(/from\s+['"]([^'"]+)['"]/)[1];
          const resolvedPath = this.resolveImportPath(importPath, file);
          if (resolvedPath) {
            usedFiles.add(resolvedPath);
          }
        });
      }
    });
    
    // Find unused files
    allFiles.forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (!usedFiles.has(file) && !this.isEntryPoint(file)) {
          this.warnings.push({
            type: 'UNUSED_FILE',
            message: 'Potentially unused file',
            file,
            severity: 'LOW'
          });
        }
      }
    });
  }

  async missingErrorHandling() {
    console.log('⚠️ Checking for missing error handling...');
    
    const apiFiles = this.getFilesByPattern('**/api/**/*.ts');
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('export async function') && !content.includes('try') && !content.includes('catch')) {
        this.warnings.push({
          type: 'MISSING_ERROR_HANDLING',
          message: 'API route without error handling',
          file,
          severity: 'MEDIUM'
        });
      }
    });
  }

  async excessiveLogging() {
    console.log('📝 Checking for excessive logging...');
    
    const allFiles = this.getAllFiles();
    
    allFiles.forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(file, 'utf8');
        const logStatements = content.match(/console\.(log|error|warn)/g) || [];
        
        if (logStatements.length > 5) {
          this.warnings.push({
            type: 'EXCESSIVE_LOGGING',
            message: `Found ${logStatements.length} console statements`,
            file,
            severity: 'LOW'
          });
        }
      }
    });
  }

  async todoComments() {
    console.log('📋 Checking for TODO comments...');
    
    const allFiles = this.getAllFiles();
    
    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const todos = content.match(/TODO|FIXME|HACK|BUG/gi) || [];
      
      if (todos.length > 0) {
        this.warnings.push({
          type: 'TODO_COMMENT',
          message: `Found ${todos.length} TODO/FIXME comments`,
          file,
          severity: 'LOW'
        });
      }
    });
  }

  getAllFiles() {
    const files = [];
    
    const walkDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !this.shouldSkipDir(item)) {
          walkDir(fullPath);
        } else if (stat.isFile() && this.shouldCheckFile(item)) {
          files.push(fullPath);
        }
      });
    };
    
    walkDir(this.srcPath);
    return files;
  }

  getFilesByPattern(pattern) {
    try {
      const result = execSync(`find ${this.srcPath} -name "${pattern.replace('**/', '')}"`, { encoding: 'utf8' });
      return result.trim().split('\n').filter(f => f);
    } catch (error) {
      return [];
    }
  }

  shouldSkipDir(dirName) {
    const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build'];
    return skipDirs.includes(dirName);
  }

  shouldCheckFile(fileName) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    return extensions.some(ext => fileName.endsWith(ext));
  }

  isEntryPoint(file) {
    const entryPoints = ['page.tsx', 'layout.tsx', 'route.ts', 'middleware.ts'];
    return entryPoints.some(ep => file.endsWith(ep));
  }

  resolveImportPath(importPath, fromFile) {
    // Simple resolution - in a real implementation, you'd want more sophisticated resolution
    if (importPath.startsWith('@/')) {
      return path.join(this.srcPath, importPath.replace('@/', ''));
    }
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return path.resolve(path.dirname(fromFile), importPath);
    }
    return null;
  }

  printSummary() {
    console.log('\n📊 Code Quality Summary:');
    console.log('========================');
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('✅ All checks passed! Your code is in great shape.');
      return;
    }
    
    if (this.issues.length > 0) {
      console.log(`\n❌ ${this.issues.length} Issues Found:`);
      this.issues.forEach(issue => {
        console.log(`  • ${issue.message} (${issue.severity})`);
        if (issue.file) console.log(`    File: ${issue.file}`);
        if (issue.files) issue.files.forEach(f => console.log(`    File: ${f}`));
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ ${this.warnings.length} Warnings:`);
      this.warnings.forEach(warning => {
        console.log(`  • ${warning.message} (${warning.severity})`);
        if (warning.file) console.log(`    File: ${warning.file}`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    console.log('  • Fix all HIGH severity issues immediately');
    console.log('  • Address MEDIUM severity issues when possible');
    console.log('  • Review LOW severity warnings during cleanup');
    console.log('  • Run this check before each commit');
  }
}

// Run the checks
if (require.main === module) {
  const checker = new CodeQualityChecker();
  checker.runAllChecks().catch(console.error);
}

module.exports = CodeQualityChecker;
