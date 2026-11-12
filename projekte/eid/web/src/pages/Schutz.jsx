import PageHero from '../sections/PageHero.jsx';
import Werkzeuge from '../sections/Werkzeuge.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import { TOOLS, toolUrl } from '../site.config.js';

const RISIKEN = [
  ['Angriff auf die Steuerung', 'Wechselrichter und Datenlogger hängen am Internet. Ein ungeschützter Zugang reicht, um eine Anlage abzuschalten oder zu manipulieren.'],
  ['Sabotage und Diebstahl', 'Freiflächen und Hallendächer liegen abgelegen. Durchtrennte Zäune und Kabel fallen oft erst auf, wenn der Ertrag fehlt.'],
  ['Drohnen über dem Gelände', 'Aufklärungsflüge gehen Angriffen häufig voraus. Wer sie erkennt und dokumentiert, hat Beweise und Vorlauf.'],
  ['Nachweispflichten', 'Seit 17. März 2026 gilt das KRITIS-Dachgesetz. Betreiber kritischer Anlagen brauchen Risikoanalyse und Resilienzplan.']
];

const solar = TOOLS.find(t => t.id === 'solarsecure');

export default function Schutz() {
  return (
    <>
      <PageHero
        kicker="Schützen mit SolarSecure"
        title="Ausfälle verhindern, Angriffe abwehren"
        lead="SolarSecure schützt Solar- und Energieanlagen gegen Angriffe auf die Steuerung, Sabotage am Zaun und Aufklärung aus der Luft. Für Betreiber von Bestandsanlagen, Netzbetreiber und Anlagen mit KRITIS-Pflichten."
      >
        <a className="btn btn-sun" href="#warteliste">
          Sicherheits-Check anfragen
        </a>
        <a className="btn btn-line-light" href={toolUrl(solar, 'schutz')} rel="noopener">
          Zu SolarSecure
        </a>
      </PageHero>
      <section className="section" aria-labelledby="risk-h">
        <div className="wrap">
          <h2 id="risk-h">Wogegen SolarSecure schützt</h2>
          <ul className="areas areas-static">
            {RISIKEN.map(([t, x]) => (
              <li key={t} className="reveal-item">
                <div>
                  <strong>{t}</strong>
                  <span>{x}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="note">
            Ob Ihre Anlage unter das KRITIS-Dachgesetz fällt, hängt von Sektor und Größe ab. Die meisten Solaranlagen sind
            keine kritischen Anlagen, profitieren aber vom selben Schutz. Wir klären das im Gespräch.
          </p>
        </div>
      </section>
      <Werkzeuge
        bereich="schutz"
        title="SolarSecure im Einsatz"
        lead="Die Lösungen im Detail, mit Spezifikation für Betreiber kritischer Infrastruktur."
      />
      <Warteliste
        options={['schutz']}
        source="schutz"
        title="Sicherheits-Check anfragen"
        lead="Nennen Sie uns Standort und Anlagengröße. Wir melden uns für eine erste Einschätzung, ob Sie Pflichten aus dem KRITIS-Dachgesetz haben und welcher Schutz passt."
      />
    </>
  );
}
