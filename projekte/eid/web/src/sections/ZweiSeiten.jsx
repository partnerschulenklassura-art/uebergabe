import { euro, money } from '../lib/money.js';

const end = money(22);
const spar = Math.round((1 - end.buyerFlex / end.buyerFix) * 100);
const faktor = (end.sellerStore / end.sellerPlain).toLocaleString('de-DE', { maximumFractionDigits: 1 });

export default function ZweiSeiten({ onWant }) {
  return (
    <section className="section section-paper" id="angebot" aria-labelledby="angebot-h">
      <div className="wrap">
        <h2 id="angebot-h">Zwei Seiten, ein Geschäft</h2>
        <p className="lead narrow">
          Was der eine mittags zu viel hat, braucht der andere abends. Wir bringen beide zusammen, damit der Käufer weniger
          zahlt und der Erzeuger mehr bekommt.
        </p>

        <div className="sides">
          <article className="side reveal-item">
            <p className="side-who">Sie kaufen Strom</p>
            <h3>Weniger zahlen, ohne weniger zu verbrauchen</h3>
            <p className="side-fig">
              <strong>−{spar} %</strong> Stromkosten im Rechenbeispiel ({euro(end.buyerFlex)} statt {euro(end.buyerFix)} bis 22 Uhr)
            </p>
            <ul>
              <li>
                <strong>Strom aus der Nachbarschaft.</strong> Seit 1. Juni 2026 dürfen Anlagen im selben Netzgebiet Strom
                mit Ihnen teilen (§ 42c EnWG). Wir bauen die Stromgemeinschaft auf und übernehmen die Abrechnung.
              </li>
              <li>
                <strong>Dynamischer Tarif.</strong> Jeder Stromlieferant muss einen anbieten. Wir zeigen, welche Geräte Sie in
                die günstigen Stunden legen: E-Auto, Wärmepumpe, Spülmaschine.
              </li>
              <li>
                <strong>Ehrlich gesagt:</strong> Netzentgelte, Steuern und Umlagen zahlen Sie auch für Strom aus der
                Nachbarschaft. Sparen lässt sich am Energieanteil und an der Uhrzeit. Voraussetzung ist ein intelligentes
                Messsystem.
              </li>
            </ul>
            <a className="btn btn-ink" href="#warteliste" onClick={onWant('kaufen')}>
              Als Stromkäufer eintragen
            </a>
          </article>

          <article className="side side-dark reveal-item">
            <p className="side-who">Sie haben eine PV-Anlage</p>
            <h3>Mehr bekommen für denselben Strom</h3>
            <p className="side-fig">
              <strong>{faktor}×</strong> Tageserlös im Rechenbeispiel ({euro(end.sellerStore)} statt {euro(end.sellerPlain)})
            </p>
            <ul>
              <li>
                <strong>Speicher nachrüsten.</strong> Mittagsstrom zurücklegen und abends verkaufen. Seit der
                MiSpeL-Festlegung vom 1. Oktober 2026 darf ein Speicher auch Netzstrom aufnehmen, ohne dass der grüne Anteil
                die EEG-Förderung verliert.
              </li>
              <li>
                <strong>Besser vermarkten.</strong> Wir bündeln Anlagen für bessere Konditionen beim Direktvermarkter und
                regeln bei negativen Preisen sauber ab.
              </li>
              <li>
                <strong>An Nachbarn verkaufen.</strong> Für nicht gewerblich betriebene Anlagen über die Stromgemeinschaft,
                für Gewerbe über einen Liefervertrag.
              </li>
            </ul>
            <a className="btn btn-sun" href="#warteliste" onClick={onWant('bestand')}>
              Als Anlagenbesitzer eintragen
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
