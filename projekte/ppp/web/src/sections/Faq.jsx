// Häufige Fragen: kurze, belegbare Antworten. Dient Besuchern und Suchmaschinen/KI-Antwortdiensten (FAQPage-Daten).
const FRAGEN = [
  [
    'Liefert PV Performance Pro selbst Strom?',
    'Nein. Wir vermitteln. Beim Strom aus der Nachbarschaft schließen Sie Ihre Verträge mit dem Anlagenbetreiber, bei der Direktvermarktung mit dem Direktvermarkter. Wir übernehmen Organisation und Abrechnung.'
  ],
  [
    'Was kostet mich die Vermittlung?',
    'Nichts. Die Vermittlung ist für Sie kostenlos und unverbindlich. Wir erhalten vom Partner eine Provision, deren Höhe wir Ihnen auf Nachfrage nennen.'
  ],
  [
    'Was ist Energy Sharing nach § 42c EnWG?',
    'Seit 1. Juni 2026 dürfen private Betreiber von Solaranlagen ihren Strom über das öffentliche Netz mit Abnehmern im selben Netzgebiet teilen. Nötig sind ein Liefervertrag und ein Vertrag zur gemeinsamen Nutzung sowie ein intelligentes Messsystem. Netzentgelte und Umlagen fallen weiter an.'
  ],
  [
    'Lohnt sich ein Speicher für meine Solaranlage?',
    'Ein Speicher verschiebt Mittagsstrom in den Abend, wenn Strom teurer ist. Im Rechenbeispiel einer 30-kWp-Anlage mit 60-kWh-Speicher steigt der Börsenerlös an einem Sommertag auf gut das Doppelte. Ob es sich bei Ihnen rechnet, hängt von Anlage, Verbrauch und Vermarktung ab.'
  ],
  [
    'Was ändert sich 2027 für neue Solaranlagen?',
    'Laut Regierungsentwurf der EEG-Novelle soll die feste Einspeisevergütung für neue kleine Anlagen entfallen. Dann wird die Direktvermarktung der Regelfall. Das Gesetzgebungsverfahren läuft noch.'
  ],
  [
    'Wer ist mein Vertragspartner bei Komponenten, Montage und Prüfung?',
    'Immer der jeweilige Fachbetrieb aus Ihrer Region. Er erbringt die Leistung in eigener Verantwortung, mit eigener Gewährleistung.'
  ]
];

export default function Faq() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FRAGEN.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  };
  return (
    <section className="relative overflow-hidden bg-tinte py-24 text-papier sm:py-28" id="fragen" aria-labelledby="fragen-h">
      <div className="wrap relative grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <h2 id="fragen-h" className="m-0 font-display text-[clamp(2.4rem,5.4vw,4.4rem)] font-bold leading-[0.98]">
          Häufige Fragen
        </h2>
        <div className="grid gap-3">
          {FRAGEN.map(([q, a]) => (
            <details key={q} className="glass rim group rounded-[20px] px-6 py-5 shadow-[0_24px_48px_-24px_rgba(0,0,0,.7)]">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-display text-[1.35rem] font-semibold leading-snug text-papier marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sonne">
                {q}
                <span aria-hidden="true" className="mt-1 text-sonne transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="m-0 mt-3 text-[1.02rem] leading-relaxed text-papier/75">{a}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </section>
  );
}
