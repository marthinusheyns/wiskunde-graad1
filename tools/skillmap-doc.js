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
(3) Ontbreek daar foute wat u gereeld in die klas sien? (4) Watter ander maniere om dit te wys, pas by
hoe u klas dit leer (afdeling 4)?

**Hoe om te antwoord:** met die 💬-knoppie in die app (op 'n vraag self, of Ouerhoek → *Skryf 'n nota*).
Kies *Onderwyser* en tik die verwysing wat u gekry het, sodat ons u notas saam kan lees. Of skryf op 'n
gedrukte kopie van hierdie bladsy.

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

/* Voorstelle vir ander maniere om dieselfde ding te wys (nog nie in die app nie). Die onderwyser kies. */
const METHODS = [
  ['Tel', ['count', 'countInScene', 'matchGroup', 'frame'],
    'Raak aan elkeen en tel een vir een; die laaste getal wat ons sê, is hoeveel daar is. By die tienraam: een ry is 5.', [
      'Skuif elkeen eenkant toe terwyl ons tel, sodat niks twee keer getel word nie.',
      'Herken klein groepies sonder om te tel (dobbelsteen- en vingerpatrone).',
      'Tel aan vanaf 5 of 10 met die tienraam ("5, 6, 7").',
      'Groepeer in vywe of tiene en tel dan die groepe.']],
  ['Optel', ['add', 'add3', 'countOn', 'wordProblem', 'moneySum'],
    'Begin by die groter getal en spring vorentoe op die getallelyn. Stories: teken eers die storie, dan die getallesin.', [
      'Tel alles: maak albei groepe met voorwerpe en tel almal.',
      'Tel aan op die vingers vanaf die groter getal.',
      'Maak eers 10 met die tienraam (as die som oor 10 gaan).',
      'Dubbels en amper-dubbels (6 + 7 = 6 + 6 + 1).',
      'Omruil: 2 + 9 is dieselfde as 9 + 2, so begin by 9.',
      'Breek die tweede getal op: 8 + 5 = 8 + 2 + 3.']],
  ['Aftrek', ['sub', 'countOn', 'wordProblem', 'moneyChange'],
    'Tot 10: vat weg met krale. Bo 10: tel terug op die getallelyn.', [
      'Tel op van die kleiner getal na die groter ("van 5 tot 8 is 3").',
      'Terug deur 10 (13 – 5: eers 3 weg tot by 10, dan nog 2).',
      'Dink aan die optelsom: 8 – 3 = ?, want 3 + 5 = 8.',
      'Vingers: steek soveel vingers op as die eerste getal en vou die weggevatte vingers af.',
      'Vergelyk in pare (vir "hoeveel meer?").']],
  ['Bindings (twee getalle wat saam \'n getal maak)', ['bond', 'pairs'],
    'Krale in twee kleure: sit een vir een by tot by die getal.', [
      'Tienraam met twee kleure.',
      'Die vingers van twee hande.',
      'Getalhuisie of deel-deel-geheel-prentjie.',
      'Omruil-pare: 3 en 7, 7 en 3.',
      'Al die pare in volgorde: 0 en 10, 1 en 9, 2 en 8, …']],
  ['Oor 10 (brug)', ['bridge10'],
    'Tienraam: maak eers 10, dan die res (8 + 5 = 8 + 2 + 3).', [
      'Getallelyn met twee spronge: eers tot by 10, dan verder.',
      'Telraam of krale in tiene.',
      'Amper-dubbels (7 + 8 = 7 + 7 + 1).']],
  ['Dubbels en helftes', ['double', 'nearDouble', 'half'],
    'Skoenlapper met twee gelyke vlerke. Helftes: deel een vir een in twee groepe.', [
      'Spieël: hou \'n spieël langs die voorwerpe.',
      'Dobbelsteen-dubbels (twee dobbelstene met dieselfde getal).',
      'Vingers: dieselfde getal op albei hande.',
      'Helfte as die omgekeerde van dubbel: "watter getal se dubbel is 8?"']],
  ['Groepe, herhaalde optelling en deel', ['groups', 'repeatedAdd', 'share'],
    'Tel in groepe (tweë, vywe, tiene). Deel een vir een uit, een vir elke kind.', [
      'Spronge van dieselfde grootte op die getallelyn.',
      'Rye en kolomme (\'n skikking).',
      'Deel in groepies: hoeveel groepe van 3 pas in 12?',
      'Herhaalde aftrekking vir deel (12 – 3 – 3 – 3 – 3).']],
  ['Getalpatrone, een meer of minder, ontbrekende getalle', ['missing', 'gridPattern', 'hops', 'moreLess'],
    'Loop of spring op die getallelyn.', [
      'Honderdkaart: kyk na die rye en kolomme.',
      'Tel hardop met \'n ritme (klap by elke tweede getal).',
      'Een meer of minder met blokkies of \'n toring.']],
  ['Vergelyk', ['compareGroups', 'compareNumbers'],
    'Groepe: sit hulle in pare. Getalle: kyk waar hulle op die getallelyn lê.', [
      'Tel albei groepe en vergelyk die getalle.',
      'Bou torings: die hoër toring het meer.',
      'Vergelyk eers die tiene, dan die ene.']],
  ['Tiene en ene', ['tenAndMore', 'placeValue', 'frame'],
    'Een vol tienraam is 10, en die ekstra kolle is die ene.', [
      'Bondeltjies van tien stokkies en los stokkies.',
      'Geld: R10 en R1-munte.',
      'Plekwaardekaarte (pylkaarte): 10 en 3 maak 13.']],
  ['Geld', ['moneyTotal', 'moneySum', 'moneyChange'],
    'Begin by die munt met die grootste waarde en tel die waardes aan. Somme met geld: op die getallelyn.', [
      'Maak eers R10 en tel dan verder.',
      'Speelwinkel met regte of papiermunte.',
      'Kleingeld: tel op van die prys tot by wat ons betaal het.']]
];
for (const [, gens] of METHODS) for (const g of gens) if (!W.LESSONS[g]) throw new Error('Geen les vir ' + g);

md += `\n## 4. Ander maniere om dit te wys (u keuse, asseblief)

Nou wys Juffrou Padda elke soort vraag op een manier. Ons wil graag 'n tweede (of derde) manier byvoeg:
as 'n kind dit die eerste keer nie verstaan nie, sien hy dit op 'n ander manier, en nie net weer
dieselfde nie. Die maniere moet ooreenstem met hoe u in die klas leer, anders raak die kind deurmekaar.

**Vir elke groep:** merk die maniere wat u klas gebruik, en nommer hulle in die volgorde waarin u dit
leer (1 = eerste). Skrap wat nie by Graad 1 pas nie, en voeg by wat ontbreek.

**Twee vrae:**

1. Moet die tweede keer wat 'n kind *Wys my hoe* vra, 'n ander manier wys? Of is dit beter om in Graad 1
   by een manier te bly?
2. Mag Juffrou Padda dieselfde metode met 2 of 3 verskillende sinne verduidelik, sodat dit nie
   herhalend klink nie?
`;
for (const [g, gens, now, alt] of METHODS) {
  md += `\n### ${g}\n\nVraagtipes: ${gens.map((x) => '`' + x + '`').join(', ')}\n\n- **Nou in die app:** ${now}\n` +
    alt.map((a) => `- [ ] ${a}`).join('\n') + '\n- [ ] Ander: …\n';
}

fs.writeFileSync(path.join(ROOT, 'docs', 'SKILL-MAP.md'), md);
console.log('docs/SKILL-MAP.md geskryf:', Object.keys(W.SKILLMAP).length, 'vaardighede,', Object.keys(W.MIS).length, 'foute,', Object.keys(genPaths).length, 'vraagtipes');
