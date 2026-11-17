// Pflichthinweis zur Rolle: PPP vermittelt und ist nicht selbst Verkäufer oder Stromlieferant.
export default function Vermittler({ label = 'Wir vermitteln.', children }) {
  return (
    <div className="bg-nacht py-6 text-papier">
      <p className="wrap m-0 flex max-w-none items-start gap-3 text-[0.98rem] leading-relaxed text-papier/75">
        <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sonne shadow-[0_0_10px_#f2b705]" />
        <span>
          <strong className="font-semibold text-papier">{label}</strong> {children}
        </span>
      </p>
    </div>
  );
}
