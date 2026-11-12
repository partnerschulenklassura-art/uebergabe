'use strict';
// Läuft gegen eine echte PostgreSQL-Testdatenbank. Löscht dort die Tabelle eid_leads. Nie gegen Produktion ausführen.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { createPool, migrate, purgeUnconfirmed } = require('../src/db');
const { createApp, dueFollowups, sign } = require('../src/app');

const DB = process.env.TEST_DATABASE_URL;
if (!DB) {
  test('TEST_DATABASE_URL fehlt – Tests übersprungen', { skip: true }, () => {});
  return;
}

const config = {
  publicUrl: 'https://api.test',
  siteUrl: 'https://site.test',
  brandName: 'EID',
  contactEmail: 'info@test',
  adminToken: 'admin-token-123',
  ipSalt: 'salz',
  unsubscribeSecret: 'geheim',
  trustProxy: false,
  consent: { privacy: 'p1', callback: 'c1', marketing: 'm1' },
  unconfirmedRetentionDays: 30
};
const sent = [];
const mailer = { sendConfirmation: async m => sent.push(m) };
const silent = { error() {}, info() {} };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

let pool;
let server;
let base;
const auth = { authorization: 'Bearer admin-token-123' };

const post = (path, body, headers = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const get = (path, headers = {}) => fetch(base + path, { headers, redirect: 'manual' });

const valid = (o = {}) => ({
  interest: 'bestand',
  name: 'Erika Muster',
  email: 'Erika@Example.de',
  plz: '08412',
  kwp: '35,5',
  privacy: true,
  marketing: true,
  source: 'strom',
  ...o
});

test.before(async () => {
  pool = createPool(DB);
  await pool.query('DROP TABLE IF EXISTS eid_leads');
  await migrate(pool);
  const app = createApp({ pool, mailer, config, log: silent });
  await new Promise(r => (server = app.listen(0, '127.0.0.1', r)));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  server.close();
  await pool.end();
});

test('Lead wird gespeichert, normalisiert und bekommt eine Bestätigungsmail', async () => {
  const r = await post('/api/leads', valid());
  assert.equal(r.status, 201);
  const { rows } = await pool.query('SELECT * FROM eid_leads');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, 'erika@example.de');
  assert.equal(rows[0].bereich, 'strom');
  assert.equal(rows[0].rolle, 'erzeuger');
  assert.equal(Number(rows[0].capacity_kwp), 35.5);
  assert.equal(rows[0].marketing_consent_version, 'm1');
  assert.equal(sent.length, 1);
  assert.match(sent[0].link, /^https:\/\/api\.test\/api\/confirm\?token=/);
});

test('Fehlerhafte Eingaben liefern deutsche Feldmeldungen', async () => {
  const r = await post('/api/leads', { interest: 'quatsch', email: 'x', plz: '1', privacy: false });
  assert.equal(r.status, 422);
  const j = await r.json();
  for (const k of ['interest', 'name', 'email', 'plz', 'privacy']) assert.ok(j.errors[k], k);
});

test('Honeypot speichert nichts', async () => {
  const before = (await pool.query('SELECT count(*)::int n FROM eid_leads')).rows[0].n;
  const r = await post('/api/leads', valid({ website: 'http://spam' }));
  assert.equal(r.status, 201);
  assert.equal((await pool.query('SELECT count(*)::int n FROM eid_leads')).rows[0].n, before);
});

test('Bestätigen setzt confirmed_at und leitet auf die Website', async () => {
  const t = new URL(sent[0].link).searchParams.get('token');
  const r = await get(`/api/confirm?token=${t}`);
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('location'), 'https://site.test/bestaetigt.html');
  const { rows } = await pool.query('SELECT confirmed_at FROM eid_leads WHERE confirm_token_hash = $1', [sha(t)]);
  assert.ok(rows[0].confirmed_at);
  const again = await get(`/api/confirm?token=${t}`);
  assert.equal(again.headers.get('location'), 'https://site.test/bestaetigt.html');
  const bad = await get('/api/confirm?token=falsch');
  assert.equal(bad.headers.get('location'), 'https://site.test/link-ungueltig.html');
});

test('Admin-API verlangt Token und filtert', async () => {
  assert.equal((await get('/api/admin/leads')).status, 401);
  assert.equal((await get('/api/admin/leads', { authorization: 'Bearer falsch' })).status, 401);
  await post('/api/leads', valid({ interest: 'kaufen', email: 'kaeufer@example.de', marketing: false }));
  const j = await (await get('/api/admin/leads?bereich=strom', auth)).json();
  assert.equal(j.count, 2);
  const k = await (await get('/api/admin/leads?interest=kaufen', auth)).json();
  assert.equal(k.count, 1);
  assert.equal(k.leads[0].rolle, 'kaeufer');
});

test('CSV-Export schützt vor Formel-Injection', async () => {
  await post('/api/leads', valid({ name: '=HYPERLINK("x")', email: 'csv@example.de' }));
  const r = await get('/api/admin/leads?format=csv', auth);
  const text = await r.text();
  assert.match(r.headers.get('content-type'), /text\/csv/);
  assert.ok(text.includes(`"'=HYPERLINK(""x"")"`));
});

test('Folgeangebote: nur bestätigt, mit Einwilligung, nach Frist, einmalig', async () => {
  // Erika (bestand, bestätigt, Einwilligung) 10 Tage zurückdatieren → speicher (3) und teilen (7) fällig
  await pool.query(`UPDATE eid_leads SET confirmed_at = now() - interval '10 days' WHERE email = 'erika@example.de'`);
  // Käufer ohne Einwilligung bestätigen und zurückdatieren → nichts fällig
  await pool.query(`UPDATE eid_leads SET confirmed_at = now() - interval '60 days' WHERE email = 'kaeufer@example.de'`);
  let j = await (await get('/api/admin/followups', auth)).json();
  const offers = j.followups.filter(f => f.email === 'erika@example.de').map(f => f.offer).sort();
  assert.deepEqual(offers, ['speicher', 'teilen']);
  assert.equal(j.followups.filter(f => f.email === 'kaeufer@example.de').length, 0);
  assert.equal(j.followups[0].link.startsWith('https://site.test/'), true);

  const id = j.followups.find(f => f.offer === 'speicher').leadId;
  assert.equal((await post(`/api/admin/leads/${id}/followups`, { offer: 'speicher' }, auth)).status, 200);
  assert.equal((await post(`/api/admin/leads/${id}/followups`, { offer: 'speicher' }, auth)).status, 409);
  j = await (await get('/api/admin/followups', auth)).json();
  assert.deepEqual(j.followups.filter(f => f.leadId === id).map(f => f.offer), ['teilen']);
});

test('Abmelden stoppt alle Folgeangebote', async () => {
  const unsub = 'abmelde-token';
  await pool.query(`UPDATE eid_leads SET unsubscribe_token_hash = $1 WHERE email = 'erika@example.de'`, [sha(unsub)]);
  const r = await get(`/api/unsubscribe?token=${unsub}`);
  assert.equal(r.headers.get('location'), 'https://site.test/abgemeldet.html');
  const j = await (await get('/api/admin/followups', auth)).json();
  assert.equal(j.followups.filter(f => f.email === 'erika@example.de').length, 0);
});

test('Signierter Abmeldelink aus Folge-E-Mail funktioniert, gefälschter nicht', async () => {
  await post('/api/leads', valid({ interest: 'planen', email: 'plan@example.de' }));
  const { rows } = await pool.query(`UPDATE eid_leads SET confirmed_at = now() - interval '30 days' WHERE email = 'plan@example.de' RETURNING id`);
  const id = rows[0].id;
  let j = await (await get('/api/admin/followups', auth)).json();
  const f = j.followups.find(x => x.leadId === id);
  assert.ok(f.unsubscribeLink.includes(`id=${id}&sig=${sign('geheim', id)}`));
  await get(`/api/unsubscribe?id=${id}&sig=falsch`);
  j = await (await get('/api/admin/followups', auth)).json();
  assert.ok(j.followups.some(x => x.leadId === id));
  await get(new URL(f.unsubscribeLink).pathname + new URL(f.unsubscribeLink).search);
  j = await (await get('/api/admin/followups', auth)).json();
  assert.equal(j.followups.some(x => x.leadId === id), false);
});

test('Status ändern, Statistik, Löschen', async () => {
  const { rows } = await pool.query(`SELECT id FROM eid_leads WHERE email = 'csv@example.de'`);
  const id = rows[0].id;
  const bad = await fetch(`${base}/api/admin/leads/${id}`, { method: 'PATCH', headers: { ...auth, 'content-type': 'application/json' }, body: '{"status":"x"}' });
  assert.equal(bad.status, 422);
  const ok = await fetch(`${base}/api/admin/leads/${id}`, { method: 'PATCH', headers: { ...auth, 'content-type': 'application/json' }, body: '{"status":"abgeschlossen"}' });
  assert.equal(ok.status, 200);
  const s = await (await get('/api/admin/stats', auth)).json();
  assert.ok(s.rows.find(r => r.interest === 'bestand' && r.abgeschlossen === 1));
  const del = await fetch(`${base}/api/admin/leads/${id}`, { method: 'DELETE', headers: auth });
  assert.equal(del.status, 200);
});

test('Unbestätigte Leads werden nach Frist gelöscht', async () => {
  await pool.query(`INSERT INTO eid_leads (interest, bereich, rolle, name, email, postal_code, privacy_consent_version,
    confirm_token_hash, unsubscribe_token_hash, created_at) VALUES ('kaufen','strom','kaeufer','Alt','alt@x.de','01234','p1','a','b', now() - interval '40 days')`);
  assert.equal(await purgeUnconfirmed(pool, 30), 1);
});

test('dueFollowups respektiert Status verloren', () => {
  const lead = { marketing_consent: true, confirmed_at: new Date(Date.now() - 30 * 86400000), interest: 'planen', followups_sent: [], status: 'verloren' };
  assert.deepEqual(dueFollowups(lead), []);
  assert.deepEqual(dueFollowups({ ...lead, status: 'neu' }), ['komponenten', 'speicher', 'schutz']);
});

test('Katalog ist öffentlich abrufbar', async () => {
  const j = await (await get('/api/catalog')).json();
  assert.ok(j.interests.kaufen && j.offers.speicher && j.followups.bestand);
});
