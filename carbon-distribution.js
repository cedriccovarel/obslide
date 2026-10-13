(function () {
  'use strict';
  const defs = [
    ['stock', 'Stock C', 'kgC/m²'],
    ['ic', 'IC carbone', 'kgCO₂e/m²'],
    ['energy', 'IC énergie', 'kgCO₂e/m²'],
    ['eges', 'EGES', 'unité du fichier']
  ];
  const defaults = {title: 'DISTRIBUTION DES PERFORMANCES CARBONE', raw: '', view: 'gauges', enabled: ['stock', 'ic', 'energy', 'eges']};
  let bridge;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const parse = raw => window.OBSCarbonTableImport.parse(raw);
  function quantile(sorted, p) {
    if (!sorted.length) return null;
    const k = (sorted.length - 1) * p, i = Math.floor(k), t = k - i;
    return sorted[i] + (sorted[Math.min(i + 1, sorted.length - 1)] - sorted[i]) * t;
  }
  function buildingDecileCounts(sorted) {
    // Ranked buildings, not projects: each valid building is counted exactly once.
    // Rank-based bins keep the groups as balanced as possible. Equal values may
    // straddle adjacent bins; percentile cut-offs are calculated separately.
    const counts = Array(10).fill(0);
    const n = sorted.length;
    for (let rank = 0; rank < n; rank++) {
      counts[Math.min(9, Math.floor(rank * 10 / n))]++;
    }
    return counts;
  }
  function summary(m) {
    const p = parse(m.raw), all = p.rows, unique = new Map();
    all.forEach(r => { if (!unique.has(r.code)) unique.set(r.code, []); unique.get(r.code).push(r); });
    const totalHousing = [...unique.values()].reduce((sum, rs) => sum + Math.max(0, ...rs.map(r => r.housing ?? 0)), 0);
    const indicators = {};
    defs.forEach(([id, label, unit]) => {
      const rows = all.filter(r => r[id] !== null && Number.isFinite(r[id]));
      const sorted = rows.map(r => r[id]).sort((a, b) => a - b);
      const involved = new Map();
      rows.forEach(r => {if (!involved.has(r.code)) involved.set(r.code, []); involved.get(r.code).push(r);});
      const housing = [...involved.values()].reduce((sum, rs) => sum + Math.max(0, ...rs.map(r => r.housing ?? 0)), 0);
      const buildingCounts = buildingDecileCounts(sorted);
      const buildingShares = buildingCounts.map(count => sorted.length ? 100 * count / sorted.length : 0);
      indicators[id] = {
        id, label, unit, values: sorted,
        min: sorted[0] ?? null, max: sorted.at(-1) ?? null,
        mean: sorted.length ? sorted.reduce((sum, v) => sum + v, 0) / sorted.length : null,
        deciles: Array.from({length: 11}, (_, i) => quantile(sorted, i / 10)),
        buildings: rows.length, projects: involved.size, housing,
        coverage: all.length ? 100 * rows.length / all.length : 0,
        projectCoverage: unique.size ? 100 * involved.size / unique.size : 0,
        buildingCounts, buildingShares
      };
    });
    const lots = Array.from({length: 13}, (_, i) => {
      const rs = all.filter(r => r.lots[i] !== null),
        vs = rs.map(r => r.lots[i]).sort((a, b) => a - b), codes = new Set(rs.map(r => r.code));
      return {
        number: i + 1, mean: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null,
        min: vs[0] ?? null, max: vs.at(-1) ?? null,
        buildings: vs.length, projects: codes.size,
        projectCoverage: unique.size ? 100 * codes.size / unique.size : 0,
        coverage: all.length ? 100 * vs.length / all.length : 0
      };
    });
    return {...p, indicators, lots, buildings: all.length, projects: unique.size, housing: totalHousing};
  }
  const fmt = n => n === null || n === undefined ? '—' : Number(n).toLocaleString('fr-FR', {maximumFractionDigits: 1});
  const pct = n => `${fmt(n)} %`;
  function controls(m) {
    const s = summary(m), mapping = s.mapping || {}, exists = k => Number.isInteger(mapping[k]) && mapping[k] >= 0;
    const indicatorLabels = [
      ['stock', 'Stock C', exists('stock')],
      ['ic', 'IC carbone · construction', (exists('comp') && exists('site')) || exists('icDirect')],
      ['energy', 'IC énergie', exists('energy')],
      ['eges', 'EGES total', exists('eges')]
    ];
    const lotsFound = Array.from({length: 13}, (_, i) => i + 1).filter(i => exists('lot' + i));
    const chips = indicatorLabels.map(([id, label, mapped]) => `<span class="carbon-import-chip ${mapped && s.indicators[id].buildings ? 'is-found' : 'is-missing'}" title="${mapped ? `Colonne reconnue · ${s.indicators[id].buildings} bâtiments renseignés` : 'Colonne(s) absente(s)'}"><span aria-hidden="true">${mapped && s.indicators[id].buildings ? '✓' : '○'}</span> ${esc(label)} : <b>${mapped ? `${fmt(s.indicators[id].buildings)} bât.` : 'absent'}</b></span>`).join('');
    const partialIc = exists('comp') !== exists('site') && !exists('icDirect') ? '<p class="carbon-import-warning">Pour calculer l’IC carbone, les deux colonnes « IC composants bâtiment » et « IC chantier » sont nécessaires. Une seule des deux est présente.</p>' : '';
    const lotStatus = `<div class="carbon-lots-status"><b>Lots IC composants</b> · ${lotsFound.length}/13 colonnes reconnues${lotsFound.length ? `<div class="carbon-lot-chips">${Array.from({length: 13}, (_, i) => `<span class="${exists('lot'+(i+1)) ? 'is-found' : ''}" title="Lot ${i+1} · ${s.lots[i].buildings} bâtiments renseignés">${i+1}</span>`).join('')}</div>` : ''}</div>`;
    const parserError = s.error ? `<p class="carbon-import-error" role="alert">${esc(s.error)}</p>` : '';
    return `<div class="control-section carbon-import-section"><h3>Tableau carbone — import par bâtiment</h3>
      <p class="help">Dépose un fichier Excel/CSV ou colle un tableau. L’application retrouve automatiquement les colonnes, même si elles ne sont pas dans le même ordre.</p>
      <div class="carbon-import-dropzone" data-carbon-dropzone tabindex="0" role="button" aria-label="Déposer un tableau carbone ou choisir un fichier Excel, CSV ou TSV">
        <span class="carbon-drop-icon" aria-hidden="true">⇧</span>
        <strong>Déposer le tableau carbone ici</strong>
        <small>Excel .xlsx · CSV .csv · Tabulations .tsv · ou coller depuis Excel</small>
        <span class="carbon-drop-button">Choisir un fichier</span>
      </div>
      <input type="file" id="carbonFileInput" accept=".xlsx,.csv,.tsv,.txt,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
      <div class="carbon-import-toolbar"><button type="button" class="btn btn-secondary btn-small" data-carbon-template>Modèle des colonnes</button><span class="carbon-import-source">${esc(m.importSource || (m.raw ? 'Tableau collé ou restauration' : 'Aucun fichier importé'))}</span></div>
      <label class="carbon-paste-label" for="obsCarbonPaste">Ou coller un tableau depuis Excel / Google Sheets</label>
      <textarea id="obsCarbonPaste" rows="6" class="carbon-import-textarea" placeholder="Colle le tableau avec ses en-têtes : Code interne, Stock C/m², IC composants bâtiment, IC chantier, IC énergie bâtiment, Eges total, IC lot 1…13.">${esc(m.raw)}</textarea>
      <div class="carbon-import-actions"><button class="btn btn-primary" type="button" data-carbon-apply>Analyser le tableau</button><button class="btn btn-secondary" type="button" data-carbon-clear>Effacer</button></div>
      <div id="carbonImportMessage" class="carbon-import-message" aria-live="polite"></div>
      ${parserError}${partialIc}
      <div class="carbon-import-summary"><b>${fmt(s.buildings)} bâtiments</b> · ${fmt(s.projects)} projets · ${fmt(s.housing)} logements (dédupliqués par projet)</div>
      <div class="carbon-import-chips">${chips}</div>${lotStatus}
      <p class="help carbon-import-note">Chaque ligne = un bâtiment. IC carbone = IC composants bâtiment + IC chantier (ou IC carbone directement s’il est fourni et que le couple manque) ; EGES = Eges total. Les colonnes absentes et cellules vides ne valent pas zéro. Déciles : bâtiments renseignés uniquement. Les logements ne sont comptés qu’une fois par projet.</p>
    </div>`;
  }
  function toolbar(m) {
    const s = summary(m);
    return `<div class="nx-filterbar"><label class="nx-filter">Vue <select data-carbon-view><option value="gauges" ${m.view !== 'lots' ? 'selected' : ''}>Jauges carbone</option><option value="lots" ${m.view === 'lots' ? 'selected' : ''}>Contributions des 13 lots</option></select></label><div class="nx-total"><strong>${fmt(s.buildings)}</strong><span>bâtiments du panel</span></div>${defs.map(([id, label]) => `<label class="nx-filter" style="display:flex;align-items:center;gap:7px"><input type="checkbox" data-carbon-toggle="${id}" ${m.enabled.includes(id) ? 'checked' : ''}>${esc(label)}</label>`).join('')}<span style="font-size:12px;color:#64766b">${fmt(s.projects)} projets · ${fmt(s.housing)} logements</span></div>`;
  }
  function text(str, x, y, size, anchor = 'start', color = '#164b37', weight = 600, extra = '') {
    return `<text x="${x}" y="${y}" font-size="${size}" font-family="Arial,Helvetica,sans-serif" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" ${extra}>${esc(str)}</text>`;
  }
  function box(x, y, w, h, fill, rx = 8, stroke = '') {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${stroke ? `stroke="${stroke}"` : ''}/>`;
  }
  function interpretation(d) {
    const value = fmt(d.mean);
    if (d.id === 'stock') return [
      `Cela signifie que les produits d’un bâtiment stockent en moyenne ${value} kgC/m².`,
      'Ce stockage n’équivaut pas à des émissions de CO₂ évitées.'
    ];
    if (d.id === 'ic') return [
      `Composants et chantier représentent en moyenne ${value} kgCO₂e/m² par bâtiment.`,
      'À périmètre comparable, un IC plus faible signifie moins d’impact.'
    ];
    if (d.id === 'energy') return [
      `L’énergie génère en moyenne ${value} kgCO₂e/m² par bâtiment étudié.`,
      'Une valeur plus faible traduit un impact carbone de l’énergie moindre.'
    ];
    return [
      `L’EGES moyen est de ${value} par bâtiment (unité du fichier source).`,
      'Cette valeur représente les émissions du périmètre EGES renseigné.'
    ];
  }
  function panelSvg(d, all, x, y, w, h, index) {
    const compact = h < 470, pad = compact ? 18 : 26;
    const left = x + pad, right = x + w - pad, width = right - left;
    let out = box(x, y, w, h, '#f8faf8', 15, '#d5e4da');
    out += text(d.label.toUpperCase(), left, y + (compact ? 24 : 42), compact ? 21 : 26, 'start', '#174b36', 800);
    out += text(`${d.buildings} bât. renseignés  ·  ${d.projects}/${all.projects} projets (${pct(d.projectCoverage)})`, left, y + (compact ? 44 : 72), compact ? 12 : 14, 'start', '#526b5b', 500);
    if (!d.values.length) {
      out += text('Aucune valeur renseignée pour cet indicateur', x + w / 2, y + h / 2, 18, 'middle', '#7b8d7f');
      return out;
    }
    out += text('MOYENNE PAR BÂTIMENT', left, y + (compact ? 63 : 103), compact ? 10 : 15, 'start', '#67806d', 700);
    const avgStr = fmt(d.mean);
    const avgSize = Math.max(compact ? 24 : 37, (compact ? 36 : 59) - Math.max(0, avgStr.length - 7) * 3);
    out += text(avgStr, left, y + (compact ? 96 : 174), avgSize, 'start', '#226947', 800);
    out += text(d.unit, right, y + (compact ? 92 : 171), compact ? 13 : 18, 'end', '#617b67', 600);
    const barY = y + (compact ? 120 : 231), barH = compact ? 15 : 24;
    out += text('VALEURS OBSERVÉES — TRAIT ORANGE = MOYENNE', left, barY - (compact ? 7 : 11), compact ? 10 : 13, 'start', '#526b5b', 700);
    out += `<defs><linearGradient id="carbonGradient${index}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#a4d2b4"/><stop offset="100%" stop-color="#276b4e"/></linearGradient></defs>`;
    out += box(left, barY, width, barH, `url(#carbonGradient${index})`, compact ? 6 : 9);
    const range = d.max - d.min;
    d.deciles.forEach(v => {
      const dx = left + (range ? (v - d.min) / range : 0.5) * width;
      out += `<line x1="${dx}" x2="${dx}" y1="${barY + 2}" y2="${barY + barH - 2}" stroke="#ffffff" stroke-width="1.3" opacity="0.85"/>`;
    });
    const ax = left + (range ? (d.mean - d.min) / range : 0.5) * width;
    out += `<line x1="${ax}" x2="${ax}" y1="${barY - 5}" y2="${barY + barH + 5}" stroke="#e6a449" stroke-width="4"/>`;
    out += text(`MIN ${fmt(d.min)}`, left, y + (compact ? 153 : 288), compact ? 12 : 17, 'start', '#194e38', 700);
    out += text(`MAX ${fmt(d.max)}`, right, y + (compact ? 153 : 288), compact ? 12 : 17, 'end', '#194e38', 700);
    const sharesY = y + (compact ? 180 : 341), sharesH = compact ? 23 : 35;
    out += text('PART DES BÂTIMENTS PAR DÉCILE · CLASSEMENT PAR VALEUR', left, sharesY - (compact ? 7 : 11), compact ? 10 : 13, 'start', '#526b5b', 700);
    const sw = width / 10;
    d.buildingShares.forEach((share, i) => {
      const xx = left + i * sw;
      out += `<g><title>${esc(`D${i+1} : ${d.buildingCounts[i]} bâtiment(s) sur ${d.buildings} (${fmt(share)} %)`)}</title>`;
      out += box(xx + 1, sharesY, sw - 2, sharesH, i % 2 ? '#d5e8dc' : '#b7d6c1', 3);
      out += text(`D${i+1}`, xx + sw / 2, sharesY + (compact ? 9 : 12), compact ? 8 : 10, 'middle', '#53735f', 700);
      out += text(share > 0 && share < 1 ? '<1%' : `${Math.round(share)}%`, xx + sw / 2, sharesY + (compact ? 19 : 27), compact ? 10 : 13, 'middle', '#194d38', 700);
      out += '</g>';
    });
    const decY = y + (compact ? 226 : 441), decH = compact ? 31 : 53;
    out += text('BORNES DES DÉCILES · D5 = MÉDIANE', left, decY - (compact ? 9 : 15), compact ? 11 : 14, 'start', '#526b5b', 700);
    const decCols = 6, decGap = compact ? 4 : 7, cw = (width - decGap * (decCols - 1)) / decCols;
    d.deciles.forEach((v, i) => {
      const c = i % decCols, r = Math.floor(i / decCols);
      const xx = left + c * (cw + decGap), yy = decY + r * (decH + (compact ? 4 : 9));
      out += box(xx, yy, cw, decH, i === 5 ? '#cde6d4' : '#e7f1e9', 5);
      out += text('D' + i, xx + 7, yy + (compact ? 12 : 18), compact ? 10 : 12, 'start', '#557561', 700);
      const val = fmt(v);
      const valSize = Math.max(compact ? 10 : 12, (compact ? 12 : 17) - Math.max(0, val.length - (compact ? 8 : 9)) * 1.2);
      out += text(val, xx + cw - 7, yy + (compact ? 25 : 40), valSize, 'end', '#164b37', 800);
    });
    const keyH = compact ? 55 : 134, keyY = y + h - keyH - (compact ? 9 : 16);
    const [line1, line2] = interpretation(d);
    out += box(x + (compact ? 10 : 16), keyY, w - (compact ? 20 : 32), keyH, '#e8f2eb', 9);
    out += text('CE QUE SIGNIFIENT CES CHIFFRES', left, keyY + (compact ? 14 : 25), compact ? 10 : 14, 'start', '#174c36', 800);
    // Each interpretation is a single, bounded line: no overflow into neighboring panels.
    const capacity = width - 4, f = compact ? 12 : 17;
    out += text(line1, left, keyY + (compact ? 31 : 61), f, 'start', '#305941', 600, `textLength="${Math.min(capacity, line1.length * f * 0.52)}" lengthAdjust="spacingAndGlyphs"`);
    out += text(line2, left, keyY + (compact ? 46 : 91), f, 'start', '#42684e', 500, `textLength="${Math.min(capacity, line2.length * f * 0.52)}" lengthAdjust="spacingAndGlyphs"`);
    return out;
  }
  function svg(m) {
    if (m.view === 'lots') return lotsSvg(m);
    const s = summary(m), active = defs.filter(([id]) => (m.enabled || []).includes(id)), n = active.length;
    let out = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">`;
    out += box(0, 0, 1600, 900, '#ffffff', 0);
    out += text(m.title || defaults.title, 60, 65, 36, 'start', '#164b37', 800);
    out += text(`PANEL GLOBAL · ${fmt(s.buildings)} BÂTIMENTS · ${fmt(s.projects)} PROJETS · ${fmt(s.housing)} LOGEMENTS`, 61, 105, 16, 'start', '#66796d');
    if (bridge?.logo) out += `<image href="${bridge.logo}" x="1410" y="18" width="132" height="85" preserveAspectRatio="xMidYMid meet"/>`;
    if (!n) return out + text('Cochez au moins un indicateur carbone.', 800, 440, 28, 'middle') + '</svg>';
    const gap = 18, top = 132, usableHeight = 746, fullW = 1480, halfW = (fullW - gap) / 2;
    const placements = n === 1 ? [{x:60, y:top, w:fullW, h:usableHeight}] :
      n === 2 ? [{x:60, y:top, w:halfW, h:usableHeight}, {x:60 + halfW + gap, y:top, w:halfW, h:usableHeight}] :
      n === 3 ? [{x:60, y:top, w:halfW, h:364}, {x:60 + halfW + gap, y:top, w:halfW, h:364}, {x:60, y:top + 382, w:fullW, h:364}] :
      [{x:60, y:top, w:halfW, h:364}, {x:60 + halfW + gap, y:top, w:halfW, h:364}, {x:60, y:top + 382, w:halfW, h:364}, {x:60 + halfW + gap, y:top + 382, w:halfW, h:364}];
    active.forEach(([id], i) => {const p = placements[i]; out += panelSvg(s.indicators[id], s, p.x, p.y, p.w, p.h, i);});
    return out + '</svg>';
  }
  function lotsSvg(m) {
    const s = summary(m), lots = s.lots, valid = lots.filter(d => d.buildings), max = Math.max(1, ...valid.map(d => Math.max(0, d.mean)));
    const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${box(0,0,1600,900,'#fff',0)}`];
    out.push(text('CONTRIBUTIONS CARBONE PAR LOT', 60, 68, 37, 'start', '#164b37', 800));
    out.push(text(`${fmt(s.buildings)} bâtiments · ${fmt(s.projects)} projets · ${fmt(s.housing)} logements dans le panel global`, 60, 106, 18, 'start', '#65776b'));
    if (bridge?.logo) out.push(`<image href="${bridge.logo}" x="1410" y="18" width="132" height="85"/>`);
    if (!valid.length) {out.push(text('Aucune colonne IC lot 1 à IC lot 13 renseignée', 800, 440, 30, 'middle')); return out.join('') + '</svg>';}
    const left = 195, barW = 925, top = 145, step = 46;
    out.push(text('IC MOYEN DU LOT', 1160, 133, 14, 'start', '#526a5b', 700));
    out.push(text('PROJETS RENSEIGNÉS', 1372, 133, 14, 'start', '#526a5b', 700));
    lots.forEach((d, i) => {
      const y = top + i * step;
      out.push(text(`LOT ${d.number}`, left - 20, y + 19, 18, 'end', '#164b37', 700));
      out.push(box(left, y, barW, 25, '#edf3ef', 5));
      if (d.mean !== null) {
        out.push(box(left, y, Math.max(0, d.mean / max * barW), 25, '#2d7854', 5));
        out.push(text(fmt(d.mean), 1160, y + 19, 18, 'start', '#164b37', 800));
        out.push(text(`${d.projects}/${s.projects} · ${pct(d.projectCoverage)}`, 1372, y + 19, 15, 'start', '#536d5d', 600));
      } else {
        out.push(text('Non renseigné', 1160, y + 19, 15, 'start', '#87938a', 500));
        out.push(text('—', 1372, y + 19, 15, 'start', '#87938a', 500));
      }
    });
    const topLot = valid.reduce((best, item) => item.mean > best.mean ? item : best, valid[0]);
    out.push(box(60, 772, 1480, 111, '#edf5ef', 12));
    out.push(text('CLÉ DE LECTURE — CONTRIBUTION DES IC COMPOSANTS', 82, 799, 18, 'start', '#164b37', 800));
    out.push(text(`Le lot ${topLot.number} présente ici la contribution moyenne la plus élevée : ${fmt(topLot.mean)} (unité d’IC du fichier), par bâtiment renseigné.`, 82, 828, 17, 'start', '#315c43', 600));
    out.push(text('Une barre longue = une contribution moyenne plus élevée ; le pourcentage indique la part des projets renseignés pour chaque lot.', 82, 852, 15, 'start', '#466251', 500));
    out.push(text('Ne pas additionner les moyennes de lots dont les panels diffèrent. Une donnée manquante ne signifie pas zéro.', 82, 873, 14, 'start', '#466251', 500));
    return out.join('') + '</svg>';
  }
  async function png() {
    const url = URL.createObjectURL(new Blob([svg(bridge.getModel())], {type: 'image/svg+xml;charset=utf-8'}));
    try {
      const img = new Image();
      await new Promise((ok, no) => {img.onload = ok; img.onerror = no; img.src = url;});
      const c = document.createElement('canvas'); c.width = 3840; c.height = 2160;
      c.getContext('2d').drawImage(img, 0, 0, 3840, 2160);
      return await new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(Error('Export PNG impossible')), 'image/png'));
    } finally {URL.revokeObjectURL(url);}
  }
  function importMessage(message, isError = false) {
    const el = document.getElementById('carbonImportMessage');
    if (el) {el.textContent = message; el.classList.toggle('is-error', isError);}
  }
  async function importFile(file) {
    if (!bridge?.isActive()) return;
    importMessage(`Lecture de ${file.name}…`);
    try {
      const imported = await window.OBSCarbonTableImport.readFile(file);
      if (!bridge?.isActive()) return;
      const m = bridge.getModel();
      m.raw = imported.raw;
      m.importSource = imported.source;
      bridge.refresh(true);
      const extra = imported.formulaWarning ? ` Attention : ${imported.formulaWarning}` : '';
      importMessage(`Import réussi : ${imported.parsed.rows.length} bâtiments, ${imported.sourceColumns.length} colonnes utiles.${extra}`);
    } catch(err) {importMessage(err.message || 'Lecture du fichier impossible.', true);}
  }
  function analyzeRaw(raw, source) {
    const parsed = parse(raw);
    if (parsed.error) {importMessage(parsed.error, true);return;}
    const m = bridge.getModel();m.raw = raw;m.importSource = source;
    bridge.refresh(true);
    importMessage(`${parsed.rows.length} bâtiments analysés, ${Object.values(parsed.mapping).filter(v=>v>=0).length} colonnes reconnues.`);
  }
  document.addEventListener('change', e => {
    if (!bridge?.isActive()) return;
    const t = e.target;
    if (t.matches('#carbonFileInput')) {
      const file = t.files?.[0]; t.value = ''; if(file) importFile(file); return;
    }
    if (t.matches('[data-carbon-view]')) {bridge.getModel().view = t.value; bridge.refresh(false); return;}
    if (t.matches('[data-carbon-toggle]')) {
      const m = bridge.getModel(), id = t.dataset.carbonToggle;
      m.enabled = t.checked ? [...new Set([...m.enabled, id])] : m.enabled.filter(v => v !== id);
      bridge.refresh(false);
    }
  });
  document.addEventListener('click', e => {
    if (!bridge?.isActive()) return;
    if (e.target.closest('[data-carbon-dropzone]')) {document.getElementById('carbonFileInput')?.click();return;}
    if (e.target.closest('[data-carbon-apply]')) {analyzeRaw(document.getElementById('obsCarbonPaste').value,'Tableau collé');return;}
    if (e.target.closest('[data-carbon-clear]')) {bridge.getModel().raw = ''; bridge.getModel().importSource = ''; bridge.refresh(true);return;}
    if (e.target.closest('[data-carbon-template]')) {
      const bytes=window.OBSCarbonTableImport.template(),u=URL.createObjectURL(new Blob([bytes],{type:'text/csv;charset=utf-8;'}));
      const a=document.createElement('a');a.href=u;a.download='Modele_Import_Carbone_Obslide.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
    }
  });
  document.addEventListener('keydown', e => {
    if (!bridge?.isActive() || !e.target.closest('[data-carbon-dropzone]')) return;
    if(e.key === 'Enter'||e.key === ' '){e.preventDefault();document.getElementById('carbonFileInput')?.click();}
  });
  // Delegated handlers survive controls re-rendered when indicators are toggled.
  document.addEventListener('dragover', e => {
    const zone=e.target.closest?.('[data-carbon-dropzone]');if(!bridge?.isActive()||!zone)return;
    e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';zone.classList.add('is-dragging');
  });
  document.addEventListener('dragleave', e => {
    const zone=e.target.closest?.('[data-carbon-dropzone]');if(zone && !zone.contains(e.relatedTarget))zone.classList.remove('is-dragging');
  });
  document.addEventListener('drop', e => {
    const zone=e.target.closest?.('[data-carbon-dropzone]');if(!bridge?.isActive()||!zone)return;
    e.preventDefault();zone.classList.remove('is-dragging');
    const file=e.dataTransfer?.files?.[0];
    if(file){importFile(file);return;}
    const raw=e.dataTransfer?.getData('text/plain');if(raw)analyzeRaw(raw,'Tableau déposé');
  });
  document.addEventListener('paste', e => {
    const zone=e.target.closest?.('[data-carbon-dropzone]');if(!bridge?.isActive()||!zone)return;
    const raw=e.clipboardData?.getData('text/plain');if(raw){e.preventDefault();analyzeRaw(raw,'Tableau collé');}
  });
  window.OBSCarbonDistribution = {defaults, configure: b => bridge = b, controls, toolbar, svg, png, summary, parse};
})();
