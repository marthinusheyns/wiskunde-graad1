/* Skryf docs/SKILL-MAP.md uit die kode (js/tutor-data.js), sodat 'n onderwyser die vaardigheidskaart,
   die kritieke paaie en die foutekatalogus kan nagaan. Hardloop: node tools/skillmap-doc.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { console, Math, JSON }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['util', 'af', 'visuals', 'gen-number', 'gen-ops', 'gen-measure', 'gen-space', 'gen-money-data', 'curriculum', 'tutor-data', 'tutor-lessons']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx);
}
const W = ctx.W;
const name = (id) => (W.SKILLMAP[id] ? W.SKILLMAP[id].name : id);

// Watter werkblaaie gebruik elke vaardigheid?
const usedBy = {}, genPaths = {};
for (const ws of W.CURRICULUM) for (const [g, p] of ws.ex) {
  const seen = new Set();
  for (let i = 0; i < 30; i++) { const q = W.G[g](p); W.Tutor.path(g, q).forEach((n) => seen.add(n)); }
  if (seen.size) genPaths[g] = genPaths[g] || new Set();
  seen.forEach((n) => { (usedBy[n] = usedBy[n] || new Set()).add(ws.id); genPaths[g].add(n); });
}

let md = `# Vaardigheidskaart en foutekatalogus (vir nagaan deur 'n onderwyser)

Gegenereer uit \`js/tutor-data.js\` met \`node tools/skillmap-doc.js\`. Moet nie met die hand verander nie.
Verander die kode en genereer weer. Sien [TUTOR-DESIGN.md](TUTOR-DESIGN.md) vir die idee.

**Wat om na te gaan:** (1) is die klein vaardighede en hul voorvereistes reg vir Graad 1?
(2) Is die foute werklik algemeen, en is die verduidelikings en wenke in goeie, kindervriendelike Afrikaans?
(3) Ontbreek daar foute wat u gereeld in die klas sien?

## 1. Vaardighede

| Groep | Vaardigheid | Bou op | Werkblaaie |
|---|---|---|---|
`;
for (const g of Object.keys(W.SKILLGROUPS)) {
  for (const id of Object.keys(W.SKILLMAP).filter((k) => W.SKILLMAP[k].g === g)) {
    const s = W.SKILLMAP[id];
    const ws = usedBy[id] ? [...usedBy[id]] : [];
    md += `| ${W.SKILLGROUPS[g]} | **${s.name}** \`${id}\` | ${s.pre.map(name).join(', ') || '–'} | ${ws.length ? ws.slice(0, 12).join(', ') + (ws.length > 12 ? ` … (${ws.length})` : '') : '–'} |\n`;
  }
}

md += `\n## 2. Kritieke pad per vraagtipe\n\nDie vaardighede wat 'n kind nodig het, in volgorde. "Les" beteken Juffrou Padda kan dit wys.\n\n| Vraagtipe | Pad | Les |\n|---|---|---|\n`;
for (const g of Object.keys(genPaths).sort()) {
  md += `| \`${g}\` | ${[...genPaths[g]].map(name).join(' → ')} | ${W.LESSONS[g] ? 'ja' : '–'} |\n`;
}

md += `\n## 3. Bekende foute\n\nVir elke fout: wat dit aandui, wat die kind hoor, hoe Juffrou Padda die les begin, en wat ouers lees.\n`;
for (const id of Object.keys(W.MIS)) {
  const m = W.MIS[id];
  md += `\n### \`${id}\`: ${m.node.map(name).join(' / ')}\n\n` +
    `- **Ouer:** ${m.parent}\n- **Kind (wenk):** ${m.child}\n- **Juffrou Padda:** ${m.tutor}\n- **Tuis:** ${m.home}\n`;
}

fs.writeFileSync(path.join(ROOT, 'docs', 'SKILL-MAP.md'), md);
console.log('docs/SKILL-MAP.md geskryf:', Object.keys(W.SKILLMAP).length, 'vaardighede,', Object.keys(W.MIS).length, 'foute,', Object.keys(genPaths).length, 'vraagtipes');
