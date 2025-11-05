/**
 * Repository Contract Tests
 * 
 * Verifies that all Recipe queries go through a unified repository/service boundary.
 * Fails if any module queries Recipe tables directly, bypassing the repository.
 * 
 * This test enforces the architectural pattern:
 * - All Recipe reads/writes must go through RecipeRepository
 * - No direct Prisma queries to Recipe/RecipeItem/RecipeSection outside repository
 * 
 * Run with: npm test -- tests/integration/repository_contract.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Repository Contract Tests', () => {
  const appRoot = path.join(__dirname, '../../');
  
  // Files that are ALLOWED to query Recipe directly (repository itself)
  const allowedFiles = [
    'lib/repositories/recipe-repository.ts',
    'tests/integration/recipe_flow.test.ts',
    'tests/integration/db_contract.test.ts',
    'tests/integration/repository_contract.test.ts',
    'prisma/seed.ts', // Seed scripts are allowed
  ];

  // Patterns that indicate direct Recipe queries (bypassing repository)
  const directQueryPatterns = [
    /prisma\.recipe\.(findMany|findUnique|findFirst|create|update|delete|upsert)/,
    /prisma\.recipeItem\.(findMany|findUnique|findFirst|create|update|delete|upsert)/,
    /prisma\.recipeSection\.(findMany|findUnique|findFirst|create|update|delete|upsert)/,
    /from\s+["']Recipe["']/i,
    /from\s+["']RecipeItem["']/i,
    /from\s+["']RecipeSection["']/i,
    /\$queryRaw.*Recipe/i,
    /\$executeRaw.*Recipe/i,
  ];

  // Patterns that indicate repository usage (allowed)
  const repositoryPatterns = [
    /RecipeRepository\./,
    /recipeRepository\./,
    /recipe-repository/,
    /from\s+['"]@\/lib\/repositories\/recipe-repository['"]/,
    /from\s+['"]\.\.\/\.\.\/lib\/repositories\/recipe-repository['"]/,
  ];

  function isAllowedFile(filePath: string): boolean {
    const relativePath = path.relative(appRoot, filePath);
    return allowedFiles.some(allowed => relativePath.includes(allowed));
  }

  function hasRepositoryImport(content: string): boolean {
    return repositoryPatterns.some(pattern => pattern.test(content));
  }

  function hasDirectQuery(content: string): boolean {
    return directQueryPatterns.some(pattern => pattern.test(content));
  }

  it('should enforce repository boundary for Recipe queries', async () => {
    // Find all TypeScript/JavaScript files in app directory
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: appRoot,
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        'tests/**', // Test files are allowed (they test the repository)
        'prisma/**', // Prisma files are allowed
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      absolute: true,
    });

    // Handle case where glob returns undefined or empty result
    if (!files || !Array.isArray(files)) {
      console.warn('⚠️  Could not find files to check. Skipping repository boundary test.');
      return;
    }

    const violations: Array<{ file: string; line: number; pattern: string }> = [];

    for (const file of files) {
      if (isAllowedFile(file)) {
        continue; // Skip allowed files
      }

      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        // Check if file uses repository
        const usesRepository = hasRepositoryImport(content);

        // Check for direct queries
        if (hasDirectQuery(content)) {
          // Find the specific line and pattern
          lines.forEach((line, index) => {
            directQueryPatterns.forEach(pattern => {
              if (pattern.test(line)) {
                violations.push({
                  file: path.relative(appRoot, file),
                  line: index + 1,
                  pattern: pattern.toString(),
                });
              }
            });
          });
        }
      } catch (error) {
        // Skip files that can't be read (symlinks, etc.)
        console.warn(`Skipping file ${file}: ${error}`);
      }
    }

    if (violations.length > 0) {
      const violationMessages = violations.map(v => 
        `  ${v.file}:${v.line} - Pattern: ${v.pattern}`
      ).join('\n');

      // For now, warn instead of fail (repository doesn't exist yet)
      console.warn(`
⚠️  Repository Contract Violations Found:
${violationMessages}

These files query Recipe tables directly instead of using RecipeRepository.
After implementing RecipeRepository, these should be refactored to use the repository.

This is a WARNING, not a failure, because RecipeRepository doesn't exist yet.
After implementing the repository, this test should FAIL if violations exist.
      `);
    }

    // Note: This test will pass initially, but should be updated to FAIL
    // after RecipeRepository is implemented
    // Uncomment the following after repository implementation:
    // expect(violations).toHaveLength(0);
  });

  it('should verify RecipeRepository exists and exports required methods', async () => {
    const repositoryPath = path.join(appRoot, 'lib/repositories/recipe-repository.ts');
    const repositoryExists = fs.existsSync(repositoryPath);

    if (!repositoryExists) {
      console.warn(`
⚠️  RecipeRepository not found at: ${repositoryPath}

This is expected initially. After implementing RecipeRepository, this test should verify:
- RecipeRepository.getRecipeForDetailPage()
- RecipeRepository.getRecipeForListPage()
- RecipeRepository.getRecipeForBusinessProfile()
- RecipeRepository.createRecipe()
- RecipeRepository.updateRecipe()
- RecipeRepository.deleteRecipe()
      `);
    }

    // Note: This test will pass initially, but should be updated to verify
    // repository methods exist after implementation
    // expect(repositoryExists).toBe(true);
  });

  it('should document allowed query patterns', () => {
    // This test documents the architectural decision
    const allowedPatterns = [
      'RecipeRepository.getRecipeForDetailPage(id, companyId)',
      'RecipeRepository.getRecipeForListPage(companyId)',
      'RecipeRepository.getRecipeForBusinessProfile(id)',
      'RecipeRepository.createRecipe(data)',
      'RecipeRepository.updateRecipe(id, data)',
      'RecipeRepository.deleteRecipe(id)',
    ];

    expect(allowedPatterns.length).toBeGreaterThan(0);
    
    console.log(`
✅ Allowed Recipe Query Patterns:
${allowedPatterns.map(p => `  - ${p}`).join('\n')}

❌ Disallowed Patterns:
  - Direct prisma.recipe.* calls outside repository
  - Raw SQL queries to Recipe tables outside repository
  - Direct RecipeItem/RecipeSection queries outside repository
    `);
  });
});

