(function () {
  var SCHRITTE = [
    ['angelegt', 'Auftrag angelegt'],
    ['terminiert', 'Termin vereinbart'],
    ['in_pruefung', 'Prüfung vor Ort läuft'],
    ['abgeschlossen', 'Prüfung abgeschlossen, Protokoll fertig']
  ];
  var SCHWERE = { kritisch: 'kritisch', hoch: 'hoch', mittel: 'mittel', niedrig: 'niedrig' };
  var q = new URLSearchParams(location.search);
  var n = q.get('n'), t = q.get('t');
  var kopf = document.getElementById('kopf');
  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
  if (!n || !t) { kopf.textContent = 'Der Link ist unvollständig. Bitte verwenden Sie den Link aus Ihrer Bestätigung.'; kopf.className = 'fehler'; return; }
  fetch('/api/leistungscheck/pruefauftrag/' + encodeURIComponent(n) + '?t=' + encodeURIComponent(t), { headers: { accept: 'application/json' } })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (x) {
      if (!x.ok) throw new Error(x.d.fehler || 'Status nicht abrufbar');
      var d = x.d;
      kopf.textContent = 'Auftrag ' + (d.auftragsnummer || '') + ' · Leistungscheck ' + d.fremdnummer;
      var stufe = d.status === 'neue_fassung' ? 'abgeschlossen' : d.status;
      var idx = SCHRITTE.findIndex(function (s) { return s[0] === stufe; });
      var ol = document.getElementById('schritte');
      SCHRITTE.forEach(function (s, i) {
        var li = el('li', null, i < idx ? 'erledigt' : i === idx ? (stufe === 'abgeschlossen' ? 'erledigt' : 'aktuell') : '');
        li.appendChild(el('span', null, 'punkt'));
        li.appendChild(el('span', s[1]));
        ol.appendChild(li);
      });
      if (d.termin) {
        var tb = document.getElementById('termin');
        tb.hidden = false;
        tb.appendChild(el('strong', 'Termin: '));
        tb.appendChild(document.createTextNode(new Date(d.termin).toLocaleString('de-DE', { dateStyle: 'full', timeStyle: 'short' })));
      }
      if (stufe === 'abgeschlossen') {
        var eb = document.getElementById('ergebnis');
        eb.hidden = false;
        eb.appendChild(el('h2', 'Ergebnis der Prüfung'));
        var befunde = d.befunde || [];
        if (!befunde.length) eb.appendChild(el('p', 'Keine Befunde. Ihre Anlage ist nach dieser Prüfung in Ordnung.'));
        else {
          var tab = el('table'); var kopfz = el('tr');
          ['Befund', 'Schwere', 'Maßnahme'].forEach(function (h) { kopfz.appendChild(el('th', h)); });
          tab.appendChild(kopfz);
          befunde.forEach(function (b) {
            var tr = el('tr');
            tr.appendChild(el('td', b.label + (b.ebene ? ' (' + b.ebene + ')' : '')));
            tr.appendChild(el('td', SCHWERE[b.schwere] || b.schwere || ''));
            tr.appendChild(el('td', b.massnahme || ''));
            tab.appendChild(tr);
          });
          eb.appendChild(tab);
        }
        if (d.verifikationskennung) eb.appendChild(el('p', 'Prüfprotokoll Fassung ' + (d.fassung || 1) + ', Prüfsumme ' + (d.abdruck || '').slice(0, 16) + '…, Kennung ' + d.verifikationskennung + '. Das vollständige Protokoll mit allen Messwerten erhalten Sie von uns als PDF.', 'klein'));
      }
    })
    .catch(function (e) { kopf.textContent = e.message + '. Bitte später erneut versuchen oder schreiben Sie uns.'; kopf.className = 'fehler'; });
})();
