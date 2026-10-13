/* Obslide V29.9 — Slides « Exigences »
 * Source : export RAPPORT (une ligne par exigence retenue dans une évaluation), le même que l'onglet
 * Exigences de l'Observatoire. La base importée est commune à toutes les slides Exigences ; chaque slide
 * garde sa vue, son titre et ses filtres.
 * Règles de calcul (identiques à l'Observatoire) : une évaluation = un dossier ; une exigence n'est comptée
 * qu'une fois par dossier (couple évaluation + exigence) ; la cible est le premier chiffre du code (1 à 4).
 */
(function () {
  'use strict';
  const W = 1600, H = 900, LEFT = 58, RIGHT = 1542, CW = RIGHT - LEFT;
  const TARGETS = {
    '1': {name: 'Éco-conception & management du projet', color: '#7da7d9', ink: '#24527f'},
    '2': {name: 'Le bâtiment dans son environnement', color: '#76b65c', ink: '#2f6b1d'},
    '3': {name: 'Sobriété et efficacité du bâtiment', color: '#ed9a42', ink: '#99520a'},
    '4': {name: 'Usages & qualité de vie', color: '#8f77bd', ink: '#4f3a80'}
  };
  const NO_TARGET = {name: 'Non classée', color: '#a9b8b1', ink: '#4f625a'};
  const NATURE_COLORS = {N: '#0b5a3d', R: '#9dc68d'};
  const VIEWS = [
    ['overview', 'Vue d’ensemble', 'EXIGENCES · VUE D’ENSEMBLE', 'Exigences retenues dans les évaluations du panel'],
    ['top', 'Exigences les plus récurrentes', 'EXIGENCES LES PLUS RÉCURRENTES', 'Part des dossiers ayant retenu chaque exigence'],
    ['targets', 'Exigences par cible', 'EXIGENCES PAR CIBLE', 'Exigences les plus retenues dans chacune des 4 cibles · Neuf / Rénovation'],
    ['evolution', 'Évolution par année', 'ÉVOLUTION DES EXIGENCES', 'Part des dossiers de chaque année ayant retenu l’exigence'],
    ['mentions', 'Mentions & exigences associées', 'MENTIONS & EXIGENCES ASSOCIÉES', 'Exigences retenues par les dossiers visant une mention']
  ];
  const defaults = {
    view: 'overview', title: '', subtitle: '', topN: 10, mentionFocus: '',
    filters: {nature: 'all', referentials: [], yearFrom: '', yearTo: '', mention: '', moa: '', statuses: [], validatedOnly: false}
  };
  let bridge;

  /* ------------------------------------------------------------------ utilitaires */
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const norm = x => String(x ?? '').replace(/^﻿/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’`´]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();
  const fmt = (n, d = 0) => n === null || n === undefined || !Number.isFinite(Number(n)) ? '—' : Number(n).toLocaleString('fr-FR', {maximumFractionDigits: d, minimumFractionDigits: d});
  const pct = (a, b) => b ? 100 * a / b : 0;
  const plural = (n, one, many) => `${fmt(n)} ${n > 1 ? many : one}`;
  const splitMulti = v => String(v ?? '').replace(/<br\s*\/?>/gi, '\n').split(/\n|;|\s*\|\s*/).map(s => s.trim()).filter(s => s && !/^(-|—|aucune?|non renseign[ée]e?s?)$/i.test(s));
  const natureOf = ref => /r[ée]novation/i.test(ref) ? 'R' : (/neuf/i.test(ref) ? 'N' : 'A');
  const NATURE_LABEL = {N: 'Neuf', R: 'Rénovation', A: 'Autre'};
  const CODE_RE = /\b([1-4])\.([0-9A-Z]{1,2})\.([0-9A-Z]{1,2})\b/i;
  const codeOf = v => { const m = String(v || '').match(CODE_RE); return m ? `${m[1]}.${m[2].toUpperCase()}.${m[3].toUpperCase()}` : ''; };
  const labelOf = v => String(v || '').replace(/^\s*[1-4]\.[0-9A-Za-z]{1,2}\.[0-9A-Za-z]{1,2}\s*[-–—:.]?\s*/, '').trim();

  /* ------------------------------------------------------------------ import RAPPORT */
  const COLUMNS = {
    evaluation: ['Évaluation: Code interne', 'Code EVA interne', 'Code évaluation', 'Code d’évaluation', 'Évaluation'],
    operation: ['Évaluation: Opération: Code interne', 'Code opération', 'Opération: Code interne', 'Code interne'],
    requirement: ['Exigence associée: Nom', 'Exigence associée', 'Exigence', 'Exigences', 'Intitulé', 'Intitulé exigence', 'INTITULE SANS REF'],
    code: ['Code d’exigence', "Code d'exigence", 'Code exigence', 'Numéro d’exigence', "Numéro d'exigence"],
    validated: ['Exigence validée', 'Validée'],
    status: ['Évaluation: Statut', 'Statut évaluation', 'Statut'],
    referential: ['Évaluation: Opération: Référentiel: Nom du référentiel', 'Référentiel', 'Nom du référentiel'],
    version: ['Évaluation: Opération: Version du référentiel applicable: Version', 'Version du ref ( date )', 'Version du référentiel', 'Version'],
    moa: ['Évaluation: Opération: Maître d’ouvrage: Nom de la société', "Évaluation: Opération: Maître d'ouvrage: Nom de la société", 'Maître d’ouvrage', "Maître d'ouvrage", 'MOA'],
    mentions: ['Évaluation: Opération: Mentions', 'Mentions', 'Mention'],
    region: ['Évaluation: Opération: Région', 'Région'],
    year: ['Évaluation: Opération: Année', 'Année opération', 'Année'],
    created: ['Évaluation: Date de création', 'Date de création', 'Évaluation: Opération: Date de création']
  };
  function findColumns(headers) {
    const n = headers.map(norm), out = {};
    Object.entries(COLUMNS).forEach(([k, opts]) => { out[k] = n.findIndex(h => h && opts.some(o => norm(o) === h)); });
    if (out.evaluation === out.operation) out.evaluation = -1;
    return out;
  }
  function headerRow(matrix) {
    let best = {index: -1, mapping: {}, score: 0};
    for (let i = 0; i < Math.min(20, matrix.length); i++) {
      const mapping = findColumns(matrix[i] || []);
      const score = Object.values(mapping).filter(v => v >= 0).length + ((mapping.requirement >= 0 || mapping.code >= 0) ? 10 : 0) + ((mapping.evaluation >= 0 || mapping.operation >= 0) ? 10 : 0);
      if (score > best.score) best = {index: i, mapping, score};
    }
    return best;
  }
  function delimiterParse(text, d) {
    const rows = []; let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
      else if (!quoted && ch === d) { row.push(cell); cell = ''; }
      else if (!quoted && (ch === '\n' || ch === '\r')) { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); if (row.some(v => String(v).trim())) rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); if (row.some(v => String(v).trim())) rows.push(row); }
    return rows;
  }
  function textMatrix(raw) {
    const text = String(raw ?? '').replace(/^﻿/, '').trim();
    if (!text) return [];
    const best = ['\t', ';', ','].map(d => { const m = delimiterParse(text, d); return {m, score: headerRow(m).score * 100 + Math.min(40, (m[0] || []).length)}; }).sort((a, b) => b.score - a.score)[0];
    return best.m;
  }
  function yearFrom(value) {
    const s = String(value ?? '').trim();
    if (!s) return 0;
    if (/^\d{5}(\.\d+)?$/.test(s)) { const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400000); return d.getUTCFullYear(); } // numéro de série Excel
    const m = s.match(/(20\d{2}|19\d{2})/) || s.match(/\b\d{1,2}[/.-]\d{1,2}[/.-](\d{2})\b/);
    if (!m) return 0;
    const y = Number(m[1]);
    return y < 100 ? 2000 + y : y;
  }
  // Matrice → base compacte (dictionnaires) : légère à enregistrer et à recharger.
  function buildSource(matrix, name) {
    const h = headerRow(matrix), mp = h.mapping;
    if (h.index < 0 || (mp.requirement < 0 && mp.code < 0)) throw new Error('Colonne d’exigence introuvable. Attendu : « Exigence associée: Nom » ou « Code d’exigence ».');
    if (mp.evaluation < 0 && mp.operation < 0) throw new Error('Colonne d’évaluation introuvable. Attendu : « Évaluation: Code interne » (ou à défaut « Évaluation: Opération: Code interne »).');
    const get = (row, k) => mp[k] >= 0 ? String(row[mp[k]] ?? '').trim() : '';
    const basis = mp.year >= 0 ? 'année de l’opération' : (mp.created >= 0 ? 'année de création de l’évaluation' : 'année de version du référentiel');
    const evals = [], evalIndex = new Map(), reqs = [], reqIndex = new Map(), occ = [], seen = new Set();
    let ignored = 0;
    for (let i = h.index + 1; i < matrix.length; i++) {
      const row = matrix[i] || [];
      const key = get(row, 'evaluation') || get(row, 'operation');
      const reqText = get(row, 'requirement') || get(row, 'code');
      if (!key || !reqText || /^(total|sous-total|total général)$/i.test(key)) { if (row.some(v => String(v ?? '').trim())) ignored++; continue; }
      let e = evalIndex.get(key);
      const ref = get(row, 'referential');
      const year = yearFrom(get(row, 'year')) || yearFrom(get(row, 'created')) || yearFrom(get(row, 'version'));
      if (e === undefined) {
        e = evals.length; evalIndex.set(key, e);
        evals.push([key, ref, year, natureOf(ref), get(row, 'moa'), get(row, 'status'), splitMulti(get(row, 'mentions')).join('|'), get(row, 'region'), get(row, 'operation')]);
      } else {
        const ev = evals[e];   // métadonnées : première valeur non vide
        if (!ev[1] && ref) { ev[1] = ref; ev[3] = natureOf(ref); }
        if (!ev[2] && year) ev[2] = year;
        if (!ev[4]) ev[4] = get(row, 'moa');
        if (!ev[5]) ev[5] = get(row, 'status');
        if (!ev[6]) ev[6] = splitMulti(get(row, 'mentions')).join('|');
        if (!ev[8]) ev[8] = get(row, 'operation');
      }
      const code = codeOf(get(row, 'code')) || codeOf(reqText);
      const rkey = norm(reqText);
      let r = reqIndex.get(rkey);
      if (r === undefined) { r = reqs.length; reqIndex.set(rkey, r); reqs.push([reqText, code, labelOf(reqText) || reqText, code ? code[0] : '']); }
      const pair = e + ':' + r;
      if (seen.has(pair)) continue;          // une exigence n'est comptée qu'une fois par dossier
      seen.add(pair);
      const v = norm(get(row, 'validated'));
      occ.push(e, r, /^(oui|vrai|true|1|yes|validee?)$/.test(v) ? 1 : (/^(non|faux|false|0|no)$/.test(v) ? 0 : 2));
    }
    if (!occ.length) throw new Error('Aucune ligne exploitable : chaque ligne doit porter une évaluation et une exigence.');
    const found = Object.entries(mp).filter(([, v]) => v >= 0).map(([k]) => k);
    return {name: name || 'Tableau collé', importedAt: new Date().toISOString(), basis, columns: found, ignored, evals, reqs, occ};
  }
  async function readFile(file) {
    if (!file || !file.name) throw new Error('Aucun fichier sélectionné.');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'csv', 'tsv', 'txt'].includes(ext)) throw new Error('Format non reconnu. Utilisez .xlsx, .csv ou .tsv (pas .xls).');
    if (file.size > 60 * 1024 * 1024) throw new Error('Fichier trop volumineux (60 Mo maximum).');
    if (ext === 'xlsx') {
      if (!window.OBSNexityXlsx?.open) throw new Error('Lecteur Excel indisponible. Utilisez un CSV.');
      const wb = await window.OBSNexityXlsx.open(file);
      let best = null;
      for (let i = 0; i < wb.sheets.length; i++) {
        const sheet = await wb.readSheet(i), score = headerRow(sheet.matrix).score;
        if (!best || score > best.score) best = {score, matrix: sheet.matrix, name: wb.sheets[i].name};
      }
      if (!best) throw new Error('Le classeur est vide.');
      return buildSource(best.matrix, `${file.name} · feuille ${best.name}`);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let text = new TextDecoder('utf-8').decode(bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xfe) text = new TextDecoder('utf-16le').decode(bytes);
    else if (text.includes('�')) text = new TextDecoder('windows-1252').decode(bytes);
    return buildSource(textMatrix(text), file.name);
  }

  /* ------------------------------------------------------------------ calculs */
  const source = () => bridge?.getSource?.() || null;
  function options(src) {
    const evs = src?.evals || [];
    const uniq = arr => [...new Set(arr.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'fr', {numeric: true}));
    return {
      referentials: uniq(evs.map(e => e[1])),
      years: uniq(evs.map(e => e[2])).map(Number).sort((a, b) => a - b),
      moas: uniq(evs.map(e => e[4])),
      statuses: uniq(evs.map(e => e[5])),
      mentions: uniq(evs.flatMap(e => String(e[6] || '').split('|')))
    };
  }
  function compute(m, src = source()) {
    if (!src) return null;
    const f = Object.assign({}, defaults.filters, m.filters || {});
    const refs = new Set(f.referentials || []), statuses = new Set(f.statuses || []);
    const yFrom = Number(f.yearFrom) || 0, yTo = Number(f.yearTo) || 0;
    // Périmètre transmis par l'Observatoire : dossiers des opérations filtrées (code d'opération de RAPPORT).
    const scope = window.OBSLIDE_LAUNCH_SCOPE, scoped = !!scope?.active?.() && src.evals.some(e => e[8]);
    const keep = src.evals.map(e => {
      if (scoped && !scope.has(e[8])) return false;
      if (f.nature !== 'all' && e[3] !== f.nature) return false;
      if (refs.size && !refs.has(e[1])) return false;
      if (yFrom && (!e[2] || e[2] < yFrom)) return false;
      if (yTo && (!e[2] || e[2] > yTo)) return false;
      if (f.moa && e[4] !== f.moa) return false;
      if (statuses.size && !statuses.has(e[5])) return false;
      if (f.mention && !String(e[6] || '').split('|').includes(f.mention)) return false;
      return true;
    });
    const evalIdx = []; keep.forEach((k, i) => { if (k) evalIdx.push(i); });
    const occ = [];
    for (let i = 0; i < src.occ.length; i += 3) {
      if (!keep[src.occ[i]]) continue;
      if (f.validatedOnly && src.occ[i + 2] !== 1) continue;
      occ.push([src.occ[i], src.occ[i + 1]]);
    }
    const reqCount = new Map(), reqNature = new Map();
    occ.forEach(([e, r]) => {
      reqCount.set(r, (reqCount.get(r) || 0) + 1);
      const n = src.evals[e][3]; const by = reqNature.get(r) || {N: 0, R: 0, A: 0}; by[n]++; reqNature.set(r, by);
    });
    const req = r => ({id: r, name: src.reqs[r][0], code: src.reqs[r][1], label: src.reqs[r][2], target: src.reqs[r][3], count: reqCount.get(r) || 0, nature: reqNature.get(r) || {N: 0, R: 0, A: 0}});
    const ranked = [...reqCount.keys()].map(req).sort((a, b) => b.count - a.count || String(a.code || a.label).localeCompare(String(b.code || b.label), 'fr', {numeric: true}));
    const natureCount = {N: 0, R: 0, A: 0}; evalIdx.forEach(i => natureCount[src.evals[i][3]]++);
    const targetOcc = {'1': 0, '2': 0, '3': 0, '4': 0, '': 0}; occ.forEach(([, r]) => { targetOcc[src.reqs[r][3] || '']++; });
    const years = [...new Set(evalIdx.map(i => src.evals[i][2]).filter(Boolean))].sort((a, b) => a - b);
    return {src, filters: f, dossiers: evalIdx.length, evalIdx, occ, ranked, natureCount, targetOcc, years, distinct: reqCount.size, scoped, scopeIgnored: !!scope?.active?.() && !scoped};
  }
  function scopeText(m, c) {
    const f = c.filters, parts = [plural(c.dossiers, 'dossier', 'dossiers')];
    if (c.scoped) parts.push(`périmètre Observatoire : ${window.OBSLIDE_LAUNCH_SCOPE.summary()}`);
    if (f.nature !== 'all') parts.push(NATURE_LABEL[f.nature]);
    if (f.referentials?.length) parts.push(f.referentials.join(', '));
    if (f.yearFrom || f.yearTo) parts.push(`${f.yearFrom || '…'}–${f.yearTo || '…'}`);
    else if (c.years.length) parts.push(`${c.years[0]}–${c.years[c.years.length - 1]}`);
    if (f.mention) parts.push(`mention ${f.mention}`);
    if (f.moa) parts.push(f.moa);
    if (f.statuses?.length) parts.push(`statut : ${f.statuses.join(', ')}`);
    if (f.validatedOnly) parts.push('exigences validées uniquement');
    const date = c.src.importedAt ? new Date(c.src.importedAt).toLocaleDateString('fr-FR') : '';
    return `Périmètre : ${parts.join(' · ')} · années : ${c.src.basis} · Source : export RAPPORT (${c.src.name}${date ? `, importé le ${date}` : ''})`;
  }

  /* ------------------------------------------------------------------ dessin SVG */
  function text(str, x, y, size, anchor = 'start', color = '#0b2328', weight = 600, extra = '') {
    return `<text x="${x}" y="${y}" font-size="${size}" font-family="Arial,Helvetica,sans-serif" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" ${extra}>${esc(str)}</text>`;
  }
  function box(x, y, w, h, fill, rx = 8, stroke = '') {
    return `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" rx="${rx}" fill="${fill}" ${stroke ? `stroke="${stroke}"` : ''}/>`;
  }
  // Largeur approximative d'un texte Arial ; sert à tronquer proprement avec « … ».
  function fit(str, maxWidth, size, bold = false) {
    const s = String(str ?? ''), k = bold ? 0.6 : 0.54;
    if (s.length * size * k <= maxWidth) return s;
    const n = Math.max(1, Math.floor(maxWidth / (size * k)) - 1);
    return s.slice(0, n).replace(/[\s,;:–—-]+$/, '') + '…';
  }
  const targetOf = t => TARGETS[t] || NO_TARGET;
  function codeChip(x, y, code, t, w = 64, h = 26) {
    const c = targetOf(t);
    return box(x, y, w, h, c.color, 6) + text(code || '—', x + w / 2, y + h / 2 + 5, 14, 'middle', '#ffffff', 800);
  }
  function header(m, view, logo) {
    const meta = VIEWS.find(v => v[0] === view) || VIEWS[0];
    const title = (m.title || '').trim() || meta[2], subtitle = (m.subtitle || '').trim() || meta[3];
    let out = box(0, 0, W, H, '#ffffff', 0);
    if (logo) out += `<image href="${logo}" x="58" y="16" width="112" height="93" preserveAspectRatio="xMidYMid meet"/>`;
    out += box(276, 36, 5, 56, '#07343a', 3);
    out += text(fit(title, 1000, 31, true), 299, 64, 31, 'start', '#0b2328', 900);
    out += text(fit(subtitle, 1000, 18), 299, 89, 18, 'start', '#1c5960', 500);
    out += box(1384, 14, 158, 28, '#06402B', 14) + text('CONFIDENTIEL', 1463, 33, 12, 'middle', '#ffffff', 900, 'letter-spacing="2"');
    return out;
  }
  function footer(m, c) { return text(fit(scopeText(m, c), CW, 13), LEFT, 884, 13, 'start', '#5f736b', 500); }
  function panel(x, y, w, h, kicker, title) {
    let out = box(x, y, w, h, '#f7faf8', 16, '#d6e3de');
    out += text(kicker, x + 24, y + 32, 12, 'start', '#5f7b6f', 800, 'letter-spacing="1.5"');
    if (title) out += text(fit(title, w - 48, 21, true), x + 24, y + 58, 21, 'start', '#06402B', 800);
    return out;
  }
  function emptySvg(m, view, message, detail) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${header(m, view, bridge?.logo)}` +
      box(LEFT, 170, CW, 640, '#f4f8f6', 18, '#d6e3de') + text(message, W / 2, 470, 30, 'middle', '#06402B', 800) +
      text(detail, W / 2, 512, 18, 'middle', '#5f736b', 500) + '</svg>';
  }
  // Ligne « exigence » : pastille de code, intitulé, barre, valeur.
  function reqRow(x, y, w, r, denom, maxShare, opts = {}) {
    const rowH = opts.h || 34, fs = opts.size || 16;
    const share = pct(r.count, denom), barX = x + w * (opts.barStart || 0.56), barW = w * (opts.barWidth || 0.27);
    let out = codeChip(x, y + (rowH - 26) / 2, r.code, r.target);
    out += text(fit(r.label, barX - x - 92, fs), x + 76, y + rowH / 2 + fs * 0.36, fs, 'start', '#0b2328', 600);
    out += box(barX, y + rowH / 2 - 7, barW, 14, '#e4ede9', 7);
    out += box(barX, y + rowH / 2 - 7, barW * (maxShare ? share / maxShare : 0), 14, targetOf(r.target).color, 7);
    out += text(`${fmt(share, share < 10 ? 1 : 0)} %`, barX + barW + 16, y + rowH / 2 + 6, 17, 'start', '#06402B', 800);
    out += text(plural(r.count, 'dossier', 'dossiers'), x + w - 8, y + rowH / 2 + 5, 13, 'end', '#5f736b', 500);
    return out;
  }
  function targetLegend(y) {
    let out = '', x = LEFT;
    ['1', '2', '3', '4'].forEach(t => {
      const label = `Cible ${t} · ${TARGETS[t].name}`;
      out += box(x, y - 12, 14, 14, TARGETS[t].color, 3) + text(label, x + 22, y, 13, 'start', '#33524a', 600);
      x += 30 + label.length * 13 * 0.54;
    });
    return out;
  }

  function overviewSvg(m, c) {
    let out = '';
    const kpis = [
      ['DOSSIERS ANALYSÉS', fmt(c.dossiers), 'évaluations uniques'],
      ['EXIGENCES RETENUES', fmt(c.occ.length), `${plural(c.distinct, 'exigence distincte', 'exigences distinctes')}`],
      ['NEUF', fmt(c.natureCount.N), `${fmt(pct(c.natureCount.N, c.dossiers), 1)} % du panel`],
      ['RÉNOVATION', fmt(c.natureCount.R), `${fmt(pct(c.natureCount.R, c.dossiers), 1)} % du panel`]
    ];
    const kw = (CW - 3 * 18) / 4;
    kpis.forEach((k, i) => {
      const x = LEFT + i * (kw + 18);
      out += box(x, 140, kw, 112, '#f7faf8', 16, '#d6e3de');
      out += text(k[0], x + 22, 170, 13, 'start', '#5f7b6f', 800, 'letter-spacing="1.5"');
      out += text(k[1], x + 22, 216, 42, 'start', '#06402B', 900);
      out += text(k[2], x + 22, 240, 14, 'start', '#33524a', 600);
    });
    // Répartition par cible
    const px = LEFT, py = 272, pw = 560, ph = 588;
    out += panel(px, py, pw, ph, 'RÉPARTITION PAR CIBLE', 'Part des exigences retenues');
    const totalOcc = c.occ.length;
    ['1', '2', '3', '4'].forEach((t, i) => {
      const y = py + 96 + i * 112, share = pct(c.targetOcc[t], totalOcc);
      out += `<circle cx="${px + 46}" cy="${y + 18}" r="20" fill="${TARGETS[t].color}"/>` + text(t, px + 46, y + 25, 20, 'middle', '#ffffff', 900);
      out += text(fit(TARGETS[t].name, pw - 190, 16, true), px + 80, y + 14, 16, 'start', '#0b2328', 700);
      out += text(`${fmt(c.targetOcc[t])} exigences retenues`, px + 80, y + 36, 13, 'start', '#5f736b', 500);
      out += text(`${fmt(share, 1)} %`, px + pw - 24, y + 22, 24, 'end', TARGETS[t].ink, 900);
      out += box(px + 80, y + 52, pw - 104, 12, '#e4ede9', 6) + box(px + 80, y + 52, (pw - 104) * share / 100, 12, TARGETS[t].color, 6);
    });
    if (c.targetOcc['']) out += text(`${fmt(c.targetOcc[''])} exigences sans code de cible (non classées)`, px + 24, py + ph - 22, 13, 'start', '#7a8a83', 500);
    // Top exigences
    const qx = LEFT + pw + 18, qw = CW - pw - 18, n = Math.min(8, c.ranked.length);
    out += panel(qx, py, qw, ph, 'EXIGENCES LES PLUS RETENUES', `Top ${n} · part des ${fmt(c.dossiers)} dossiers`);
    const maxShare = pct(c.ranked[0]?.count || 0, c.dossiers);
    c.ranked.slice(0, n).forEach((r, i) => { out += reqRow(qx + 24, py + 82 + i * 60, qw - 48, r, c.dossiers, maxShare, {h: 50, size: 16}); });
    return out;
  }
  function topSvg(m, c) {
    const n = Math.min(Number(m.topN) || 10, 15, c.ranked.length), rowH = Math.min(64, Math.floor(660 / Math.max(n, 1)));
    let out = text('#', LEFT + 14, 148, 13, 'middle', '#5f7b6f', 800) + text('EXIGENCE', LEFT + 112, 148, 13, 'start', '#5f7b6f', 800, 'letter-spacing="1.5"');
    out += text('PART DES DOSSIERS', LEFT + 40 + (CW - 40) * 0.56, 148, 13, 'start', '#5f7b6f', 800, 'letter-spacing="1.5"');
    out += text('DOSSIERS', RIGHT - 8, 148, 13, 'end', '#5f7b6f', 800, 'letter-spacing="1.5"');
    const maxShare = pct(c.ranked[0]?.count || 0, c.dossiers);
    c.ranked.slice(0, n).forEach((r, i) => {
      const y = 164 + i * rowH;
      if (i % 2 === 0) out += box(LEFT, y, CW, rowH - 4, '#f4f8f6', 10);
      out += text(String(i + 1), LEFT + 14, y + rowH / 2 + 4, 17, 'middle', '#06402B', 900);
      out += reqRow(LEFT + 36, y, CW - 40, r, c.dossiers, maxShare, {h: rowH - 4, size: rowH > 44 ? 18 : 16});
    });
    return out + targetLegend(852);
  }
  function targetsSvg(m, c) {
    let out = '';
    const gw = (CW - 18) / 2, gh = 344, n = 5;
    ['1', '2', '3', '4'].forEach((t, i) => {
      const x = LEFT + (i % 2) * (gw + 18), y = 140 + Math.floor(i / 2) * (gh + 18), tg = TARGETS[t];
      const items = c.ranked.filter(r => r.target === t).slice(0, n), total = c.targetOcc[t];
      out += box(x, y, gw, gh, '#ffffff', 16, '#d6e3de');
      out += box(x, y, gw, 58, tg.color, 16) + box(x, y + 40, gw, 18, tg.color, 0);
      out += text(`CIBLE ${t}`, x + 22, y + 25, 13, 'start', '#ffffff', 900, 'letter-spacing="1.5"');
      out += text(fit(tg.name, gw - 280, 19, true), x + 22, y + 48, 19, 'start', '#ffffff', 800);
      out += text(`${fmt(total)} exigences retenues`, x + gw - 22, y + 36, 14, 'end', '#ffffff', 700);
      if (!items.length) { out += text('Aucune exigence retenue sur ce périmètre', x + gw / 2, y + 200, 16, 'middle', '#7a8a83', 500); return; }
      const max = Math.max(...items.map(r => r.count));
      items.forEach((r, k) => {
        const ry = y + 76 + k * 52, barX = x + gw * 0.64, barW = gw * 0.19;
        out += codeChip(x + 18, ry + 6, r.code, r.target);
        out += text(fit(r.label, barX - x - 108, 15), x + 92, ry + 24, 15, 'start', '#0b2328', 600);
        const wn = barW * r.nature.N / max, wr = barW * r.nature.R / max, wa = barW * r.nature.A / max;
        out += box(barX, ry + 11, barW, 16, '#eef3f1', 4) + box(barX, ry + 11, wn, 16, NATURE_COLORS.N, 0) + box(barX + wn, ry + 11, wr, 16, NATURE_COLORS.R, 0) + box(barX + wn + wr, ry + 11, wa, 16, '#c9d3cf', 0);
        out += text(`${fmt(pct(r.count, c.dossiers), 0)} %`, x + gw - 70, ry + 25, 17, 'end', '#06402B', 800);
        out += text(fmt(r.count), x + gw - 18, ry + 25, 13, 'end', '#5f736b', 500);
      });
    });
    out += box(LEFT, 852 - 12, 14, 14, NATURE_COLORS.N, 3) + text('Neuf', LEFT + 22, 852, 13, 'start', '#33524a', 600);
    out += box(LEFT + 80, 852 - 12, 14, 14, NATURE_COLORS.R, 3) + text('Rénovation', LEFT + 102, 852, 13, 'start', '#33524a', 600);
    out += text('% = part des dossiers du panel ayant retenu l’exigence · barre = nombre de dossiers, Neuf / Rénovation', LEFT + 210, 852, 13, 'start', '#5f736b', 500);
    return out;
  }
  function evolutionSvg(m, c) {
    const years = c.years.slice(-7), n = Math.min(Number(m.topN) || 10, 12, c.ranked.length);
    if (!years.length) return text('Aucune année exploitable dans la source (colonnes année, date de création ou version du référentiel).', W / 2, 460, 20, 'middle', '#5f736b');
    const src = c.src, perYear = new Map(years.map(y => [y, 0])), cell = new Map();
    c.evalIdx.forEach(i => { const y = src.evals[i][2]; if (perYear.has(y)) perYear.set(y, perYear.get(y) + 1); });
    c.occ.forEach(([e, r]) => { const y = src.evals[e][2]; if (!perYear.has(y)) return; const k = r + ':' + y; cell.set(k, (cell.get(k) || 0) + 1); });
    const labelW = 640, colX = LEFT + labelW + 10, colW = (RIGHT - colX) / years.length, rowH = Math.min(60, Math.floor(640 / Math.max(n, 1)));
    let out = text('EXIGENCE', LEFT + 76, 150, 13, 'start', '#5f7b6f', 800, 'letter-spacing="1.5"');
    years.forEach((y, j) => {
      out += text(String(y), colX + colW * j + colW / 2, 146, 18, 'middle', '#06402B', 900);
      out += text(plural(perYear.get(y), 'dossier', 'dossiers'), colX + colW * j + colW / 2, 166, 12, 'middle', '#5f736b', 500);
    });
    let maxShare = 0;   // contraste : la cellule la plus fréquente prend la teinte la plus foncée
    c.ranked.slice(0, n).forEach(r => years.forEach(yr => { maxShare = Math.max(maxShare, pct(cell.get(r.id + ':' + yr) || 0, perYear.get(yr))); }));
    c.ranked.slice(0, n).forEach((r, i) => {
      const y = 180 + i * rowH;
      out += codeChip(LEFT, y + (rowH - 26) / 2 - 2, r.code, r.target);
      out += text(fit(r.label, labelW - 90, 16), LEFT + 76, y + rowH / 2 + 4, 16, 'start', '#0b2328', 600);
      years.forEach((yr, j) => {
        const count = cell.get(r.id + ':' + yr) || 0, share = pct(count, perYear.get(yr));
        const a = maxShare ? Math.min(1, share / maxShare) : 0, fill = share ? `rgba(6,64,43,${(0.08 + 0.85 * a).toFixed(3)})` : '#f3f6f5';
        out += box(colX + colW * j + 3, y + 2, colW - 6, rowH - 8, fill, 6);
        out += text(perYear.get(yr) ? `${fmt(share, 0)} %` : '—', colX + colW * j + colW / 2, y + rowH / 2 + 3, 16, 'middle', a > 0.45 ? '#ffffff' : '#06402B', 800);
      });
    });
    return out + text('Lecture : part des dossiers de l’année ayant retenu l’exigence (couleur plus foncée = plus fréquente). Classement sur l’ensemble du périmètre.', LEFT, 852, 13, 'start', '#5f736b', 500);
  }
  function mentionsSvg(m, c) {
    const src = c.src, counts = new Map();
    c.evalIdx.forEach(i => String(src.evals[i][6] || '').split('|').filter(Boolean).forEach(x => counts.set(x, (counts.get(x) || 0) + 1)));
    const mentions = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (!mentions.length) return text('Aucune mention renseignée dans la source (colonne « Évaluation: Opération: Mentions »).', W / 2, 460, 20, 'middle', '#5f736b');
    const focus = mentions.some(x => x[0] === m.mentionFocus) ? m.mentionFocus : mentions[0][0];
    const lx = LEFT, lw = 560, ly = 140, lh = 700;
    let out = panel(lx, ly, lw, lh, 'MENTIONS LES PLUS DEMANDÉES', `Part des ${fmt(c.dossiers)} dossiers`);
    const maxM = mentions[0][1];
    mentions.slice(0, 10).forEach(([name, n], i) => {
      const y = ly + 84 + i * 60, on = name === focus;
      if (on) out += box(lx + 12, y - 6, lw - 24, 56, '#e3efe8', 10, '#9cc4ad');
      out += text(fit(name, lw - 190, 16, true), lx + 26, y + 16, 16, 'start', on ? '#06402B' : '#0b2328', on ? 800 : 700);
      out += text(`${fmt(pct(n, c.dossiers), 0)} %`, lx + lw - 26, y + 18, 19, 'end', '#06402B', 800);
      out += text(plural(n, 'dossier', 'dossiers'), lx + lw - 86, y + 17, 13, 'end', '#5f736b', 500);
      out += box(lx + 26, y + 28, lw - 52, 10, '#e4ede9', 5) + box(lx + 26, y + 28, (lw - 52) * n / maxM, 10, on ? '#06402B' : '#43995f', 5);
    });
    // Exigences des dossiers de la mention, comparées à l'ensemble du panel
    const evalSet = new Set(c.evalIdx.filter(i => String(src.evals[i][6] || '').split('|').includes(focus)));
    const fc = new Map(); c.occ.forEach(([e, r]) => { if (evalSet.has(e)) fc.set(r, (fc.get(r) || 0) + 1); });
    const items = [...fc.entries()].sort((a, b) => b[1] - a[1]).slice(0, Math.min(Number(m.topN) || 10, 10));
    const rx = LEFT + lw + 18, rw = CW - lw - 18;
    out += panel(rx, ly, rw, lh, 'EXIGENCES ASSOCIÉES', `Dossiers « ${fit(focus, 420, 21, true)} » · ${plural(evalSet.size, 'dossier', 'dossiers')}`);
    const panelShare = new Map(c.ranked.map(r => [r.id, pct(r.count, c.dossiers)]));
    const barX = rx + rw * 0.56, barW = rw * 0.25;
    out += text('PART DES DOSSIERS DE LA MENTION', barX, ly + 84, 11, 'start', '#5f7b6f', 800, 'letter-spacing="1"');
    items.forEach(([r, n], i) => {
      const y = ly + 100 + i * 58, rr = src.reqs[r], share = pct(n, evalSet.size), ref = panelShare.get(r) || 0;
      out += codeChip(rx + 24, y + 6, rr[1], rr[3]);
      out += text(fit(rr[2] || rr[0], barX - rx - 116, 15), rx + 100, y + 24, 15, 'start', '#0b2328', 600);
      out += box(barX, y + 12, barW, 14, '#e4ede9', 7) + box(barX, y + 12, barW * share / 100, 14, targetOf(rr[3]).color, 7);
      out += `<line x1="${barX + barW * ref / 100}" x2="${barX + barW * ref / 100}" y1="${y + 6}" y2="${y + 32}" stroke="#0b2328" stroke-width="2.5"/>`;
      out += text(`${fmt(share, 0)} %`, rx + rw - 96, y + 25, 18, 'end', '#06402B', 800);
      const gap = share - ref;
      out += text(`${gap >= 0 ? '+' : '−'}${fmt(Math.abs(gap), 0)} pts`, rx + rw - 24, y + 25, 13, 'end', gap >= 0 ? '#16714c' : '#a24b14', 700);
    });
    out += `<line x1="${rx + 24}" x2="${rx + 24}" y1="${ly + lh - 30}" y2="${ly + lh - 14}" stroke="#0b2328" stroke-width="2.5"/>`;
    out += text('trait = part sur l’ensemble du panel · pts = écart de la mention par rapport au panel', rx + 34, ly + lh - 17, 13, 'start', '#5f736b', 500);
    return out;
  }
  function svg(m) {
    const view = VIEWS.some(v => v[0] === m.view) ? m.view : 'overview';
    const src = source();
    if (!src) return emptySvg(m, view, 'Importer l’export RAPPORT des exigences', 'Panneau de gauche : déposer le fichier Excel / CSV ou coller le tableau. La base sert à toutes les slides Exigences.');
    const c = compute(m, src);
    if (!c.dossiers) return emptySvg(m, view, 'Aucun dossier sur ce périmètre', 'Élargir les filtres de la slide dans le panneau de gauche.');
    const body = {overview: overviewSvg, top: topSvg, targets: targetsSvg, evolution: evolutionSvg, mentions: mentionsSvg}[view](m, c);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${header(m, view, bridge?.logo)}${body}${footer(m, c)}</svg>`;
  }
  async function png() {
    const url = URL.createObjectURL(new Blob([svg(bridge.getModel())], {type: 'image/svg+xml;charset=utf-8'}));
    try {
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
      const cv = document.createElement('canvas'); cv.width = 3840; cv.height = 2160;
      cv.getContext('2d').drawImage(img, 0, 0, 3840, 2160);
      return await new Promise((ok, no) => cv.toBlob(b => b ? ok(b) : no(Error('Export PNG impossible')), 'image/png'));
    } finally { URL.revokeObjectURL(url); }
  }

  /* ------------------------------------------------------------------ panneau de gauche */
  const COLUMN_LABELS = {evaluation: 'Évaluation', operation: 'Opération', requirement: 'Exigence', code: 'Code d’exigence', validated: 'Exigence validée', status: 'Statut', referential: 'Référentiel', version: 'Version', moa: 'Maître d’ouvrage', mentions: 'Mentions', region: 'Région', year: 'Année', created: 'Date de création'};
  function controls(m) {
    const src = source(), o = options(src), f = Object.assign({}, defaults.filters, m.filters || {});
    const meta = VIEWS.find(v => v[0] === m.view) || VIEWS[0];
    const sel = (name, value, opts, attrs = '') => `<select ${attrs} data-req-field="${name}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    const checks = (key, values, chosen) => values.length ? `<div class="req-slide-checks">${values.map(v => `<label><input type="checkbox" data-req-check="${key}" value="${esc(v)}" ${chosen.includes(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('')}</div>` : '<p class="help">—</p>';
    const status = src ? `<div class="carbon-import-summary"><b>${plural(src.evals.length, 'dossier', 'dossiers')}</b> · ${plural(src.occ.length / 3, 'exigence retenue', 'exigences retenues')} · ${plural(src.reqs.length, 'exigence distincte', 'exigences distinctes')}</div>
      <div class="carbon-import-chips">${Object.keys(COLUMN_LABELS).map(k => `<span class="carbon-import-chip ${src.columns.includes(k) ? 'is-found' : 'is-missing'}">${esc(COLUMN_LABELS[k])}</span>`).join('')}</div>
      <p class="help">Années : ${esc(src.basis)}.${src.ignored ? ` ${plural(src.ignored, 'ligne ignorée', 'lignes ignorées')} (sans évaluation ou sans exigence).` : ''}</p>` : '<p class="help">Aucune base importée.</p>';
    const fromObs = !!src && /^Observatoire Prestaterre/.test(src.name || '');
    return `<div class="control-section carbon-import-section"><h3>Base Exigences — export RAPPORT</h3>
      ${fromObs ? `<div class="req-from-observatoire"><b>Données reçues de l’Observatoire Prestaterre</b><span>${plural(src.evals.length, 'dossier', 'dossiers')} des opérations filtrées dans l’Observatoire${/anonymisé/.test(src.name) ? ' · anonymisées' : ''}. Aucun import nécessaire ; elles ne sont pas enregistrées dans ce navigateur.</span></div>` : ''}
      <p class="help">${fromObs ? 'Pour utiliser un autre export RAPPORT à la place, dépose-le ci-dessous.' : 'Même source que l’onglet Exigences de l’Observatoire : une ligne par exigence retenue dans une évaluation. <b>La base est commune à toutes les slides Exigences.</b> Ouvert depuis le bouton « Générateur de rapports » de l’Observatoire, Obslide reçoit ces données directement.'}</p>
      <div class="carbon-import-dropzone ${fromObs ? 'is-secondary' : ''}" data-req-dropzone tabindex="0" role="button" aria-label="Déposer l’export RAPPORT ou choisir un fichier">
        <span class="carbon-drop-icon" aria-hidden="true">⇧</span><strong>Déposer l’export RAPPORT ici</strong>
        <small>Excel .xlsx · CSV .csv · Tabulations .tsv · ou coller depuis Excel</small><span class="carbon-drop-button">Choisir un fichier</span>
      </div>
      <input type="file" id="reqFileInput" accept=".xlsx,.csv,.tsv,.txt" hidden>
      <div class="carbon-import-toolbar"><span class="carbon-import-source">${esc(src ? src.name : 'Aucun fichier')}</span></div>
      <label class="carbon-paste-label" for="obsReqPaste">Ou coller le tableau (avec ses en-têtes)</label>
      <textarea id="obsReqPaste" rows="4" class="carbon-import-textarea" placeholder="Évaluation: Code interne · Exigence associée: Nom · Code d’exigence · Référentiel · Mentions · Statut…"></textarea>
      <div class="carbon-import-actions"><button class="btn btn-primary" type="button" data-req-apply>Analyser le tableau</button><button class="btn btn-secondary" type="button" data-req-clear>Retirer la base</button></div>
      <div id="reqImportMessage" class="carbon-import-message" aria-live="polite"></div>${status}
    </div>
    <div class="control-section"><h3>Slide</h3>
      <div class="field"><label>Vue</label>${sel('view', m.view, VIEWS.map(v => [v[0], v[1]]))}</div>
      <div class="field"><label>Titre</label><input type="text" data-req-field="title" value="${esc(m.title)}" placeholder="${esc(meta[2])}"></div>
      <div class="field"><label>Sous-titre</label><input type="text" data-req-field="subtitle" value="${esc(m.subtitle)}" placeholder="${esc(meta[3])}"></div>
      <div class="field"><label>Nombre d’exigences</label>${sel('topN', m.topN, [5, 8, 10, 12, 15].map(n => [n, `Top ${n}`]))}</div>
      ${m.view === 'mentions' ? `<div class="field"><label>Mention analysée</label>${sel('mentionFocus', m.mentionFocus, [['', 'La plus demandée'], ...o.mentions.map(x => [x, x])])}</div>` : ''}
    </div>
    <div class="control-section"><h3>Filtres de la slide</h3>
      <div class="field"><label>Type d’opération</label>${sel('filter.nature', f.nature, [['all', 'Neuf et rénovation'], ['N', 'Neuf'], ['R', 'Rénovation']])}</div>
      <div class="field"><label>Année de</label>${sel('filter.yearFrom', f.yearFrom, [['', 'Début'], ...o.years.map(y => [y, y])])}</div>
      <div class="field"><label>Année à</label>${sel('filter.yearTo', f.yearTo, [['', 'Fin'], ...o.years.map(y => [y, y])])}</div>
      <div class="field"><label>Mention</label>${sel('filter.mention', f.mention, [['', 'Toutes'], ...o.mentions.map(x => [x, x])])}</div>
      <div class="field"><label>Maître d’ouvrage</label>${sel('filter.moa', f.moa, [['', 'Tous'], ...o.moas.map(x => [x, x])])}</div>
      <div class="field"><label>Référentiels</label>${checks('referentials', o.referentials, f.referentials || [])}</div>
      <div class="field"><label>Statut de l’évaluation</label>${checks('statuses', o.statuses, f.statuses || [])}</div>
      <label class="req-slide-toggle"><input type="checkbox" data-req-field="filter.validatedOnly" ${f.validatedOnly ? 'checked' : ''}> Exigences validées uniquement</label>
      <p class="help">Aucune case cochée = tous. Le périmètre retenu est rappelé en bas de la slide.</p>
    </div>`;
  }
  function toolbar(m) {
    const scope = window.OBSLIDE_LAUNCH_SCOPE, src = source();
    const chip = scope?.active?.() ? `<div class="slide-filter-launch-scope"><div><b>Périmètre Observatoire</b><span>${esc(src && !src.evals.some(e => e[8]) ? 'non appliqué : réimporte l’export RAPPORT (colonne « Évaluation: Opération: Code interne »)' : `${scope.summary()} · ${scope.count()} opérations`)}</span></div><button type="button" data-clear-newosb-scope="1" title="Retirer le périmètre transmis par l’Observatoire" aria-label="Retirer le périmètre transmis par l’Observatoire">×</button></div>` : '';
    return `<div class="nx-filterbar">${chip}<label class="nx-filter">Vue <select data-req-field="view">${VIEWS.map(v => `<option value="${v[0]}" ${m.view === v[0] ? 'selected' : ''}>${esc(v[1])}</option>`).join('')}</select></label>
      <label class="nx-filter">Exigences <select data-req-field="topN">${[5, 8, 10, 12, 15].map(n => `<option value="${n}" ${Number(m.topN) === n ? 'selected' : ''}>Top ${n}</option>`).join('')}</select></label></div>`;
  }

  /* ------------------------------------------------------------------ événements */
  function message(msg, isError = false) {
    const el = document.getElementById('reqImportMessage');
    if (el) { el.textContent = msg; el.classList.toggle('is-error', isError); }
  }
  function adopt(src) {
    bridge.setSource(src);
    bridge.refresh(true);
    message(`Import réussi : ${plural(src.evals.length, 'dossier', 'dossiers')}, ${plural(src.occ.length / 3, 'exigence retenue', 'exigences retenues')}.`);
  }
  async function importFile(file) {
    if (!bridge?.isActive()) return;
    message(`Lecture de ${file.name}…`);
    try { adopt(await readFile(file)); } catch (err) { message(err.message || 'Lecture du fichier impossible.', true); }
  }
  function importText(raw, name) {
    try { adopt(buildSource(textMatrix(raw), name)); } catch (err) { message(err.message || 'Tableau illisible.', true); }
  }
  function setField(m, name, value) {
    if (name.startsWith('filter.')) { m.filters = Object.assign({}, defaults.filters, m.filters || {}); m.filters[name.slice(7)] = value; }
    else m[name] = name === 'topN' ? Number(value) : value;
  }
  document.addEventListener('change', e => {
    if (!bridge?.isActive()) return;
    const t = e.target;
    if (t.matches('#reqFileInput')) { const file = t.files?.[0]; t.value = ''; if (file) importFile(file); return; }
    if (t.matches('[data-req-check]')) {
      const m = bridge.getModel(), key = t.dataset.reqCheck;
      m.filters = Object.assign({}, defaults.filters, m.filters || {});
      const cur = new Set(m.filters[key] || []); t.checked ? cur.add(t.value) : cur.delete(t.value);
      m.filters[key] = [...cur]; bridge.refresh(false); return;
    }
    if (t.matches('[data-req-field]')) {
      const m = bridge.getModel(), name = t.dataset.reqField;
      setField(m, name, t.type === 'checkbox' ? t.checked : t.value);
      bridge.refresh(name === 'view' || name === 'topN');   // la vue change les réglages affichés
    }
  });
  document.addEventListener('input', e => {
    if (!bridge?.isActive()) return;
    const t = e.target;
    if (t.matches('input[type="text"][data-req-field]')) { setField(bridge.getModel(), t.dataset.reqField, t.value); bridge.refresh(false); }
  });
  document.addEventListener('click', e => {
    if (!bridge?.isActive()) return;
    if (e.target.closest('[data-req-dropzone]')) { document.getElementById('reqFileInput')?.click(); return; }
    if (e.target.closest('[data-req-apply]')) { importText(document.getElementById('obsReqPaste')?.value || '', 'Tableau collé'); return; }
    if (e.target.closest('[data-req-clear]')) { if (confirm('Retirer la base Exigences de toutes les slides Exigences ?')) { bridge.setSource(null); bridge.refresh(true); } }
  });
  document.addEventListener('keydown', e => {
    if (!bridge?.isActive() || !e.target.closest?.('[data-req-dropzone]')) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('reqFileInput')?.click(); }
  });
  document.addEventListener('dragover', e => {
    const zone = e.target.closest?.('[data-req-dropzone]'); if (!bridge?.isActive() || !zone) return;
    e.preventDefault(); zone.classList.add('is-dragging');
  });
  document.addEventListener('dragleave', e => { const zone = e.target.closest?.('[data-req-dropzone]'); if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('is-dragging'); });
  document.addEventListener('drop', e => {
    const zone = e.target.closest?.('[data-req-dropzone]'); if (!bridge?.isActive() || !zone) return;
    e.preventDefault(); zone.classList.remove('is-dragging');
    const file = e.dataTransfer?.files?.[0]; if (file) { importFile(file); return; }
    const raw = e.dataTransfer?.getData('text/plain'); if (raw) importText(raw, 'Tableau déposé');
  });
  document.addEventListener('paste', e => {
    const zone = e.target.closest?.('[data-req-dropzone]'); if (!bridge?.isActive() || !zone) return;
    const raw = e.clipboardData?.getData('text/plain'); if (raw) { e.preventDefault(); importText(raw, 'Tableau collé'); }
  });

  window.OBSRequirementsSlides = {defaults, VIEWS, configure: b => bridge = b, controls, toolbar, svg, png, compute, buildSource, textMatrix, readFile};
})();
