import { TOOLS, toolUrl } from '../site.config.js';

// Bestehende Anwendungen eines Bereichs als Karten mit Status. Nur öffentlich freigegebene werden gezeigt.
export default function Werkzeuge({ bereich, title = 'Unsere Werkzeuge', lead }) {
  const tools = TOOLS.filter(t => t.bereich === bereich && t.public);
  if (!tools.length) return null;
  return (
    <section className="section" id="werkzeuge" aria-labelledby={`wz-${bereich}`}>
      <div className="wrap">
        <h2 id={`wz-${bereich}`}>{title}</h2>
        {lead && <p className="lead narrow">{lead}</p>}
        <ul className="tools">
          {tools.map(t => {
            const href = toolUrl(t, bereich);
            const Inner = (
              <>
                <span className={`tool-status ${t.status === 'live' ? 'is-live' : ''}`}>{t.status}</span>
                <strong>{t.name}</strong>
                <span className="tool-text">{t.text}</span>
                {href && <span className="tool-go">Öffnen</span>}
              </>
            );
            return (
              <li key={t.id} className="reveal-item">
                {href ? (
                  <a href={href} rel="noopener">
                    {Inner}
                  </a>
                ) : (
                  <div>{Inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
