'use strict';
require('dotenv').config();
const { load } = require('./src/config');
const { createPool, migrate, purgeUnconfirmed } = require('./src/db');
const { createMailer } = require('./src/mailer');
const { createApp } = require('./src/app');

async function main() {
  const config = load();
  const pool = createPool(config.databaseUrl);
  await migrate(pool);
  const app = createApp({ pool, mailer: createMailer(config), config });
  const server = app.listen(config.port, '127.0.0.1', () => console.log(`EID-Leads läuft auf 127.0.0.1:${config.port}`));

  const purge = async () => {
    try {
      const n = await purgeUnconfirmed(pool, config.unconfirmedRetentionDays);
      if (n) console.log(`${n} unbestätigte Leads gelöscht`);
    } catch (e) {
      console.error('purge failed', e.message);
    }
  };
  purge();
  const timer = setInterval(purge, 24 * 60 * 60 * 1000);
  const shutdown = () => {
    clearInterval(timer);
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
