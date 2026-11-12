'use strict';
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validateLead } = require('./validate');
const { INTERESTS, OFFERS, FOLLOWUPS } = require('./catalog');

const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const token = () => crypto.randomBytes(24).toString('base64url');
const sign = (secret, id) => crypto.createHmac('sha256', secret).update(`unsub:${id}`).digest('base64url').slice(0, 32);

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function csvCell(v) {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // Formel-Injection in Excel verhindern
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Welche Folgeangebote sind für diesen Lead fällig? */
function dueFollowups(lead, now = new Date()) {
  if (!lead.marketing_consent || !lead.confirmed_at || lead.unsubscribed_at || lead.status === 'verloren') return [];
  const sent = new Set((lead.followups_sent || []).map(f => f.offer));
  const ageDays = (now - new Date(lead.confirmed_at)) / 86400000;
  return (FOLLOWUPS[lead.interest] || [])
    .filter(([offer, days]) => ageDays >= days && !sent.has(offer) && offer !== lead.interest)
    .map(([offer]) => offer);
}

function createApp({ pool, mailer, config, log = console }) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false })); // reine JSON-API, CSP setzt die Website
  app.use(express.json({ limit: '20kb' }));

  const page = p => `${config.siteUrl}${p}`;

  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  // Katalog für Formulare und n8n
  app.get('/api/catalog', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300').json({ interests: INTERESTS, offers: OFFERS, followups: FOLLOWUPS });
  });

  const leadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { ok: false, message: 'Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es in 15 Minuten erneut.' }
  });

  app.post('/api/leads', leadLimiter, async (req, res) => {
    const body = req.body || {};
    if (typeof body.website === 'string' && body.website.trim() !== '') return res.status(201).json({ ok: true }); // Honeypot

    const { lead, errors } = validateLead(body);
    if (errors) return res.status(422).json({ ok: false, errors });

    const confirm = token();
    const unsub = token();
    const ip = req.ip || '';
    try {
      await pool.query(
        `INSERT INTO eid_leads (interest, bereich, rolle, name, email, phone, postal_code, capacity_kwp, message,
           privacy_consent_version, callback_consent, callback_consent_version,
           marketing_consent, marketing_consent_version, confirm_token_hash, unsubscribe_token_hash, ip_hash, source, utm)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [
          lead.interest, lead.bereich, lead.rolle, lead.name, lead.email, lead.phone, lead.postalCode, lead.capacityKwp,
          lead.message, config.consent.privacy, lead.callbackConsent,
          lead.callbackConsent ? config.consent.callback : null,
          lead.marketingConsent, lead.marketingConsent ? config.consent.marketing : null,
          sha256(confirm), sha256(unsub), ip ? sha256(config.ipSalt + ip) : null, lead.source, lead.utm
        ]
      );
    } catch (e) {
      log.error('lead insert failed', e.message);
      return res.status(500).json({ ok: false, message: 'Speichern hat nicht geklappt. Bitte versuchen Sie es gleich noch einmal.' });
    }

    try {
      await mailer.sendConfirmation({
        to: lead.email,
        name: lead.name,
        interestLabel: INTERESTS[lead.interest].label,
        link: `${config.publicUrl}/api/confirm?token=${confirm}`,
        unsubscribeLink: `${config.publicUrl}/api/unsubscribe?token=${unsub}`
      });
    } catch (e) {
      log.error('confirmation mail failed', e.message); // unbestätigte Leads werden automatisch gelöscht
    }
    return res.status(201).json({ ok: true });
  });

  app.get('/api/confirm', async (req, res) => {
    const t = typeof req.query.token === 'string' ? req.query.token : '';
    if (!t || t.length > 100) return res.redirect(303, page('/link-ungueltig.html'));
    const { rowCount } = await pool.query(
      `UPDATE eid_leads SET confirmed_at = now()
        WHERE confirm_token_hash = $1 AND confirmed_at IS NULL
          AND created_at > now() - ($2 || ' days')::interval`,
      [sha256(t), String(config.unconfirmedRetentionDays)]
    );
    if (rowCount) return res.redirect(303, page('/bestaetigt.html'));
    const { rowCount: done } = await pool.query(
      'SELECT 1 FROM eid_leads WHERE confirm_token_hash = $1 AND confirmed_at IS NOT NULL',
      [sha256(t)]
    );
    return res.redirect(303, page(done ? '/bestaetigt.html' : '/link-ungueltig.html'));
  });

  // Abmelden von Folgeangeboten (Link in jeder E-Mail)
  // Zwei Wege: Token aus der Bestätigungsmail oder signierter Link (id + sig) aus Folge-E-Mails
  app.get('/api/unsubscribe', async (req, res) => {
    const t = typeof req.query.token === 'string' ? req.query.token : '';
    const id = typeof req.query.id === 'string' && /^\d{1,15}$/.test(req.query.id) ? req.query.id : '';
    const sig = typeof req.query.sig === 'string' ? req.query.sig : '';
    const set = `UPDATE eid_leads SET unsubscribed_at = COALESCE(unsubscribed_at, now()), marketing_consent = false`;
    if (t && t.length <= 100) await pool.query(`${set} WHERE unsubscribe_token_hash = $1`, [sha256(t)]);
    else if (id && sig && safeEqual(sig, sign(config.unsubscribeSecret, id))) await pool.query(`${set} WHERE id = $1`, [id]);
    return res.redirect(303, page('/abgemeldet.html'));
  });

  // Admin-API (Bearer-Token) – für Andre, Astrid und n8n
  const admin = express.Router();
  admin.use((req, res, next) => {
    const h = req.get('authorization') || '';
    const t = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!t || !safeEqual(t, config.adminToken)) return res.status(401).json({ ok: false });
    next();
  });

  admin.get('/leads', async (req, res) => {
    const where = [];
    const params = [];
    const add = (sql, v) => {
      params.push(v);
      where.push(sql.replace('?', `$${params.length}`));
    };
    if (req.query.confirmed === 'true') where.push('confirmed_at IS NOT NULL');
    if (typeof req.query.interest === 'string' && INTERESTS[req.query.interest]) add('interest = ?', req.query.interest);
    if (typeof req.query.bereich === 'string' && /^[a-z]{3,20}$/.test(req.query.bereich)) add('bereich = ?', req.query.bereich);
    if (typeof req.query.status === 'string' && /^[a-z]{3,20}$/.test(req.query.status)) add('status = ?', req.query.status);
    if (req.query.callback === 'true') where.push('callback_consent = true');
    const { rows } = await pool.query(
      `SELECT id, created_at, confirmed_at, interest, bereich, rolle, status, name, email, phone, postal_code,
              capacity_kwp, message, callback_consent, marketing_consent, unsubscribed_at, source, utm, followups_sent
         FROM eid_leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY created_at DESC LIMIT 5000`,
      params
    );
    if (req.query.format === 'csv') {
      const cols = rows.length ? Object.keys(rows[0]) : ['id'];
      const lines = [cols.join(';'), ...rows.map(r => cols.map(c => csvCell(r[c])).join(';'))];
      return res
        .type('text/csv; charset=utf-8')
        .set('Content-Disposition', 'attachment; filename="eid-leads.csv"')
        .send('﻿' + lines.join('\r\n'));
    }
    res.json({ ok: true, count: rows.length, leads: rows });
  });

  // Kennzahlen je Bereich und Interesse
  admin.get('/stats', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT bereich, interest, count(*)::int AS gesamt,
              count(confirmed_at)::int AS bestaetigt,
              count(*) FILTER (WHERE status = 'abgeschlossen')::int AS abgeschlossen
         FROM eid_leads GROUP BY bereich, interest ORDER BY bereich, interest`
    );
    res.json({ ok: true, rows });
  });

  // Fällige Folgeangebote – n8n holt diese Liste, verschickt und meldet zurück
  admin.get('/followups', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, name, email, interest, status, confirmed_at, unsubscribed_at, marketing_consent, followups_sent
         FROM eid_leads
        WHERE marketing_consent = true AND confirmed_at IS NOT NULL AND unsubscribed_at IS NULL AND status <> 'verloren'
        ORDER BY confirmed_at LIMIT 2000`
    );
    const now = new Date();
    const due = [];
    for (const l of rows) {
      for (const offer of dueFollowups(l, now)) {
        due.push({
          leadId: l.id,
          name: l.name,
          email: l.email,
          interest: l.interest,
          offer,
          title: OFFERS[offer].title,
          link: page(OFFERS[offer].path),
          unsubscribeLink: `${config.publicUrl}/api/unsubscribe?id=${l.id}&sig=${sign(config.unsubscribeSecret, l.id)}`
        });
      }
    }
    res.json({ ok: true, count: due.length, followups: due });
  });

  admin.post('/leads/:id/followups', async (req, res) => {
    const offer = req.body && req.body.offer;
    if (!OFFERS[offer]) return res.status(422).json({ ok: false, message: 'Unbekanntes Angebot.' });
    const { rowCount } = await pool.query(
      `UPDATE eid_leads SET followups_sent = followups_sent || jsonb_build_array(jsonb_build_object('offer', $1::text, 'at', now()))
        WHERE id = $2 AND NOT followups_sent @> jsonb_build_array(jsonb_build_object('offer', $1::text))`,
      [offer, req.params.id]
    );
    res.status(rowCount ? 200 : 409).json({ ok: rowCount > 0 });
  });

  admin.patch('/leads/:id', async (req, res) => {
    const allowed = ['neu', 'kontaktiert', 'qualifiziert', 'abgeschlossen', 'verloren'];
    const status = req.body && req.body.status;
    if (!allowed.includes(status)) return res.status(422).json({ ok: false, message: `status muss einer von ${allowed.join(', ')} sein` });
    const { rowCount } = await pool.query('UPDATE eid_leads SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.status(rowCount ? 200 : 404).json({ ok: rowCount > 0 });
  });

  admin.delete('/leads/:id', async (req, res) => {
    const { rowCount } = await pool.query('DELETE FROM eid_leads WHERE id = $1', [req.params.id]);
    res.status(rowCount ? 200 : 404).json({ ok: rowCount > 0 });
  });

  app.use('/api/admin', admin);
  app.use((req, res) => res.status(404).json({ ok: false, message: 'Nicht gefunden' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ ok: false, message: 'Ungültige Anfrage.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ ok: false, message: 'Anfrage zu groß.' });
    log.error(err);
    res.status(500).json({ ok: false, message: 'Interner Fehler.' });
  });
  return app;
}

module.exports = { createApp, dueFollowups, sign };
