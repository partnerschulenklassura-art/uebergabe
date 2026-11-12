-- Gemeinsame Lead-Datenbank des Energie-Instituts Deutschland. Idempotent, wird beim Start ausgeführt.
CREATE TABLE IF NOT EXISTS eid_leads (
  id                        BIGSERIAL PRIMARY KEY,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  interest                  TEXT NOT NULL,
  bereich                   TEXT NOT NULL,
  rolle                     TEXT NOT NULL,
  name                      TEXT NOT NULL,
  email                     TEXT NOT NULL,
  phone                     TEXT,
  postal_code               TEXT NOT NULL,
  capacity_kwp              NUMERIC(9, 2),
  message                   TEXT,
  privacy_consent_version   TEXT NOT NULL,
  callback_consent          BOOLEAN NOT NULL DEFAULT false,
  callback_consent_version  TEXT,
  marketing_consent         BOOLEAN NOT NULL DEFAULT false,
  marketing_consent_version TEXT,
  confirm_token_hash        TEXT NOT NULL,
  unsubscribe_token_hash    TEXT NOT NULL,
  confirmed_at              TIMESTAMPTZ,
  unsubscribed_at           TIMESTAMPTZ,
  ip_hash                   TEXT,
  source                    TEXT,
  utm                       JSONB,
  status                    TEXT NOT NULL DEFAULT 'neu'
                            CHECK (status IN ('neu', 'kontaktiert', 'qualifiziert', 'abgeschlossen', 'verloren')),
  followups_sent            JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS eid_leads_email_idx ON eid_leads (lower(email));
CREATE INDEX IF NOT EXISTS eid_leads_interest_idx ON eid_leads (interest);
CREATE INDEX IF NOT EXISTS eid_leads_confirmed_idx ON eid_leads (confirmed_at);
