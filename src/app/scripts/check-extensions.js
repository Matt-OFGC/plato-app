#!/usr/bin/env node
// Check PostgreSQL extensions using Node.js (no psql needed)
const { Client } = require('pg');

const DATABASE_URL = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: STAGING_DATABASE_URL or DATABASE_URL must be set');
  process.exit(1);
}

const extensions = ['pg_trgm', 'citext', 'uuid-ossp'];

async function checkExtensions() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT extname FROM pg_extension 
      WHERE extname IN ('pg_trgm','citext','uuid-ossp')
      ORDER BY extname;
    `);
    
    const installed = result.rows.map(r => r.extname);
    const missing = extensions.filter(ext => {
      const checkExt = ext === 'uuid-ossp' ? 'uuid-ossp' : ext;
      return !installed.includes(checkExt);
    });

    if (missing.length === 0) {
      console.log('ALL_INSTALLED');
      process.exit(0);
    } else {
      console.log('MISSING:', missing.join(' '));
      process.exit(1);
    }
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkExtensions();


