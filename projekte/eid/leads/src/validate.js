'use strict';
const { INTERESTS } = require('./catalog');

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const PLZ = /^\d{5}$/;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Prüft die Formulardaten. Gibt { lead } oder { errors } mit deutschen Feldmeldungen zurück. */
function validateLead(body) {
  const errors = {};
  const interest = str(body.interest, 40);
  if (!INTERESTS[interest]) errors.interest = 'Bitte wählen Sie aus, wofür Sie sich eintragen.';

  const name = str(body.name, 120);
  if (name.length < 2) errors.name = 'Bitte geben Sie Ihren Namen an.';

  const email = str(body.email, 254).toLowerCase();
  if (!EMAIL.test(email)) errors.email = 'Bitte prüfen Sie die E-Mail-Adresse.';

  const phone = str(body.phone, 40);
  if (phone && !/^[+\d][\d\s/()-]{5,39}$/.test(phone)) errors.phone = 'Bitte nur Ziffern, Leerzeichen und + / ( ) -.';

  const postalCode = str(body.plz ?? body.postalCode, 5);
  if (!PLZ.test(postalCode)) errors.plz = 'Bitte eine fünfstellige Postleitzahl.';

  let capacityKwp = null;
  const rawKwp = str(String(body.kwp ?? ''), 12).replace(',', '.');
  if (rawKwp) {
    const n = Number(rawKwp);
    if (!Number.isFinite(n) || n <= 0 || n > 100000) errors.kwp = 'Bitte eine Leistung zwischen 0 und 100.000 kWp.';
    else capacityKwp = Math.round(n * 100) / 100;
  }

  const message = str(body.message, 2000) || null;

  if (body.privacy !== true) errors.privacy = 'Ohne Einwilligung können wir Ihre Anfrage nicht speichern.';

  let utm = null;
  if (body.utm && typeof body.utm === 'object' && !Array.isArray(body.utm)) {
    utm = {};
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      if (typeof body.utm[k] === 'string') utm[k] = body.utm[k].slice(0, 100);
    }
  }

  if (Object.keys(errors).length) return { errors };
  return {
    lead: {
      interest,
      bereich: INTERESTS[interest].bereich,
      rolle: INTERESTS[interest].rolle,
      name,
      email,
      phone: phone || null,
      postalCode,
      capacityKwp,
      message,
      callbackConsent: body.callback === true,
      marketingConsent: body.marketing === true,
      source: str(body.source, 60) || null,
      utm
    }
  };
}

module.exports = { validateLead };
