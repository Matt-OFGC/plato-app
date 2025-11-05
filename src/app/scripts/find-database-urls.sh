#!/bin/bash
# Find Database Connection Strings
# This script helps locate PROD_DATABASE_URL and STAGING_DATABASE_URL

set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Finding Database Connection Strings${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check 1: Current environment variables
echo -e "${YELLOW}[1] Checking Current Environment Variables${NC}"
if [ -n "${PROD_DATABASE_URL:-}" ]; then
  echo -e "${GREEN}✓${NC} PROD_DATABASE_URL is set: ${PROD_DATABASE_URL%%@*}"
else
  echo "  PROD_DATABASE_URL not found in environment"
fi

if [ -n "${STAGING_DATABASE_URL:-}" ]; then
  echo -e "${GREEN}✓${NC} STAGING_DATABASE_URL is set: ${STAGING_DATABASE_URL%%@*}"
else
  echo "  STAGING_DATABASE_URL not found in environment"
fi

if [ -n "${DATABASE_URL:-}" ]; then
  echo -e "${GREEN}✓${NC} DATABASE_URL is set: ${DATABASE_URL%%@*}"
  echo "  (Might be your default/prod database)"
fi
echo ""

# Check 2: .env files
echo -e "${YELLOW}[2] Checking .env Files${NC}"
ENV_FILES=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.staging"
  ".env.development"
  "../.env"
  "../.env.local"
)

FOUND_ENV=false
for env_file in "${ENV_FILES[@]}"; do
  if [ -f "$env_file" ]; then
    echo "  Found: $env_file"
    if grep -q "DATABASE_URL\|PROD_DATABASE_URL\|STAGING_DATABASE_URL" "$env_file" 2>/dev/null; then
      echo "    Contains database URLs:"
      grep -E "DATABASE_URL|PROD_DATABASE_URL|STAGING_DATABASE_URL" "$env_file" | sed 's/\(.*=.*:.*:\).*/\1***/' || true
      FOUND_ENV=true
    fi
  fi
done

if [ "$FOUND_ENV" = false ]; then
  echo "  No .env files found with database URLs"
fi
echo ""

# Check 3: Common config files
echo -e "${YELLOW}[3] Checking Configuration Files${NC}"
CONFIG_FILES=(
  "next.config.js"
  "next.config.ts"
  "config/database.js"
  "config/database.ts"
  "lib/db.ts"
  "lib/database.ts"
  "prisma/.env"
)

for config_file in "${CONFIG_FILES[@]}"; do
  if [ -f "$config_file" ]; then
    echo "  Found: $config_file"
    if grep -q "postgres\|DATABASE_URL" "$config_file" 2>/dev/null; then
      echo "    Contains database references"
    fi
  fi
done
echo ""

# Check 4: Docker compose
echo -e "${YELLOW}[4] Checking Docker Compose Files${NC}"
DOCKER_FILES=(
  "docker-compose.yml"
  "docker-compose.yaml"
  "../docker-compose.yml"
)

for docker_file in "${DOCKER_FILES[@]}"; do
  if [ -f "$docker_file" ]; then
    echo "  Found: $docker_file"
    if grep -q "postgres\|DATABASE_URL" "$docker_file" 2>/dev/null; then
      echo "    Contains database configuration"
    fi
  fi
done
echo ""

# Check 5: Prisma schema/env
echo -e "${YELLOW}[5] Checking Prisma Configuration${NC}"
if [ -f "prisma/schema.prisma" ]; then
  echo "  Found: prisma/schema.prisma"
  if grep -q "url.*env" prisma/schema.prisma 2>/dev/null; then
    echo "    Uses environment variable for database URL"
    grep "url.*env" prisma/schema.prisma | head -1 || true
  fi
fi

if [ -f "prisma/.env" ]; then
  echo "  Found: prisma/.env"
  if grep -q "DATABASE_URL" prisma/.env 2>/dev/null; then
    echo "    Contains DATABASE_URL"
  fi
fi
echo ""

# Summary and guidance
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Where to Find Your Database URLs${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Common locations:"
echo ""
echo "1. Environment Variables (Current Shell)"
echo "   Run: env | grep DATABASE"
echo ""
echo "2. .env Files"
echo "   Check: .env, .env.local, .env.production, .env.staging"
echo "   Run: cat .env* 2>/dev/null | grep DATABASE"
echo ""
echo "3. Prisma Configuration"
echo "   Check: prisma/schema.prisma (look for 'url = env(\"DATABASE_URL\")')"
echo "   Check: prisma/.env"
echo ""
echo "4. Application Config"
echo "   Check: next.config.js, config files, lib/db.ts"
echo ""
echo "5. Cloud Provider Dashboard"
echo "   - AWS RDS: Check RDS console → Connectivity & security"
echo "   - Heroku: heroku config:get DATABASE_URL"
echo "   - Railway: Check project → Variables"
echo "   - Vercel: Check project → Settings → Environment Variables"
echo "   - Supabase: Check project → Settings → Database"
echo ""
echo "6. CI/CD Secrets"
echo "   - GitHub Actions: Repository → Settings → Secrets"
echo "   - GitLab CI: CI/CD → Variables"
echo ""
echo "7. Docker/Compose"
echo "   Check: docker-compose.yml (look for POSTGRES_URL or DATABASE_URL)"
echo ""
echo "8. Ask Your Team"
echo "   - Check team documentation"
echo "   - Ask DevOps/backend engineers"
echo "   - Check shared password managers"
echo ""
echo -e "${YELLOW}Format:${NC}"
echo "  postgres://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME"
echo ""
echo "Example:"
echo "  postgres://myuser:mypass@db.example.com:5432/mydb"
echo ""


