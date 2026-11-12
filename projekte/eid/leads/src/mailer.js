'use strict';
const nodemailer = require('nodemailer');

/** Bestätigungsmail (Double-Opt-in). Ohne SMTP wird der Link nur geloggt. */
function createMailer(config, log = console) {
  const transport = config.smtp
    ? nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
      })
    : null;

  return {
    async sendConfirmation({ to, name, interestLabel, link, unsubscribeLink }) {
      const text = [
        `Guten Tag ${name},`,
        '',
        `Sie haben sich beim ${config.brandName} eingetragen: ${interestLabel}.`,
        'Bitte bestätigen Sie Ihre E-Mail-Adresse:',
        link,
        '',
        'Wenn Sie sich nicht eingetragen haben, ignorieren Sie diese E-Mail. Ohne Bestätigung löschen wir Ihre Angaben automatisch.',
        `Keine weiteren Angebote erhalten: ${unsubscribeLink}`,
        '',
        config.brandName,
        config.contactEmail
      ].join('\n');
      if (!transport) {
        log.info(`[mail:dry-run] an ${to}: ${link}`);
        return { dryRun: true };
      }
      await transport.sendMail({
        from: config.smtp.from,
        to,
        subject: `Bitte bestätigen Sie Ihre Anmeldung beim ${config.brandName}`,
        text,
        headers: { 'List-Unsubscribe': `<${unsubscribeLink}>` }
      });
      return { dryRun: false };
    }
  };
}

module.exports = { createMailer };
