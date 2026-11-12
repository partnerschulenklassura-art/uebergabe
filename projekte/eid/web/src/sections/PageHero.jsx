// Kopf jeder Unterseite: dunkles Band mit Titel, Einleitung und Sprungmarken. Ohne WebGL, damit Unterseiten schnell laden.
export default function PageHero({ kicker, title, lead, children }) {
  return (
    <section className="page-hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="wrap page-hero-inner">
        <p className="page-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="hero-lead">{lead}</p>
        {children && <div className="actions">{children}</div>}
      </div>
    </section>
  );
}
