'use strict';
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const createPool = databaseUrl => new Pool({ connectionString: databaseUrl, max: 10 });

async function migrate(pool) {
  await pool.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
}

/** Unbestätigte Leads nach Ablauf löschen (Datensparsamkeit). */
async function purgeUnconfirmed(pool, days) {
  const { rowCount } = await pool.query(
    `DELETE FROM eid_leads WHERE confirmed_at IS NULL AND created_at < now() - ($1 || ' days')::interval`,
    [String(days)]
  );
  return rowCount;
}

module.exports = { createPool, migrate, purgeUnconfirmed };
