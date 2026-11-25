/* Modèles de diapositives et import local du bilan consolidé. */
(function () {
  'use strict';

  const FAMILIES = ['BEE+', 'BBCA', 'Biosourcé', 'Effinergie', 'IC Énergie', 'IC Construction', 'Cep', 'Cep,nr', 'Bbio'];
  const SHEETS = [
    ['Bilan général', ['Thématique', 'Indicateur', 'Valeur', 'Lecture']],
    ['Annulations années', ['Année création', 'Contrats', 'Annulés', 'Taux']],
    ['Annulations référentiels', ['Référentiel', 'Contrats', 'Annulés', 'Taux']],
    ['Annulations croisées', ['Année', 'Référentiel', 'Contrats', 'Annulés', 'Taux']],
    ['Familles MOA', ['Famille', 'Contrats', 'Soldés', 'En cours', 'Logements', 'Bâtiments', 'Part contrats']],
    ['Clients', ['Rang', 'Groupe', 'Contrats', 'Soldés', 'En cours', 'Logements', 'Bâtiments', 'Part contrats']],
    ['Clients x MOA', ['Groupe', 'Famille', 'Contrats', 'Soldés', 'En cours', 'Logements', 'Bâtiments']],
    ['Top 25 clients', ['Groupe', 'Contrats', 'Soldés', 'En cours', 'Logements', 'Bâtiments']],
    ['Taille par référentiel', ['Référentiel', 'Opérations', 'N logements', 'Total logements', 'Moy. logements', 'Médiane logements', 'N bâtiments', 'Total bâtiments', 'Moy. bâtiments', 'Médiane bâtiments', 'N surfaces', 'Total m²', 'Moy. m²', 'Médiane m²']],
    ...['logements', 'bâtiments', 'surfaces'].map(name => ['Centiles ' + name, ['Centile']]),
    ['Qualité tailles', ['Indicateur', 'Périmètre', 'Exploitables', 'Part']],
    ['Synthèse certifications', ['Indicateur', 'Valeur']],
    ...['Décisions annuelles', 'Créations annuelles', 'Parts annuelles'].map(name => [name, ['Année', 'Contrats', ...FAMILIES]]),
    ...FAMILIES.map(name => [name, ['Niveau / mention', 'Portefeuille', 'Soldés datés']]),
    ['Mentions AB et AC', ['Colonne', 'Libellé exact', 'Portefeuille', 'Soldés datés']],
    ['Couverture', ['Champ', 'Renseignés', 'Part portefeuille']]
  ];
  const TEMPLATES = [
    { type: 'bilanSummary', label: 'Bilan général de l’Observatoire', slug: 'bilan-general' },
    { type: 'bilanQuality', label: 'Qualité et couverture des données', slug: 'qualite-couverture' }
  ];
  const VARIANTS = ['abandonRate', 'moaVolume', 'certEvolution', 'labels', 'opSize'];
  const TYPES = [...TEMPLATES.map(t => t.type), ...VARIANTS];
  const TITLES = {
    bilanSummary: 'BILAN GÉNÉRAL DE L’OBSERVATOIRE',
    bilanQuality: 'QUALITÉ ET COUVERTURE DES DONNÉES',
    abandonRate: 'ANNULATIONS DE CONTRATS',
    moaVolume: 'PORTEFEUILLE CLIENTS ET FAMILLES DE MOA',
    certEvolution: 'ÉVOLUTION DES CERTIFICATIONS',
    labels: 'LABELS ET NIVEAUX RENSEIGNÉS',
    opSize: 'TAILLE DES OPÉRATIONS'
  };
  const DECK = [
    ['bilanSummary', 'Bilan général'],
    ['abandonRate', 'Bilan · Annulations'],
    ['moaVolume', 'Bilan · Portefeuille'],
    ['certEvolution', 'Bilan · Certifications'],
    ['labels', 'Bilan · Labels et niveaux'],
    ['opSize', 'Bilan · Taille des opérations'],
    ['bilanQuality', 'Bilan · Qualité des données']
  ];
  const defaults = {
    bilanSummary: { bilan: { layout: 'highlights', activity: true, portfolio: true, certification: true, size: true } },
    bilanQuality: { bilan: { view: 'size', layout: 'bars' } },
    abandonRate: { bilan: { enabled: false, view: 'year', unit: 'rate', years: 'auto' } },
    moaVolume: { bilan: { enabled: false, view: 'family', layout: 'auto', measure: 'contracts', status: false, limit: '10', page: 1, family: '' } },
    certEvolution: { bilan: { enabled: false, basis: 'creation', layout: 'curve', years: 'auto', series: 'labels', unit: 'count', detail: '', page: 1, seriesVisible: {} } },
    labels: { bilan: { enabled: false, family: FAMILIES[0], population: 'compare', view: 'bars', layout: 'auto', page: 1 } },
    opSize: { bilan: { enabled: false, measure: 'logements', view: 'curve' } }
  };
  const textDefaults = { subtitle: null, heading: null, introduction: null, note: null };
  const DATE_OPTIONS = [['auto', 'Première année avec une valeur non nulle'], ['all', 'Toutes les années']];
  const palette = ['#07543d', '#3778a5', '#a45b24', '#7160a1', '#278576', '#ad4a59'];
  const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
  const number = value => value == null || value === '' ? null : Number(value);
  const fmt = value => Number.isFinite(number(value)) ? nf.format(number(value)) : '—';
  const percent = value => Number.isFinite(number(value)) ? nf.format(number(value) * 100) + ' %' : '—';
  const total = (rows, index) => rows.reduce((sum, row) => sum + (number(row[index]) || 0), 0);
  const numeric = value => /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value);
  const text = value => String(value ?? '').trim();

  async function importWorkbook(file) {
    if (!/\.xlsx$/i.test(file?.name || '')) throw new Error('Le bilan consolidé doit être un classeur Excel .xlsx (les fichiers CSV ne sont pas acceptés ici).');
    const workbook = await window.OBSNexityXlsx.open(file);
    const sheets = {};
    for (const [name, expected] of SHEETS) {
      const index = workbook.sheets.findIndex(sheet => sheet.name === name);
      if (index < 0) throw new Error(`Feuille manquante : « ${name} ».`);
      const { matrix, formulasWithoutValue } = await workbook.readSheet(index);
      const [first, ...entries] = matrix.filter(row => row?.some(cell => text(cell)));
      if (!first || !entries.length || expected.some((value, col) => text(first[col]) !== value)) {
        throw new Error(`En-têtes ou données illisibles dans « ${name} ».`);
      }
      if (formulasWithoutValue) throw new Error(`Enregistre les résultats des formules dans « ${name} » depuis Excel avant l’import.`);
      const header = Array.from(first, text);
      const textColumns = name === 'Bilan général' || ['Annulations croisées', 'Mentions AB et AC', 'Clients x MOA', 'Synthèse certifications', 'Clients'].includes(name) ? 2 : 1;
      const rows = entries.map(row => Array.from(header, (_, col) => {
        const value = text(row[col]);
        if (!value) return null;
        if (name === 'Clients' && col === 0) return Number(value);
        return col >= textColumns && numeric(value) ? Number(value) : value;
      }));
      if (name === 'Synthèse certifications') for (const row of rows) if (numeric(text(row[1]))) row[1] = Number(row[1]);
      sheets[name] = { header, rows };
    }
    return { name: file.name, sheets };
  }

  const rows = (book, name) => book?.sheets?.[name]?.rows || [];
  const header = (book, name) => book?.sheets?.[name]?.header || [];
  const usesWorkbook = (type, model) => TYPES.includes(type) && (!VARIANTS.includes(type) || model?.bilan?.enabled);
  Object.values(defaults).forEach(model => {
    model.bilan.copy = { ...textDefaults };
    model.bilan.textAlign = 'left';
    model.bilan.textTreatment = 'simple';
    model.bilan.textPosition = 'above';
    model.bilan.canvas = { positions: {}, labels: {}, boxes: [] };
  });

  const config = (type, model) => ({
    ...defaults[type].bilan,
    ...model?.bilan,
    copy: { ...textDefaults, ...model?.bilan?.copy }
  });
  const choice = (value, label) => ({ value, label });
  const choices = entries => entries.map(entry => Array.isArray(entry) ? choice(...entry) : choice(entry, entry));
  const seriesOptions = choices([['contracts', 'Volume de contrats'], ['labels', 'Labels'], ['levels', 'Niveaux énergie et carbone'], ['detail', 'Détail par famille']]);

  function controls(type, model, book, h) {
    const { esc, field, selectField, toggleField } = h;
    const c = config(type, model);
    const p = key => `${type}.bilan.${key}`;
    const select = (label, key, values) => selectField(label, p(key), choices(values));
    const toggle = (label, key) => toggleField(label, p(key));
    let content = VARIANTS.includes(type) ? toggle('Utiliser le bilan Excel', 'enabled') : '';
    if (!usesWorkbook(type, model)) return `<div class="control-section"><h3>Source de la diapositive</h3>${content}</div>`;
    content += book ? `<p class="help">Classeur : ${esc(book.name)}</p>` : '<p class="help">Utilise « Importer le bilan Excel » pour charger les données.</p>';
    const page = () => field('Page du tableau', p('page'), 'number', { min: 1, step: 1 });
    if (type === 'bilanSummary') {
      content += select('Présentation', 'layout', [['highlights', 'Chiffres clés mis en avant'], ['cards', 'Cartes par thème'], ['table', 'Tableaux de synthèse']]);
      content += toggle('Activité et annulations', 'activity') + toggle('Portefeuille', 'portfolio') + toggle('Certifications', 'certification') + toggle('Taille des opérations', 'size');
    }
    if (type === 'bilanQuality') {
      content += select('Présentation', 'layout', [['bars', 'Barres de couverture'], ['table', 'Tableau des effectifs'], ['gaps', 'Écarts à surveiller']]);
      content += select('Indicateurs', 'view', [['size', 'Taille des opérations'], ['coverage', 'Labels et performances']]);
    }
    if (type === 'abandonRate') {
      content += select('Présentation des annulations', 'view', [['year', 'Courbe annuelle'], ['reference', 'Barres par référentiel'], ['matrix', 'Matrice année × référentiel']]);
      content += select('Valeur mise en avant', 'unit', [['rate', 'Taux'], ['count', 'Effectif']]);
      if (c.view === 'year') content += select('Début du graphique', 'years', DATE_OPTIONS);
    }
    if (type === 'moaVolume') {
      content += select('Présentation du portefeuille', 'view', [['family', 'Familles de MOA'], ['top', 'Classement des groupes clients'], ['cross', 'Groupes × familles']]);
      content += select('Mesure', 'measure', [['contracts', 'Contrats'], ['dwellings', 'Logements'], ['buildings', 'Bâtiments']]) + toggle('Afficher Soldés / En cours', 'status');
      content += select('Présentation', 'layout', layoutOptions(c.layout, portfolioLayout(c), [
        ['bars', 'Barres de classement'], ['table', 'Tableau détaillé'], ['cards', 'Cartes de classement']
      ]));
      if (c.view === 'top') content += select('Groupes affichés', 'limit', [['10', 'Top 10'], ['25', 'Top 25']]);
      if (c.view === 'cross') content += select('Famille de MOA', 'family', [['', 'Toutes les familles'], ...rows(book, 'Familles MOA').map(r => r[0])]);
      if (c.view !== 'family' || portfolioLayout(c) === 'cards') content += page();
    }
    if (type === 'certEvolution') {
      content += select('Présentation', 'layout', [['curve', 'Courbes'], ['columns', 'Barres verticales'], ['table', 'Tableau par année']]);
      if (c.layout !== 'table') content += select('Début du graphique', 'years', DATE_OPTIONS);
      content += select('Axe temporel', 'basis', [['creation', 'Année de création'], ['decision', 'Année de décision']]);
      content += selectField('Séries', p('series'), seriesOptions);
      if (c.series !== 'contracts') content += select('Valeur', 'unit', [['count', 'Nombre de contrats'], ['share', 'Part annuelle']]);
      if (c.series === 'detail') content += select('Famille', 'detail', [['', FAMILIES[0]], ...FAMILIES.slice(1)]) + page();
      if (['labels', 'levels'].includes(c.series)) {
        const start = c.series === 'labels' ? 0 : 4;
        content += FAMILIES.slice(start, c.series === 'labels' ? 4 : 9).map((name, i) =>
          toggle(name, `seriesVisible.s${start + i}`)).join('');
      }
    }
    if (type === 'labels') {
      content += select('Famille ou colonne', 'family', [...FAMILIES, ['ab', 'Mentions AB · libellés exacts'], ['ac', 'Performances AC · libellés exacts']]);
      content += select('Périmètre', 'population', [['compare', 'Comparer les deux'], ['portfolio', 'Portefeuille'], ['sold', 'Soldés datés']]);
      content += select('Présentation', 'layout', layoutOptions(c.layout, labelLayout(c), [
        ['bars', 'Barres comparées'], ['table', 'Tableau des niveaux'], ['cards', 'Cartes par niveau']
      ]));
      content += page();
    }
    if (type === 'opSize') {
      content += select('Présentation', 'view', [
        ['housingOverview', 'Logements et bâtiments · vue illustrée'], ['tertiaryOverview', 'Tertiaire : bâtiments et surfaces · vue illustrée'],
        ['simple', 'Un chiffre clé · moyenne'], ['curve', 'Courbe de centiles'],
        ['stats', 'Moyennes et effectifs par référentiel'], ['centiles', 'Tableau détaillé des centiles']
      ]);
      if (!['housingOverview', 'tertiaryOverview'].includes(c.view)) {
        content += select('Mesure de taille', 'measure', [['logements', 'Logements'], ['bâtiments', 'Bâtiments'], ['surfaces', 'Surfaces tertiaires (m²)']]);
      }
    }
    return `<div class="control-section"><h3>Bilan Excel</h3>${content}</div>` + textControls(type, c, book, h);
  }

  function textControls(type, c, book, h) {
    const { esc, selectField } = h;
    const display = book?.sheets ? renders[type](book, c, h) : {};
    const fields = [
      ['title', 'Titre', c.title, TITLES[type], 2],
      ['subtitle', 'Sous-titre', c.copy.subtitle, display.subtitle, 2],
      ['heading', 'Titre du graphique ou du tableau', c.copy.heading, '', 1],
      ['introduction', 'Message à mettre en avant', c.copy.introduction, '', 3],
      ['note', 'Note de lecture et source', c.copy.note, display.note, 3]
    ];
    return `<div class="control-section bilan-text-controls"><h3>Textes sur la diapositive</h3>
      <p class="help">Les champs acceptent les retours à la ligne. Un champ vidé est masqué. « Par défaut » rétablit le texte d’origine.</p>
      ${fields.map(([key, label, value, fallback, lines]) => {
        const id = `bilan-text-${key}`;
        return `<div class="field"><div class="bilan-field-heading"><label for="${id}">${label}</label><button class="btn btn-secondary btn-small" type="button" data-bilan-reset="${key}" aria-label="Rétablir ${label.toLowerCase()}">Par défaut</button></div>
          <textarea id="${id}" data-bilan-text="${key}" rows="${lines}">${esc(value ?? fallback ?? '')}</textarea></div>`;
      }).join('')}
      ${selectField('Style du message', `${type}.bilan.textTreatment`, choices([['simple', 'Texte simple'], ['callout', 'Encadré']]))}
      ${selectField('Alignement des textes ajoutés', `${type}.bilan.textAlign`, choices([['left', 'À gauche'], ['center', 'Centré'], ['right', 'À droite']]))}
      ${selectField('Position du message', `${type}.bilan.textPosition`, choices([['above', 'Au-dessus des données'], ['below', 'Sous les données']]))}
      <p class="help bilan-fit-status" data-bilan-fit-status role="status"></p>
    </div>`;
  }

  function table(h, headers, values, caption = '') {
    const { esc } = h;
    return `<table class="bilan-table">${caption ? `<caption>${esc(caption)}</caption>` : ''}
      <thead><tr>${headers.map(label => `<th scope="col">${esc(label)}</th>`).join('')}</tr></thead>
      <tbody>${values.map(row => `<tr>${row.map((value, index) => {
        const tag = index === 0 ? 'th' : 'td';
        return `<${tag}${index === 0 ? ' scope="row"' : ''}>${esc(value)}</${tag}>`;
      }).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function paginate(items, requested, size) {
    const pages = Math.max(1, Math.ceil(items.length / size));
    const page = Math.max(1, Math.min(pages, Math.trunc(Number(requested)) || 1));
    return { items: items.slice((page - 1) * size, page * size), page, pages, first: (page - 1) * size };
  }
  const pageNote = page => page.pages > 1 ? ` · Page ${page.page} / ${page.pages}` : '';
  const band = (h, entries) => `<div class="bilan-band">${entries.map(([label, value]) =>
    `<div><strong>${h.esc(value)}</strong><span>${h.esc(label)}</span></div>`).join('')}</div>`;
  const legend = (h, entries) => `<div class="bilan-legend">${entries.map((label, i) =>
    `<span><i style="background:${palette[i % palette.length]}"></i><span class="bilan-legend-label">${h.esc(label)}</span></span>`).join('')}</div>`;

  function annualGraph(categories, series, years) {
    if (years === 'all' || !series.length) return { categories, series };
    const start = categories.findIndex((_, index) => series.some(s => {
      const value = number(s.values[index]);
      return Number.isFinite(value) && value !== 0;
    }));
    if (start < 0) return { categories: [], series };
    return { categories: categories.slice(start), series: series.map(s => ({ ...s, values: s.values.slice(start) })) };
  }

  function line(h, categories, series, format = fmt, options = {}) {
    const { esc } = h;
    if (!series.length) return '<p class="bilan-empty">Sélectionne au moins une série.</p>';
    if (!categories.length) return legend(h, series.map(s => s.name)) +
      '<p class="bilan-empty">Aucune valeur non nulle pour les séries affichées.</p>';
    const W = 1400, H = 430, left = 88, right = 35, top = 28, bottom = 55;
    const highest = Math.max(0, ...series.flatMap(s => s.values.map(v => number(v) || 0)));
    const targetStep = (highest || (format === percent ? .04 : 4)) / 4;
    const stepBase = 10 ** Math.floor(Math.log10(targetStep));
    const roundedStep = ([1, 2, 2.5, 5, 10].find(n => n * stepBase >= targetStep) || 10) * stepBase;
    const step = !options.percentiles && format === fmt ? Math.ceil(roundedStep) : roundedStep;
    const max = step * 4;
    const plotWidth = W - left - right;
    const slot = plotWidth / categories.length;
    const x = i => options.columns ? left + slot * (i + .5) : left + plotWidth * (
      options.percentiles ? Number(categories[i].slice(1)) / 100 : categories.length === 1 ? .5 : i / (categories.length - 1)
    );
    const y = v => H - bottom - (H - top - bottom) * v / max;
    const ticks = Array.from({length: 5}, (_, i) => i * step);
    const barWidth = slot * .72 / series.length;
    const labels = series.length === 1 && !options.percentiles && categories.length <= 15;
    return `${legend(h, series.map(s => s.name))}<svg class="bilan-chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${options.percentiles ? 'Courbes des centiles' : 'Graphique par année'}">
      ${ticks.map(value => `<line x1="${left}" x2="${W - right}" y1="${y(value)}" y2="${y(value)}" stroke="#dbe6df"/><text x="${left - 12}" y="${y(value) + 6}" text-anchor="end">${esc(format(value))}</text>`).join('')}
      ${categories.map((label, i) => options.percentiles && !['P1', 'P10', 'P25', 'P50', 'P75', 'P90', 'P99'].includes(label) ? '' : `<text x="${x(i)}" y="${H - 20}" text-anchor="middle">${esc(label)}</text>`).join('')}
      ${series.map((s, i) => {
        const color = palette[i % palette.length];
        const points = s.values.map((v, j) => number(v) == null ? null : [x(j), y(number(v)), v, j]);
        const tooltip = (value, j) => esc(`${s.name} · ${categories[j]} · ${format(value)}`);
        const dataLabels = labels ? points.filter(Boolean).map(([cx, topY, value]) =>
          `<text class="bilan-chart-value" x="${cx}" y="${topY - 11}" text-anchor="middle">${esc(format(value))}</text>`
        ).join('') : '';
        if (options.columns) return points.filter(Boolean).map(([cx, topY, value, j]) =>
          `<rect x="${cx + (i - series.length / 2) * barWidth}" y="${topY}" width="${barWidth * .92}" height="${y(0) - topY}" fill="${color}"><title>${tooltip(value, j)}</title></rect>`
        ).join('') + dataLabels;
        let path = '';
        points.forEach((point, j) => {
          if (point) path += `${points[j - 1] ? 'L' : 'M'}${point[0]},${point[1]} `;
        });
        return `<path d="${path}" fill="none" stroke="${color}" stroke-width="4"/>${points.filter(Boolean).map(([cx, cy, value, j]) =>
          `<circle cx="${cx}" cy="${cy}" r="5" fill="${color}"><title>${tooltip(value, j)}</title></circle>`).join('')}${dataLabels}`;
      }).join('')}</svg>`;
  }

  function bars(h, items, series, format = fmt, scale) {
    if (!items.length) return '<p class="bilan-empty">Aucune donnée pour cette sélection.</p>';
    const max = scale || Math.max(0, ...items.flatMap(item => item.values.map(v => number(v) || 0))) || 1;
    return `${series.length > 1 ? legend(h, series) : ''}<div class="bilan-bars">${items.map(item =>
      `<div class="bilan-bar-row"><strong>${h.esc(item.label)}</strong><div>${item.values.map((value, i) =>
        `<div class="bilan-bar"><div><i style="width:${100 * Math.max(0, number(value) || 0) / max}%;background:${palette[i]}"></i></div><b>${h.esc(format(value))}</b></div>`).join('')}</div>${item.note ? `<small>${h.esc(item.note)}</small>` : ''}</div>`).join('')}</div>`;
  }

  function rankCards(h, items) {
    if (!items.length) return '<p class="bilan-empty">Aucune donnée pour cette sélection.</p>';
    return `<div class="bilan-rank-cards">${items.map(({ label, values, note }) =>
      `<section><h3>${h.esc(label)}</h3><dl>${values.map(([name, value]) =>
        `<div><dt>${h.esc(name)}</dt><dd>${h.esc(value)}</dd></div>`).join('')}</dl>${note ? `<p>${h.esc(note)}</p>` : ''}</section>`).join('')}</div>`;
  }

  function layoutOptions(current, resolved, options) {
    return current === 'auto' ? options.map(([value, label]) => [value === resolved ? 'auto' : value, label]) : options;
  }

  const portfolioLayout = c => c.layout === 'auto' ? (c.view === 'family' && !c.status ? 'bars' : 'table') : c.layout;
  const labelLayout = c => c.layout === 'auto' ? (['ab', 'ac'].includes(c.family) ? 'table' : c.view) : c.layout;

  function summary(book, c, h) {
    const data = rows(book, 'Bilan général');
    const groups = [
      ['activity', 'Activité et annulations', ['Activité', 'Annulations']],
      ['portfolio', 'Portefeuille', ['Portefeuille']],
      ['certification', 'Certifications', ['Certification', 'Labels']],
      ['size', 'Taille des opérations', ['Taille']]
    ];
    const selected = groups.filter(([key]) => c[key]).map(([, heading, themes]) => ({
      heading,
      indicators: data.filter(row => themes.includes(row[0])).map(([, name, value]) =>
        [name, /taux|^part /i.test(name) ? percent(value) : fmt(value)]
      )
    }));
    const featured = [
      ['Taux global', 'Taux d’annulation'],
      ['Groupes clients', 'Groupes clients'],
      ['Soldés avec décision datée', 'Soldés avec décision datée'],
      ['Opérations présumées distinctes', 'Opérations analysées pour les tailles']
    ];
    const highlights = selected.flatMap(group => featured.flatMap(([key, label]) => {
      const match = group.indicators.find(([name]) => name === key);
      return match ? [[label, match[1]]] : [];
    }));
    const useTables = c.layout !== 'cards';
    const cards = selected.map(({heading, indicators}) => {
      const details = c.layout === 'highlights' ? indicators.filter(([name]) => !featured.some(([key]) => key === name)) : indicators;
      return useTables ? table(h, [heading, 'Valeur'], details)
        : `<section class="bilan-summary-card"><h2>${heading}</h2><dl>${details.map(([name, value]) =>
          `<div><dt>${h.esc(name)}</dt><dd>${h.esc(value)}</dd></div>`).join('')}</dl></section>`;
    }).join('');
    return {
      subtitle: 'Activité, portefeuille, certifications et taille des opérations',
      body: cards ? (c.layout === 'highlights' ? band(h, highlights) : '') + `<div class="bilan-summary">${cards}</div>`
        : '<p class="bilan-empty">Sélectionne au moins un bloc dans les paramètres.</p>',
      note: 'Source : base OPERATIONS. Les périmètres sont propres à chaque indicateur. Les cohortes récentes ont moins de recul.'
    };
  }

  function quality(book, c, h) {
    const coverage = c.view === 'coverage';
    const cert = rows(book, 'Synthèse certifications');
    const value = name => cert.find(r => r[0] === name)?.[1];
    const population = value('Contrats soldés ou en cours');
    const indicators = coverage
      ? rows(book, 'Couverture').map(([name, good, share]) => [name, population, good, share])
      : rows(book, 'Qualité tailles');
    const identifiers = indicators.find(r => r[0] === 'Identifiants opérations');
    const missing = identifiers ? number(identifiers[1]) - number(identifiers[2]) : null;
    const headline = coverage
      ? ['Contrats soldés ou en cours', 'Contrats soldés avec décision datée', 'Soldés sans date', 'En cours avec date de décision'].map(name => [name, fmt(value(name))])
      : [['Opérations présumées distinctes', fmt(identifiers?.[1])], ['Opérations sans identifiant', fmt(missing)]];
    let body;
    if (c.layout === 'gaps') {
      const gaps = indicators.filter(([, n, good]) => number(n) > number(good))
        .sort((a, b) => a[3] - b[3]);
      body = table(h, ['Indicateur', 'Non renseignés', 'Périmètre', 'Taux renseigné'],
        gaps.map(([name, n, good, share]) => [name, fmt(n - good), fmt(n), percent(share)]));
    } else if (c.layout === 'table') {
      body = table(h, ['Indicateur', 'Périmètre', 'Renseignés ou exploitables', 'Part'],
        indicators.map(([name, n, good, share]) => [name, fmt(n), fmt(good), percent(share)]));
    } else {
      body = bars(h, indicators.map(([label, n, good, share]) => ({
        label, values: [share], note: `${fmt(good)} / ${fmt(n)}`
      })), ['Part renseignée'], percent, 1);
    }
    return {
      subtitle: coverage ? 'Champs de certification renseignés dans le portefeuille' : 'Effectifs exploitables pour les statistiques de taille',
      body: band(h, headline) + body,
      note: coverage ? 'Champ renseigné ≠ label délivré. Les champs dédiés sont incomplets historiquement.'
        : 'Les zéros sont exclus des statistiques de taille. L’unicité physique reste à confirmer pour les opérations sans identifiant.'
    };
  }

  function cancellations(book, c, h) {
    const annual = rows(book, 'Annulations années');
    const refs = rows(book, 'Annulations référentiels');
    const n = total(annual, 1), cancelled = total(annual, 2);
    const rate = c.unit !== 'count', format = rate ? percent : fmt;
    const metric = rate ? 'Taux d’annulation' : 'Contrats annulés';
    let body = band(h, [['Taux global', percent(cancelled / n)], ['Contrats annulés', fmt(cancelled)], ['Contrats tous statuts', fmt(n)]]);
    if (c.view === 'matrix') {
      const cross = new Map(rows(book, 'Annulations croisées').map(row => [JSON.stringify(row.slice(0, 2)), row]));
      const cells = annual.map(([year]) => [year, ...refs.map(([ref]) => {
        const row = cross.get(JSON.stringify([year, ref]));
        if (!row) return '—';
        const count = `${fmt(row[3])}/${fmt(row[2])}`;
        return rate ? `${format(row[4])} · ${count}` : count;
      })]);
      body += table(h, ['Année', ...refs.map(r => r[0].replace(/^BEE /, ''))], cells);
    } else if (c.view === 'reference') {
      body += bars(h, refs.map(([label, count, done, share]) => ({
        label, values: [rate ? share : done], note: `${fmt(done)} / ${fmt(count)} contrats`
      })), [metric], format);
    } else {
      const points = annual.filter(r => /^\d{4}$/.test(r[0]));
      const graph = annualGraph(points.map(r => r[0]), [{ name: metric, values: points.map(r => r[rate ? 3 : 2]) }], c.years);
      body += line(h, graph.categories, graph.series, format);
    }
    const unknown = annual.find(r => r[0] === 'N.R.');
    return {
      subtitle: metric + ' · tous contrats uniques',
      body,
      note: 'Le taux compte les contrats marqués « annulés ». Les contrats créés récemment ont eu moins de temps pour être annulés.' +
        (unknown ? ` Parmi les ${fmt(unknown[1])} contrats sans année de création renseignée, ${fmt(unknown[2])} ${unknown[2] === 1 ? 'a été annulé' : 'ont été annulés'}.` : '')
    };
  }

  function portfolio(book, c, h) {
    const families = rows(book, 'Familles MOA');
    const clients = rows(book, 'Clients');
    const n = total(clients, 2);
    const concentration = total(rows(book, 'Top 25 clients').slice(0, 10), 1) / n;
    const measure = { contracts: 2, dwellings: 5, buildings: 6 }[c.measure] ?? 2;
    const unit = {2: 'Contrats', 5: 'Logements', 6: 'Bâtiments'}[measure];
    const values = c.view === 'family' ? families.map(r => [null, r[0], ...r.slice(1)])
      : c.view === 'cross' ? rows(book, 'Clients x MOA').filter(r => !c.family || r[1] === c.family)
      : clients;
    const sorted = [...values].sort((a, b) => (number(b[measure]) || 0) - (number(a[measure]) || 0));
    const top = c.view === 'top' ? sorted.slice(0, c.limit === '25' ? 25 : 10) : sorted;
    const layout = portfolioLayout(c);
    const page = paginate(top, c.page, layout === 'cards' ? 6 : c.view === 'family' ? 11 : 10);
    const headers = [c.view === 'family' ? 'Famille de MOA' : 'Groupe client'];
    if (c.view === 'cross') headers.push('Famille de MOA');
    headers.push(unit);
    if (c.status) headers.push('Contrats soldés', 'Contrats en cours');
    headers.push(`Part ${unit.toLowerCase()}`);
    const denominator = total(clients, measure);
    const itemName = row => c.view === 'cross' ? row[0] : row[1];
    const share = row => percent(denominator ? row[measure] / denominator : null);
    const counts = row => c.status ? [fmt(row[3]), fmt(row[4])] : [];
    const details = row => [
      ...(c.view === 'cross' ? [row[1]] : []),
      share(row),
      ...(c.status ? [`${fmt(row[3])} soldés · ${fmt(row[4])} en cours`] : [])
    ].join(' · ');
    let body;
    if (layout === 'bars') {
      body = bars(h, page.items.map(row => ({
        label: itemName(row), values: [row[measure]], note: details(row)
      })), [unit]);
    } else if (layout === 'cards') {
      body = rankCards(h, page.items.map(row => ({
        label: itemName(row), values: [[unit, fmt(row[measure])]], note: details(row)
      })));
    } else {
      body = table(h, headers, page.items.map(row =>
        [itemName(row), ...(c.view === 'cross' ? [row[1]] : []), fmt(row[measure]), ...counts(row), share(row)]));
    }
    return {
      subtitle: 'Contrats soldés ou en cours · ' + (c.view === 'cross' ? 'Groupes × familles' : c.view === 'top' ? `Top ${c.limit} par ${unit.toLowerCase()}` : 'Familles de maîtres d’ouvrage'),
      body: band(h, [['Contrats du portefeuille', fmt(n)], ['Groupes clients', fmt(clients.length)], ['Part des 10 premiers groupes en contrats', percent(concentration)]]) +
        body,
      note: 'Parts calculées sur le portefeuille complet.' + pageNote(page)
    };
  }

  function evolution(book, c, h) {
    const decision = c.basis === 'decision';
    const sheet = decision ? 'Décisions annuelles' : 'Créations annuelles';
    const annual = rows(book, sheet);
    const dated = annual.filter(r => /^\d{4}$/.test(r[0]));
    const share = c.unit === 'share' && c.series !== 'contracts';
    const denominator = new Map(annual.map(r => [r[0], r[1]]));
    const valueFor = (value, year) => share ? (denominator.get(year) && number(value) != null ? number(value) / denominator.get(year) : null) : value;
    const categories = dated.map(r => r[0]);
    let series, extra = '';
    if (c.series === 'detail') {
      const family = c.detail || FAMILIES[0];
      const columns = header(book, family);
      const indices = categories.map(year => columns.indexOf(`${decision ? 'Décision' : 'Création'} ${year}`));
      const detail = rows(book, family);
      const page = paginate(detail, c.page, 6);
      series = page.items.map(r => ({ name: r[0], values: indices.map((i, j) => i < 0 ? null : valueFor(r[i], categories[j])) }));
      extra = pageNote(page);
    } else {
      const source = share && !decision ? new Map(rows(book, 'Parts annuelles').map(r => [r[0], r])) : null;
      const columns = c.series === 'contracts' ? [1] : (c.series === 'levels' ? [6, 7, 8, 9, 10] : [2, 3, 4, 5])
        .filter(col => c.seriesVisible?.[`s${col - 2}`] !== false);
      series = columns.map(col => ({ name: header(book, sheet)[col], values: dated.map(r =>
        source ? source.get(r[0])?.[col] : valueFor(r[col], r[0])) }));
    }
    const population = decision ? 'Contrats soldés avec décision datée' : 'Contrats du portefeuille';
    const missing = annual.find(r => r[0] === 'N.R.');
    const format = share ? percent : fmt;
    const graph = annualGraph(categories, series, c.years);
    const body = c.layout === 'table' && series.length
      ? table(h, ['Année', ...series.map(s => s.name)], categories.map((year, i) => [year, ...series.map(s => format(s.values[i]))]))
      : line(h, graph.categories, graph.series, format, { columns: c.layout === 'columns' });
    return {
      subtitle: `${population} · année de ${decision ? 'décision' : 'création'} · ${share ? 'part annuelle' : 'effectifs'}`,
      body: band(h, [[population, fmt(total(annual, 1))]]) + body,
      note: (decision ? 'Date de décision AG, puis AI si AG est vide. ' : '') +
        (missing ? `${fmt(missing[1])} contrats sans année de création. ` : '') +
        '2026 potentiellement incomplète. Champ renseigné ≠ label délivré.' + extra
    };
  }

  function labels(book, c, h) {
    const exact = ['ab', 'ac'].includes(c.family);
    const values = exact ? rows(book, 'Mentions AB et AC').filter(r => r[0] === c.family.toUpperCase()).map(r => r.slice(1))
      : rows(book, c.family);
    const columns = c.population === 'compare' ? [1, 2] : c.population === 'sold' ? [2] : [1];
    const headers = columns.map(index => index === 1 ? 'Portefeuille' : 'Soldés datés');
    const layout = labelLayout(c);
    const page = paginate(values, c.page, layout === 'cards' ? 6 : layout === 'bars' ? 7 : 12);
    let body;
    if (layout === 'bars') body = bars(h, page.items.map(row => ({ label: row[0], values: columns.map(i => row[i]) })), headers);
    else if (layout === 'cards') body = rankCards(h, page.items.map(row => ({
      label: row[0], values: columns.map((i, j) => [headers[j], fmt(row[i])])
    })));
    else body = table(h, ['Niveau / mention', ...headers], page.items.map(row => [row[0], ...columns.map(i => fmt(row[i]))]));
    const subject = exact ? `Colonne ${c.family.toUpperCase()} · libellés exacts` : `${c.family} · répartition des niveaux`;
    return {
      subtitle: `${subject} · ${headers.join(' et ')}`,
      body,
      note: 'Effectifs par contrat et par libellé. Plusieurs mentions peuvent coexister. Champ renseigné ≠ label délivré.' + pageNote(page)
    };
  }

  const sizeMetrics = {
    logements: { label: 'Logements', unit: 'logements', segment: 'Logement', index: 2, scope: 'opérations résidentielles', singular: 'opération résidentielle' },
    bâtiments: { label: 'Bâtiments', unit: 'bâtiments', segment: 'Global', index: 6, scope: 'opérations tous référentiels', singular: 'opération' },
    bâtimentsTertiaire: { label: 'Bâtiments', unit: 'bâtiments', segment: 'Tertiaire', index: 6, scope: 'opérations tertiaires', singular: 'opération tertiaire' },
    surfaces: { label: 'Surface tertiaire', unit: 'm²', segment: 'Tertiaire', index: 10, scope: 'opérations tertiaires', singular: 'opération tertiaire' }
  };
  const sizeSource = 'Source : bilan Excel, feuille « Taille par référentiel ». Valeurs strictement positives.';
  function sizeStatistics(book, metric) {
    const row = rows(book, 'Taille par référentiel').find(values => text(values[0]).toLowerCase() === metric.segment.toLowerCase());
    return { base: number(row?.[1]), count: number(row?.[metric.index]), mean: number(row?.[metric.index + 2]), median: number(row?.[metric.index + 3]) };
  }

  function sizeKeyFigure(book, measure, h) {
    const metric = sizeMetrics[measure] || sizeMetrics.logements;
    const { count, mean } = sizeStatistics(book, metric);
    const body = Number.isFinite(count) && count > 0 && Number.isFinite(mean) && mean > 0
      ? `<div class="bilan-size-summary">
          <p class="an-summary-caption">En moyenne par opération</p>
          <p class="an-summary-number">${fmt(mean)}</p>
          <p class="an-summary-unit">${h.esc(mean === 1 && metric.unit !== 'm²' ? metric.unit.slice(0, -1) : metric.unit)}</p>
          <p class="bilan-size-scope">Moyenne calculée sur ${fmt(count)} ${h.esc(count === 1 ? metric.singular : metric.scope)} avec une valeur renseignée.</p>
        </div>`
      : '<p class="bilan-empty">La moyenne de ce périmètre est indisponible dans le classeur importé.</p>';
    return { subtitle: metric.label + ' · bilan Excel', body, note: sizeSource };
  }

  function illustratedSize(book, tertiary, h) {
    const metrics = tertiary ? [sizeMetrics.bâtimentsTertiaire, sizeMetrics.surfaces] : [sizeMetrics.logements, sizeMetrics.bâtiments];
    const illustration = tertiary ? 'assets/bilan-tertiaire.png' : 'assets/bilan-residentiel.png';
    const alt = tertiary ? 'Dessin en coupe d’un bâtiment de bureaux' : 'Dessin en coupe d’un immeuble de logements';
    const cards = metrics.map(metric => {
      const { base, count, mean, median } = sizeStatistics(book, metric);
      const counts = count === 1 ? ' valeur exploitable' : ' valeurs exploitables';
      const scope = !Number.isFinite(count) ? 'Effectif exploitable indisponible' :
        Number.isFinite(base) && base > 0
          ? fmt(count) + counts + ' sur ' + fmt(base) + ' ' + (base === 1 ? metric.singular : metric.scope)
          : fmt(count) + counts + ' · ' + metric.scope;
      return `<article class="bilan-size-metric">
        <h3>${h.esc(metric.label)} <span>${metric.unit === 'm²' ? 'm² par opération' : 'par opération'}</span></h3>
        <dl><div><dt>Moyenne</dt><dd>${fmt(mean)}</dd></div><div><dt>Médiane</dt><dd>${fmt(median)}</dd></div></dl>
        <p>${h.esc(scope)}</p>
      </article>`;
    }).join('');
    const subtitle = tertiary ? 'Périmètre tertiaire · bâtiments et surfaces' : 'Logements et bâtiments par opération';
    return {
      subtitle,
      body: `<div class="bilan-size-overview"><div class="bilan-size-illustration"><img src="${illustration}" alt="${h.esc(alt)}"></div>
        <div class="bilan-size-metrics">${cards}</div></div>`,
      note: sizeSource
    };
  }

  function size(book, c, h) {
    if (c.view === 'housingOverview' || c.view === 'tertiaryOverview') return illustratedSize(book, c.view === 'tertiaryOverview', h);
    if (c.view === 'simple') return sizeKeyFigure(book, c.measure, h);
    const sheet = 'Centiles ' + c.measure;
    const centiles = rows(book, sheet);
    const names = header(book, sheet).slice(1).map(name => name.replace(/^BEE /, ''));
    const selected = c.measure === 'logements' ? 2 : c.measure === 'bâtiments' ? 6 : 10;
    const all = rows(book, 'Taille par référentiel');
    const relevant = all.filter(r => number(r[selected]) > 0 && (selected !== 10 || /Tertiaire/.test(r[0])));
    const unit = c.measure === 'surfaces' ? 'Surfaces tertiaires (m²)' : c.measure[0].toUpperCase() + c.measure.slice(1);
    let body;
    if (c.view === 'stats') {
      body = table(h, ['Référentiel', 'Opérations', 'Effectif exploitable', 'Total', 'Moyenne', 'Médiane'],
        relevant.map(r => [r[0], fmt(r[1]), ...r.slice(selected, selected + 4).map(fmt)]));
    } else if (c.view === 'centiles') {
      body = table(h, ['Centile', ...names], centiles.map(r => [r[0], ...r.slice(1).map(fmt)]));
    } else {
      const points = centiles.filter(r => /^P\d+$/.test(r[0]));
      body = line(h, points.map(r => r[0]), names.map((name, i) => ({ name, values: points.map(r => r[i + 1]) })), fmt, { percentiles: true });
    }
    return {
      subtitle: `${unit} · comparaison par référentiel`, body,
      note: 'Les statistiques utilisent les valeurs strictement positives. P50 correspond à la médiane.'
    };
  }

  const renders = { bilanSummary: summary, bilanQuality: quality, abandonRate: cancellations, moaVolume: portfolio, certEvolution: evolution, labels, opSize: size };
  function html(type, model, book, h) {
    const c = config(type, model);
    const title = c.title ?? TITLES[type];
    const display = book?.sheets ? renders[type](book, c, h)
      : { subtitle: 'Données du bilan consolidé', body: '<p class="bilan-empty">Importe le bilan Excel pour afficher cette diapositive.</p>' };
    const alignment = ['center', 'right'].includes(c.textAlign) ? c.textAlign : 'left';
    const treatment = c.textTreatment === 'callout' ? 'bilan-intro-callout' : '';
    const note = c.copy.note ?? display.note;
    const message = c.copy.introduction?.trim() ? `<p class="bilan-intro ${treatment}">${h.esc(c.copy.introduction)}</p>` : '';
    return h.head(title, c.copy.subtitle ?? display.subtitle) + `<div class="bilan-content bilan-text-${alignment}">
      ${c.textPosition === 'below' ? '' : message}
      ${c.copy.heading?.trim() ? `<h2 class="bilan-content-heading">${h.esc(c.copy.heading)}</h2>` : ''}
      <div class="bilan-figure">${display.body}</div>
      ${c.textPosition === 'below' ? message : ''}
      ${note?.trim() ? `<p class="bilan-note">${h.esc(note)}</p>` : ''}</div>`;
  }

  window.OBSBilan = { TEMPLATES, TYPES, DECK, defaults, usesWorkbook, importWorkbook, controls, html };
})();
