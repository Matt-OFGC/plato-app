#!/usr/bin/env node

/**
 * Responsive Design Audit Script
 * 
 * Scans the codebase for non-responsive patterns and provides recommendations
 * for converting to the new responsive design system.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SCAN_DIRS = [
  'components',
  'dashboard',
  '.',
  'lib'
];

const PATTERNS = {
  // Fixed pixel widths/heights
  fixedSizes: [
    /width:\s*\d+px/g,
    /height:\s*\d+px/g,
    /max-width:\s*\d+px/g,
    /max-height:\s*\d+px/g,
    /min-width:\s*\d+px/g,
    /min-height:\s*\d+px/g,
  ],
  
  // Tailwind arbitrary values
  tailwindArbitrary: [
    /w-\[\d+px\]/g,
    /h-\[\d+px\]/g,
    /max-w-\[\d+px\]/g,
    /max-h-\[\d+px\]/g,
    /min-w-\[\d+px\]/g,
    /min-h-\[\d+px\]/g,
  ],
  
  // Fixed padding/margins
  fixedSpacing: [
    /padding:\s*\d+px/g,
    /margin:\s*\d+px/g,
    /padding-[a-z]+:\s*\d+px/g,
    /margin-[a-z]+:\s*\d+px/g,
  ],
  
  // Absolute positioning for layout
  absoluteLayout: [
    /position:\s*absolute/g,
    /position:\s*fixed/g,
  ],
  
  // Non-responsive containers
  nonResponsiveContainers: [
    /max-w-7xl/g,
    /max-w-6xl/g,
    /max-w-5xl/g,
    /max-w-4xl/g,
    /max-w-3xl/g,
    /max-w-2xl/g,
    /max-w-xl/g,
    /max-w-lg/g,
    /max-w-md/g,
    /max-w-sm/g,
  ]
};

const RECOMMENDATIONS = {
  fixedSizes: 'Replace with responsive units: width: 100%, max-width: var(--container-max), or use responsive-grid classes',
  tailwindArbitrary: 'Replace with responsive classes: responsive-grid, responsive-card, or app-container',
  fixedSpacing: 'Replace with CSS variables: var(--gutter), var(--gutter-sm), var(--gutter-lg), etc.',
  absoluteLayout: 'Replace with flexbox or grid: responsive-flex, responsive-grid, or CSS Grid/Flexbox',
  nonResponsiveContainers: 'Replace with app-container class for fluid responsive containers'
};

class ResponsiveAuditor {
  constructor() {
    this.issues = [];
    this.stats = {
      filesScanned: 0,
      issuesFound: 0,
      patterns: {}
    };
  }

  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      this.stats.filesScanned++;
      
      Object.entries(PATTERNS).forEach(([category, patterns]) => {
        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              this.issues.push({
                file: relativePath,
                category,
                pattern: match,
                line: this.getLineNumber(content, match),
                recommendation: RECOMMENDATIONS[category]
              });
              
              this.stats.issuesFound++;
              this.stats.patterns[category] = (this.stats.patterns[category] || 0) + 1;
            });
          }
        });
      });
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    }
  }

  getLineNumber(content, match) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 'unknown';
  }

  scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.warn(`Warning: Directory ${dirPath} does not exist`);
      return;
    }

    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          this.scanDirectory(fullPath);
        }
      } else if (stat.isFile() && this.shouldScanFile(item)) {
        this.scanFile(fullPath);
      }
    });
  }

  shouldScanFile(filename) {
    const extensions = ['.tsx', '.ts', '.jsx', '.js', '.css'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  generateReport() {
    console.log('\n🔍 RESPONSIVE DESIGN AUDIT REPORT');
    console.log('=====================================\n');
    
    console.log(`📊 Summary:`);
    console.log(`   Files scanned: ${this.stats.filesScanned}`);
    console.log(`   Issues found: ${this.stats.issuesFound}`);
    console.log(`   Categories: ${Object.keys(this.stats.patterns).length}\n`);
    
    if (this.stats.issuesFound === 0) {
      console.log('✅ No responsive issues found! Your codebase is already responsive.');
      return;
    }
    
    console.log('📋 Issues by Category:');
    Object.entries(this.stats.patterns).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} issues`);
    });
    
    console.log('\n🔧 Detailed Issues:');
    console.log('===================\n');
    
    // Group issues by file
    const issuesByFile = {};
    this.issues.forEach(issue => {
      if (!issuesByFile[issue.file]) {
        issuesByFile[issue.file] = [];
      }
      issuesByFile[issue.file].push(issue);
    });
    
    Object.entries(issuesByFile).forEach(([file, issues]) => {
      console.log(`📁 ${file}`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.pattern}`);
        console.log(`   Category: ${issue.category}`);
        console.log(`   Recommendation: ${issue.recommendation}`);
        console.log('');
      });
    });
    
    console.log('\n💡 Quick Fixes:');
    console.log('===============');
    console.log('1. Replace fixed pixel sizes with responsive units');
    console.log('2. Use app-container for main containers');
    console.log('3. Use responsive-grid-* for layouts');
    console.log('4. Use responsive-card for cards');
    console.log('5. Use responsive-btn for buttons');
    console.log('6. Use responsive-input for form inputs');
    console.log('7. Use CSS variables for spacing (--gutter, --gutter-sm, etc.)');
    
    console.log('\n📚 Documentation:');
    console.log('=================');
    console.log('See globals.css for the complete responsive design system');
    console.log('Available classes: app-container, responsive-grid-*, responsive-card, etc.');
  }

  run() {
    console.log('🚀 Starting responsive design audit...\n');
    
    SCAN_DIRS.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`📂 Scanning ${dir}/...`);
        this.scanDirectory(dir);
      } else {
        console.warn(`⚠️  Directory ${dir} not found, skipping...`);
      }
    });
    
    this.generateReport();
    
    if (this.stats.issuesFound > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new ResponsiveAuditor();
  auditor.run();
}

module.exports = ResponsiveAuditor;
