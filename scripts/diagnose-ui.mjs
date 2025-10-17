#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔧 Plato UI Diagnostics Tool\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

// Step 1: Clean caches
logSection('Cleaning Caches');
try {
  log('yellow', 'Clearing Next.js cache...');
  execSync('rm -rf .next', { cwd: projectRoot, stdio: 'inherit' });
  
  log('yellow', 'Clearing node_modules cache...');
  execSync('rm -rf node_modules/.vite', { cwd: projectRoot, stdio: 'inherit' });
  
  log('yellow', 'Clearing build directories...');
  execSync('rm -rf dist build', { cwd: projectRoot, stdio: 'inherit' });
  
  log('green', '✅ Caches cleared successfully');
} catch (error) {
  log('red', '❌ Error clearing caches:', error.message);
}

// Step 2: Get build info
logSection('Build Information');
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  const gitSha = execSync('git rev-parse --short HEAD', { cwd: projectRoot, encoding: 'utf8' }).trim();
  const buildTime = new Date().toISOString();
  
  log('blue', `App Version: ${packageJson.version}`);
  log('blue', `Git SHA: ${gitSha}`);
  log('blue', `Build Time: ${buildTime}`);
  log('blue', `Node Environment: ${process.env.NODE_ENV || 'development'}`);
} catch (error) {
  log('red', '❌ Error getting build info:', error.message);
}

// Step 3: Check for duplicate components
logSection('Component Analysis');
try {
  const componentsPath = join(projectRoot, 'src/components');
  const appComponentsPath = join(projectRoot, 'src/app/components');
  
  log('yellow', 'Checking component locations...');
  
  const criticalComponents = [
    'SidebarImproved.tsx',
    'DashboardNavWrapper.tsx',
    'Providers.tsx',
    'ErrorBoundary.tsx',
    'FloatingBackButton.tsx',
    'KeyboardShortcutsProvider.tsx'
  ];
  
  const issues = [];
  
  criticalComponents.forEach(component => {
    const inSrc = existsSync(join(componentsPath, component));
    const inApp = existsSync(join(appComponentsPath, component));
    
    if (inSrc && !inApp) {
      issues.push({
        component,
        issue: 'MISSING_IN_APP',
        message: `Component exists in src/components/ but missing in src/app/components/`
      });
    } else if (!inSrc && !inApp) {
      issues.push({
        component,
        issue: 'MISSING',
        message: `Component missing entirely`
      });
    } else if (inSrc && inApp) {
      issues.push({
        component,
        issue: 'DUPLICATE',
        message: `Component exists in both locations`
      });
    }
  });
  
  if (issues.length === 0) {
    log('green', '✅ No component issues found');
  } else {
    log('red', '❌ Component issues found:');
    issues.forEach(issue => {
      log('red', `  - ${issue.component}: ${issue.message}`);
    });
  }
} catch (error) {
  log('red', '❌ Error analyzing components:', error.message);
}

// Step 4: Check route structure
logSection('Route Analysis');
try {
  const routeFiles = [
    'src/app/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/dashboard/layout.tsx',
    'src/app/dashboard/recipes/page.tsx',
    'src/app/dashboard/business/page.tsx',
    'src/app/dashboard/account/page.tsx',
    'src/app/dashboard/ingredients/page.tsx',
    'src/app/dashboard/team/page.tsx'
  ];
  
  log('yellow', 'Checking route files...');
  
  const missingRoutes = [];
  routeFiles.forEach(route => {
    if (!existsSync(join(projectRoot, route))) {
      missingRoutes.push(route);
    }
  });
  
  if (missingRoutes.length === 0) {
    log('green', '✅ All route files present');
  } else {
    log('red', '❌ Missing route files:');
    missingRoutes.forEach(route => {
      log('red', `  - ${route}`);
    });
  }
} catch (error) {
  log('red', '❌ Error analyzing routes:', error.message);
}

// Step 5: Check Tailwind configuration
logSection('Tailwind Configuration');
try {
  const tailwindConfig = join(projectRoot, 'tailwind.config.js');
  const postcssConfig = join(projectRoot, 'postcss.config.mjs');
  
  if (existsSync(tailwindConfig)) {
    log('green', '✅ Tailwind config found');
  } else {
    log('red', '❌ Tailwind config missing');
  }
  
  if (existsSync(postcssConfig)) {
    log('green', '✅ PostCSS config found');
  } else {
    log('red', '❌ PostCSS config missing');
  }
} catch (error) {
  log('red', '❌ Error checking Tailwind config:', error.message);
}

// Step 6: Rebuild
logSection('Rebuilding Project');
try {
  log('yellow', 'Installing dependencies...');
  execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
  
  log('yellow', 'Generating Prisma client...');
  execSync('npx prisma generate', { cwd: projectRoot, stdio: 'inherit' });
  
  log('yellow', 'Building project...');
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  
  log('green', '✅ Build completed successfully');
} catch (error) {
  log('red', '❌ Build failed:', error.message);
}

// Step 7: Final summary
logSection('Diagnosis Complete');
log('green', '🎉 UI diagnostics completed!');
log('blue', 'Next steps:');
log('blue', '1. Check the debug badge in the bottom-left corner of your app');
log('blue', '2. Visit /__debug to see detailed diagnostics');
log('blue', '3. If issues persist, check the component import paths');
log('blue', '4. Restart your dev server: npm run dev');

console.log('\n');
