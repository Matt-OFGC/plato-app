#!/usr/bin/env node
// Install PostgreSQL extensions using Node.js (no psql needed)
const { Client } = require('pg');

const STAGING_DATABASE_URL = process.env.STAGING_DATABASE_URL || 
  "postgresql://neondb_owner:npg_mXqCKBWa9zg5@ep-small-base-abgcgmmc-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const extensions = [
  'pg_trgm',
  'citext',
  'uuid-ossp'
];

async function installExtensions() {
  const client = new Client({
    connectionString: STAGING_DATABASE_URL,
  });

  try {
    console.log('Connecting to staging database...');
    await client.connect();
    console.log('✅ Connected!\n');

    for (const ext of extensions) {
      try {
        console.log(`Installing extension: ${ext}...`);
        // uuid-ossp needs quotes
        const extName = ext === 'uuid-ossp' ? `"${ext}"` : ext;
        await client.query(`CREATE EXTENSION IF NOT EXISTS ${extName};`);
        console.log(`✅ ${ext} installed`);
      } catch (error) {
        if (error.message.includes('permission denied') || error.message.includes('must be superuser')) {
          console.log(`⚠️  ${ext} requires superuser - may need to install via Neon dashboard`);
        } else {
          console.log(`❌ ${ext} failed: ${error.message}`);
        }
      }
    }

    // Verify
    console.log('\nVerifying installed extensions...');
    const result = await client.query(`
      SELECT extname FROM pg_extension 
      WHERE extname IN ('pg_trgm','citext','uuid-ossp')
      ORDER BY extname;
    `);
    
    console.log('\nInstalled extensions:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.extname}`);
    });

    const installed = result.rows.map(r => r.extname);
    const missing = extensions.filter(ext => {
      const checkExt = ext === 'uuid-ossp' ? 'uuid-ossp' : ext;
      return !installed.includes(checkExt);
    });

    if (missing.length > 0) {
      console.log('\n⚠️  Missing extensions:');
      missing.forEach(ext => console.log(`  - ${ext}`));
      console.log('\nThese may need to be installed via Neon dashboard as superuser.');
      process.exit(1);
    } else {
      console.log('\n✅ All extensions installed successfully!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

installExtensions();


