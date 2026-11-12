import SpotlightCard from '../components/reactbits/SpotlightCard.jsx';
import { site } from '../site.config.js';

const facts = [
  ['53', 'Messpunkte auf AC, DC, Wechselrichter und Kommunikation'],
  ['32', 'Befunde mit Schwere und Maßnahme, 14 davon Gefahr im Verzug'],
  ['5', 'Normen als Regelwerk: DIN VDE 0100-600, -410, -712, IEC 62446-1, IEC 62548']
];

export default function Pruefen() {
  return (
    <section className="section" id="pruefen" aria-labelledby="pruefen-h">
      <div className="wrap split">
        <div className="split-text">
          <h2 id="pruefen-h">PV-Monteur: Prüfprotokolle nach VDE</h2>
          <p className="lead">
            Geld verdient nur eine Anlage, die sicher läuft. Dafür haben wir PV-Monteur gebaut: eine Web-App für
            Elektrofachbetriebe, die Photovoltaikanlagen prüfen und dokumentieren.
          </p>
          <p>
            Jeder Messwert wird gegen den Sollwert der Norm gestellt: in Ordnung, Befund, Gefahr oder nicht bewertbar, mit
            Grund. Die App trägt nie selbst einen Wert ein. Das Protokoll ist nach Abschluss unveränderlich und trägt eine
            Prüfsumme auf jeder Seite.
          </p>
          <p className="note">
            Die App gibt Anleitung, keine Freigabe. Die verantwortliche Elektrofachkraft entscheidet.
          </p>
        </div>

        <SpotlightCard className="product" theme="dark" spotlightColor="#F2B705" intensity={0.18} borderGlow={0.5}>
          <p className="product-name">PV-Monteur</p>
          <dl className="facts">
            {facts.map(([n, t]) => (
              <div key={n} className="reveal-item">
                <dt>{n}</dt>
                <dd>{t}</dd>
              </div>
            ))}
          </dl>
          <p className="product-price">
            14 Tage mit vollem Umfang testen. Danach 39,90 € im Monat je Betrieb, jeder weitere Sitzplatz 9,90 €, jeweils
            zzgl. USt., monatlich kündbar.
          </p>
          <div className="actions">
            <a className="btn btn-sun" href={site.pvMonteurUrl}>
              PV-Monteur testen
            </a>
            <a className="btn btn-line-light" href={site.pvMonteurAnfrageUrl}>
              Rückruf anfordern
            </a>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
