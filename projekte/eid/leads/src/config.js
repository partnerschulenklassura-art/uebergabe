'use strict';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Umgebungsvariable ${name} fehlt (siehe .env.example)`);
  return v;
}

function load() {
  return {
    port: Number(process.env.PORT || 3120),
    databaseUrl: required('DATABASE_URL'),
    publicUrl: (process.env.PUBLIC_URL || 'http://localhost:3120').replace(/\/$/, ''),
    siteUrl: (process.env.SITE_URL || process.env.PUBLIC_URL || 'http://localhost:3120').replace(/\/$/, ''),
    brandName: process.env.BRAND_NAME || 'Energie-Institut Deutschland',
    contactEmail: process.env.CONTACT_EMAIL || 'info@example.de',
    adminToken: required('ADMIN_TOKEN'),
    ipSalt: required('IP_HASH_SALT'),
    unsubscribeSecret: required('UNSUBSCRIBE_SECRET'),
    trustProxy: process.env.TRUST_PROXY !== 'false',
    smtp: process.env.SMTP_HOST
      ? {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
          from: process.env.SMTP_FROM || process.env.CONTACT_EMAIL
        }
      : null,
    // Einwilligungstexte versioniert. Bei Textänderung im Formular Version erhöhen.
    consent: {
      privacy: 'eid-datenschutz-2026-11-v1',
      callback: 'eid-rueckruf-2026-11-v1',
      marketing: 'eid-angebote-2026-11-v1'
    },
    unconfirmedRetentionDays: Number(process.env.UNCONFIRMED_RETENTION_DAYS || 30)
  };
}

module.exports = { load };
