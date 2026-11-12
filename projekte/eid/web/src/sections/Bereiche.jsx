import { PAGES, TOOLS } from '../site.config.js';

// Übersicht auf der Startseite: die sechs Bereiche des Instituts, gruppiert nach Werkzeug und Energie.
const GROUPS = [
  { title: 'Energie und Technik', ids: ['strom', 'speicher', 'komponenten'] },
  { title: 'Werkzeuge und Dienste', ids: ['planen', 'pruefen', 'schutz'] }
];

export default function Bereiche() {
  return (
    <section className="section" id="bereiche" aria-labelledby="bereiche-h">
      <div className="wrap">
        <h2 id="bereiche-h">Alles, was eine Solaranlage im Leben braucht</h2>
        <p className="lead narrow">
          Planen, ausstatten, prüfen, schützen, Strom verkaufen, speichern. Jeder Bereich steht für sich, zusammen
          begleiten sie eine Anlage über ihr ganzes Leben.
        </p>
        {GROUPS.map(g => (
          <div key={g.title} className="area-group">
            <h3 className="area-group-h">{g.title}</h3>
            <ul className="areas">
              {g.ids.map(id => {
                const p = PAGES.find(x => x.id === id);
                return (
                  <li key={id} className="reveal-item">
                    <a href={p.href}>
                      <strong>{p.title}</strong>
                      <span>{p.text}</span>
                      {TOOLS.some(t => t.bereich === id && t.public) && (
                        <em className="area-tools">
                          {TOOLS.filter(t => t.bereich === id && t.public)
                            .map(t => t.name)
                            .join(', ')}
                        </em>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
