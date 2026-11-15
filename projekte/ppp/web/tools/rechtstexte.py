# Erzeugt die Rechtsseiten in public/ aus einer Quelle. Aufruf: python3 tools/rechtstexte.py
# Stand und Anbieter stehen oben; Inhalte sind Entwürfe ohne Rechtsberatung.
import pathlib, html
STAND = '9. November 2026'
ANBIETER = 'André Häupl, Einzelunternehmen, handelnd unter „PV Performance Pro – Energie-Netzwerk“ und „SolarSecure“, Steinpöhlstraße 1, 08412 Werdau, E-Mail info@photovoltaikperformancepro.com, Telefon +49 3761 1874966'
CSS = ('body{margin:0;background:#0e1620;color:#e9ece6;font:400 1.08rem/1.65 system-ui,sans-serif}'
       'main{max-width:72ch;margin:0 auto;padding:3rem 1.5rem 5rem}h1{font-size:2.5rem;line-height:1.05;margin:1rem 0 .5rem}'
       'h2{font-size:1.3rem;margin:2.2rem 0 .6rem;color:#fff}p,li{color:#cfd5da}a{color:#f2b705}.stand{color:#8e99a3;margin:0 0 2rem}'
       'ol{padding-left:1.3rem}li{margin:.35rem 0}.box{border:1px solid rgba(247,247,244,.15);border-radius:14px;padding:1rem 1.2rem;background:rgba(255,255,255,.04)}'
       'nav.legal{display:flex;flex-wrap:wrap;gap:.4rem 1.2rem;margin-top:3rem;font-size:.95rem}')
LINKS = [('/impressum.html','Impressum'),('/datenschutz.html','Datenschutz'),('/agb.html','AGB'),('/softwarebedingungen.html','Softwarebedingungen'),('/partnerbedingungen.html','Partnerbedingungen')]

def page(slug, title, intro, sections, noindex=False):
    body = ''.join(f'<h2>{html.escape(h)}</h2>' + ''.join(
        (f'<ol>{"".join(f"<li>{x}</li>" for x in p)}</ol>' if isinstance(p, list) else f'<p>{p}</p>') for p in ps)
        for h, ps in sections)
    nav = ''.join(f'<a href="{u}">{t}</a>' for u, t in LINKS if not u.endswith(slug))
    robots = '<meta name="robots" content="noindex">' if noindex else ''
    out = (f'<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{robots}'
           f'<title>{html.escape(title)} – PV Performance Pro</title><link rel="icon" href="/favicon.svg"><style>{CSS}</style></head>'
           f'<body><main><a href="/">Zurück zur Startseite</a><h1>{html.escape(title)}</h1><p class="stand">Stand {STAND}</p>'
           f'<div class="box"><p style="margin:0">{intro}</p></div>{body}<nav class="legal">{nav}</nav></main></body></html>')
    pathlib.Path(__file__).resolve().parent.parent.joinpath('public', slug).write_text(out, encoding='utf-8')

# ---------- AGB für Vermittlung und Werkzeuge ----------
page('agb.html', 'Allgemeine Geschäftsbedingungen',
 'Kurz gesagt: Wir vermitteln. Wir liefern keinen Strom und verkaufen nichts im eigenen Namen. Ihr Vertrag über Strom, Komponenten, Montage, Speicher, Prüfung oder Vermarktung kommt immer mit dem jeweiligen Partner zustande. Die Vermittlung ist für Sie kostenlos.',
 [('§ 1 Anbieter und Geltung', [f'Anbieter ist {ANBIETER} („wir“).',
   'Diese Bedingungen gelten für die Nutzung der Website photovoltaikperformancepro.com, der Warteliste, unserer kostenlosen Werkzeuge und für unsere Vermittlung. Für SolarSecure und andere Software-Dienste für Unternehmen gelten zusätzlich unsere <a href="/softwarebedingungen.html">Softwarebedingungen</a>.']),
  ('§ 2 Was wir leisten', [[
   'Wir bringen Sie mit passenden Partnern zusammen: Fachbetrieben für Komponenten, Montage, Speicher, Prüfung und Wartung, Direktvermarktern sowie Anlagenbetreibern und Abnehmern einer Stromgemeinschaft nach § 42c EnWG.',
   'Wir informieren über Gesetze, Fristen und Rechenbeispiele. Diese Informationen sind allgemein und ersetzen keine Rechts-, Steuer-, Energie- oder Anlageberatung.',
   'Wir liefern keinen Strom, kaufen keinen Strom an und verkaufen keine Waren im eigenen Namen.',
   'Leistungen, die wir selbst gegen Entgelt erbringen, etwa als Dienstleister eines Anlagenbetreibers beim Energy Sharing, vereinbaren wir gesondert in Textform mit Preis und Leistungsbeschreibung.']]),
  ('§ 3 Anfrage und Vertragsschluss', [[
   'Ein Eintrag in die Warteliste und jede Anfrage über die Website sind unverbindlich und kostenlos. Sie begründen keinen Vertrag über eine Leistung.',
   'Verträge über die vermittelten Leistungen schließen Sie ausschließlich mit dem Partner. Es gelten dessen Bedingungen, Preise, Gewährleistung und Widerrufsbelehrung. Der Partner nennt Ihnen diese vor Vertragsschluss.',
   'Wir sind nicht berechtigt, für den Partner Erklärungen abzugeben oder entgegenzunehmen, sofern wir nicht ausdrücklich etwas anderes mitteilen.']]),
  ('§ 4 Vergütung und Provision', ['Die Vermittlung ist für Sie kostenlos. Für eine erfolgreiche Vermittlung erhalten wir vom Partner eine Provision. Auf Nachfrage nennen wir Ihnen deren Höhe für Ihren Fall. Wir empfehlen Partner nach Eignung für Ihre Anlage, Region und Verfügbarkeit.']),
  ('§ 5 Weitergabe Ihrer Angaben', ['Ihre Angaben geben wir an einen Partner nur weiter, wenn Sie dem zugestimmt haben, und nur so weit, wie es für Ihre Anfrage nötig ist. Einzelheiten stehen in der <a href="/datenschutz.html">Datenschutzerklärung</a>.']),
  ('§ 6 Kostenlose Werkzeuge', ['Rechner, Solar-Check und ähnliche Werkzeuge liefern Schätzwerte auf Grundlage Ihrer Eingaben und allgemeiner Annahmen, etwa zu Wetter, Börsenpreisen und Verbrauch. Sie ersetzen keine Planung durch eine Fachkraft. Wir übernehmen keine Gewähr dafür, dass die tatsächlichen Werte den Schätzungen entsprechen.']),
  ('§ 7 Haftung', [[
   'Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit und nach dem Produkthaftungsgesetz.',
   'Bei leichter Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen Pflicht, deren Erfüllung die Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung Sie regelmäßig vertrauen dürfen, und nur für den vorhersehbaren, typischen Schaden.',
   'Partner erbringen ihre Leistungen selbstständig und in eigener Verantwortung. Für deren Leistung haften wir nicht. Unsere Pflicht beschränkt sich auf die sorgfältige Auswahl und Vermittlung.']]),
  ('§ 8 Widerrufsrecht', ['Die Vermittlung ist unentgeltlich und begründet keinen Fernabsatzvertrag über eine Leistung. Schließen Sie mit uns als Verbraucher einen entgeltlichen Vertrag über Fernkommunikationsmittel, erhalten Sie die Widerrufsbelehrung mit dem Angebot. Wird ein solcher Vertrag über unsere Website geschlossen, stellen wir dort eine Widerrufsfunktion nach § 356a BGB bereit.']),
  ('§ 9 Streitbeilegung', ['Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.']),
  ('§ 10 Schlussbestimmungen', [[
   'Es gilt deutsches Recht. Für Verbraucher gilt dies nur, soweit ihnen nicht zwingende Vorschriften des Staates ihres gewöhnlichen Aufenthalts weitergehenden Schutz geben.',
   'Sind Sie Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand Zwickau.',
   'Sollte eine Bestimmung unwirksam sein, bleiben die übrigen wirksam.']])])

# ---------- Softwarebedingungen (nur Unternehmer) ----------
page('softwarebedingungen.html', 'Softwarebedingungen für Unternehmen',
 'Diese Bedingungen gelten für SolarSecure und unsere anderen Software-Dienste, die wir Unternehmen anbieten. Sie gelten nicht für Verbraucher. Hardware und Montage vermitteln wir an Partner; die Software, ihren Betrieb auf unseren Servern, Updates und die Koordination von Einführung und Anbindung leisten wir selbst.',
 [('§ 1 Anbieter, Geltung, Kunden', [[
   f'Anbieter ist {ANBIETER} („wir“).',
   'Unsere Software-Dienste richten sich ausschließlich an Unternehmer im Sinne von § 14 BGB, juristische Personen des öffentlichen Rechts und öffentlich-rechtliche Sondervermögen („Kunde“). Mit der Bestellung bestätigt der Kunde, in Ausübung seiner gewerblichen oder selbstständigen beruflichen Tätigkeit zu handeln.',
   'Abweichende Bedingungen des Kunden gelten nur, wenn wir ihnen in Textform zustimmen.',
   'Für einzelne Dienste mit eigenen Nutzungsbedingungen, etwa die App PV-Monteur, gehen diese vor.']]),
  ('§ 2 Leistungen', [[
   'Art und Umfang der Leistung ergeben sich aus dem Angebot und der Leistungsbeschreibung. Dazu können gehören: Bereitstellung der Software als Dienst, Betrieb auf unseren oder von uns beauftragten Servern, Updates, Überwachung und Alarmierung, Koordination der Einführung und Anbindung an die Anlagen des Kunden.',
   'Hardware, Montage und Arbeiten an elektrischen Anlagen erbringen Partner im eigenen Namen, sofern im Angebot nichts anderes steht.',
   'Die Software unterstützt den Kunden beim Schutz seiner Anlagen. Eine vollständige Erkennung oder Abwehr aller Angriffe, Störungen oder Schäden ist technisch nicht möglich und nicht geschuldet. Die Verantwortung für Betrieb und Sicherheit der Anlage bleibt beim Kunden.',
   'Funktionen zur Erkennung von Drohnen arbeiten passiv. Wir greifen nicht in fremde Flüge oder Funkverbindungen ein. Erkenntnisse geben wir nur im vereinbarten Rahmen an den Kunden und auf Anweisung oder gesetzlicher Grundlage an Behörden weiter.']]),
  ('§ 3 Verfügbarkeit und Updates', [[
   'Wir halten die Dienste mit der im Angebot vereinbarten Verfügbarkeit bereit. Ist nichts vereinbart, bemühen wir uns um eine Verfügbarkeit von 98 % im Monatsmittel; angekündigte Wartungsfenster und Störungen außerhalb unseres Einflussbereichs bleiben außer Betracht.',
   'Wir entwickeln die Software weiter und spielen Updates ein. Wesentliche Funktionen schränken wir dabei nicht ohne Zustimmung des Kunden ein.']]),
  ('§ 4 Pflichten des Kunden', [[
   'Der Kunde wirkt bei Einführung und Anbindung mit, gewährt den nötigen Zugang zu Netzwerk und Anlage und benennt einen Ansprechpartner.',
   'Er hält Zugangsdaten geheim und informiert uns unverzüglich über Missbrauch oder Sicherheitsvorfälle.',
   'Er stellt sicher, dass er zur Anbindung der Anlagen berechtigt ist und alle für seinen Betrieb nötigen Genehmigungen hat.']]),
  ('§ 5 Vergütung, Laufzeit, Kündigung', [[
   'Preise, Abrechnungszeitraum und Laufzeit ergeben sich aus dem Angebot. Alle Preise verstehen sich zuzüglich der gesetzlichen Umsatzsteuer.',
   'Ist nichts vereinbart, läuft der Vertrag zwölf Monate und verlängert sich jeweils um zwölf Monate, wenn er nicht mit einer Frist von drei Monaten zum Laufzeitende in Textform gekündigt wird.',
   'Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Nach Vertragsende geben wir die Daten des Kunden auf Wunsch in einem gängigen Format heraus und löschen sie danach.']]),
  ('§ 6 Mängel', ['Wir beheben Mängel der Software in angemessener Frist. Der Kunde meldet Mängel in Textform mit einer nachvollziehbaren Beschreibung. Eine verschuldensunabhängige Haftung für bei Vertragsschluss vorhandene Mängel ist ausgeschlossen.']),
  ('§ 7 Haftung', [[
   'Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit und nach dem Produkthaftungsgesetz.',
   'Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vertragstypischen, vorhersehbaren Schaden, höchstens auf die Vergütung der letzten zwölf Monate.',
   'Für Ertragsausfälle, entgangenen Gewinn und Schäden durch Angriffe Dritter haften wir nur nach Satz 1.']]),
  ('§ 8 Datenschutz und Vertraulichkeit', [[
   'Soweit wir personenbezogene Daten im Auftrag des Kunden verarbeiten, schließen wir einen Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO.',
   'Beide Seiten behandeln vertrauliche Informationen der anderen Seite, insbesondere Sicherheits- und Anlagendaten, vertraulich, auch über das Vertragsende hinaus.']]),
  ('§ 9 Schlussbestimmungen', ['Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist Zwickau. Sollte eine Bestimmung unwirksam sein, bleiben die übrigen wirksam.'])])

# ---------- Partnerbedingungen ----------
page('partnerbedingungen.html', 'Partnerbedingungen',
 'Für Fachbetriebe, Direktvermarkter, Speicher- und Software-Partner, an die wir Kunden vermitteln. Die Höhe der Provision und Ihr Leistungsgebiet halten wir in einer kurzen Partnervereinbarung fest; diese Bedingungen regeln alles Übrige.',
 [('§ 1 Parteien und Gegenstand', [[
   f'Vermittler ist {ANBIETER} („wir“). Partner ist das Unternehmen, das mit uns eine Partnervereinbarung schließt.',
   'Wir vermitteln Anfragen von Kunden aus unserer Website, Warteliste und Werbung an Partner, deren Leistungen zur Anfrage passen. Ein Anspruch des Partners auf eine bestimmte Zahl von Anfragen besteht nicht. Wir sind nicht ausschließlich für einen Partner tätig.',
   'Wir sind kein Handelsvertreter des Partners und nicht befugt, für ihn Verträge zu schließen.']]),
  ('§ 2 Weitergabe von Kundendaten', [[
   'Wir geben Kundendaten nur weiter, wenn der Kunde dem zugestimmt hat. Der Partner nutzt die Daten ausschließlich für die Bearbeitung dieser Anfrage und ist für seine eigene Verarbeitung selbst verantwortlich.',
   'Werbung an vermittelte Kunden per E-Mail, Telefon oder Nachricht ist nur mit deren eigener Einwilligung gegenüber dem Partner zulässig (§ 7 UWG).']]),
  ('§ 3 Pflichten des Partners', [[
   'Der Partner meldet sich bei vermittelten Kunden innerhalb von zwei Werktagen und teilt uns mit, ob ein Angebot abgegeben und ob ein Vertrag geschlossen wurde.',
   'Er erbringt seine Leistungen im eigenen Namen, auf eigene Rechnung und in eigener Verantwortung, nach den anerkannten Regeln der Technik, mit eigener Gewährleistung und eigenen Vertragsbedingungen.',
   'Elektrofachbetriebe sind im Installateurverzeichnis eines Netzbetreibers eingetragen. Jeder Partner unterhält eine Betriebshaftpflichtversicherung in angemessener Höhe und weist sie auf Verlangen nach.',
   'Er nennt dem Kunden vor Vertragsschluss klar, dass er und nicht wir Vertragspartner ist.']]),
  ('§ 4 Provision', [[
   'Für jeden Vertrag, den der Partner mit einem von uns vermittelten Kunden schließt, erhalten wir die in der Partnervereinbarung festgelegte Provision. Das gilt auch für Folgeaufträge desselben Kunden innerhalb von zwölf Monaten nach der Vermittlung.',
   'Die Provision wird fällig, sobald der Kunde an den Partner gezahlt hat, bei Teilzahlungen anteilig. Der Partner rechnet monatlich ab und gibt uns auf Verlangen Auskunft über die mit vermittelten Kunden geschlossenen Verträge und Zahlungseingänge.',
   'Alle Beträge verstehen sich zuzüglich gesetzlicher Umsatzsteuer, soweit diese anfällt.',
   'Tritt ein Kunde vor Zahlung wirksam zurück oder widerruft er, entfällt die Provision.']]),
  ('§ 5 Qualität und Beschwerden', ['Wir dürfen Kunden nach ihrer Zufriedenheit fragen. Bei wiederholten berechtigten Beschwerden, verspäteter Rückmeldung oder unlauterer Werbung können wir die Vermittlung an den Partner aussetzen oder die Partnerschaft beenden.']),
  ('§ 6 Nennung und Marken', ['Wir dürfen den Partner mit Namen, Logo und Leistungsgebiet auf unserer Website als Partner nennen. Der Partner darf auf die Partnerschaft hinweisen, aber nicht den Eindruck erwecken, wir seien sein Vertreter oder garantierten seine Leistung.']),
  ('§ 7 Haftung', ['Jede Seite haftet für ihre eigene Leistung. Der Partner stellt uns von Ansprüchen Dritter frei, die auf seinen Leistungen oder seinem Verhalten gegenüber Kunden beruhen. Im Übrigen haften wir nur bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.']),
  ('§ 8 Laufzeit und Kündigung', ['Die Partnerschaft läuft auf unbestimmte Zeit und kann von beiden Seiten mit einer Frist von einem Monat zum Monatsende in Textform gekündigt werden. Provisionen für vor dem Ende vermittelte Kunden bleiben nach § 4 bestehen.']),
  ('§ 9 Schlussbestimmungen', ['Es gilt deutsches Recht. Gerichtsstand ist Zwickau. Änderungen dieser Bedingungen teilen wir mindestens sechs Wochen vorher in Textform mit; der Partner kann bis zum Wirksamwerden kündigen.'])])
print('ok')
