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
    { type: 'bilanQuality', label: 'Qualité et couverture des données', slug: 'qualite-couverture' },
    { type: 'annulThemes', label: 'Annulations par année et par thème', slug: 'annulations-annees-themes', family: 'Activité et annulations' },
    { type: 'annulContracts', label: 'Annulations · doublons, fusions et remplacements', slug: 'annulations-doublons-fusions', family: 'Activité et annulations' },
    { type: 'annulCertifier', label: 'Annulations · changements de certificateur', slug: 'annulations-changement-certificateur', family: 'Activité et annulations' },
    { type: 'annulReasons', label: 'Évolution des raisons déclarées', slug: 'evolution-raisons-declarees', family: 'Activité et annulations' }
  ];
  // Diapositives d'analyse des annulations : données collées depuis Excel (onglet « Annulation »), sans classeur du bilan.
  const ANNUL = ['annulThemes', 'annulContracts', 'annulCertifier', 'annulReasons'];
  const VARIANTS = ['abandonRate', 'moaVolume', 'certEvolution', 'labels', 'opSize'];
  const TYPES = [...TEMPLATES.map(t => t.type), ...VARIANTS];
  const TITLES = {
    bilanSummary: 'BILAN GÉNÉRAL DE L’OBSERVATOIRE',
    bilanQuality: 'QUALITÉ ET COUVERTURE DES DONNÉES',
    abandonRate: 'ANNULATIONS DE CONTRATS',
    moaVolume: 'PORTEFEUILLE CLIENTS ET FAMILLES DE MOA',
    certEvolution: 'ÉVOLUTION DES CERTIFICATIONS',
    labels: 'LABELS ET NIVEAUX RENSEIGNÉS',
    opSize: 'TAILLE DES OPÉRATIONS',
    annulThemes: 'ANNULATIONS PAR ANNÉE ET PAR THÈME',
    annulContracts: 'DOUBLONS, FUSIONS ET REMPLACEMENTS',
    annulCertifier: 'CHANGEMENTS DE CERTIFICATEUR',
    annulReasons: 'ÉVOLUTION DES RAISONS DÉCLARÉES'
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
    opSize: { bilan: { enabled: false, measure: 'logements', view: 'curve' } },
    annulThemes: { bilan: { paste: '', data: null } },
    annulContracts: { bilan: { paste: '', data: null } },
    annulCertifier: { bilan: { paste: '', data: null } },
    annulReasons: { bilan: { paste: '', data: null } }
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
      const sheet = sheetFrom(name, expected, matrix);
      if (formulasWithoutValue) throw new Error(`Enregistre les résultats des formules dans « ${name} » depuis Excel avant l’import.`);
      sheets[name] = sheet;
    }
    return { name: file.name, sheets };
  }
  // contrôle et lecture d'une feuille (classeur importé ou tableau collé)
  function sheetFrom(name, expected, matrix) {
      const [first, ...entries] = matrix.filter(row => row?.some(cell => text(cell)));
      if (!first || !entries.length || expected.some((value, col) => text(first[col]) !== value)) {
        throw new Error(`En-têtes ou données illisibles dans « ${name} ».`);
      }
      const header = Array.from(first, text);
      const textColumns = name === 'Bilan général' || ['Annulations croisées', 'Mentions AB et AC', 'Clients x MOA', 'Synthèse certifications', 'Clients'].includes(name) ? 2 : 1;
      const rows = entries.map(row => Array.from(header, (_, col) => {
        const value = text(row[col]);
        if (!value) return null;
        if (name === 'Clients' && col === 0) return Number(value);
        return col >= textColumns && numeric(value) ? Number(value) : value;
      }));
      if (name === 'Synthèse certifications') for (const row of rows) if (numeric(text(row[1]))) row[1] = Number(row[1]);
      return { header, rows };
  }
  // onglets du bilan lus par chaque diapositive (proposés en premier au collage)
  const SHEETS_FOR = {
    bilanSummary: ['Bilan général'],
    bilanQuality: ['Qualité tailles', 'Couverture'],
    abandonRate: ['Annulations années', 'Annulations référentiels', 'Annulations croisées'],
    moaVolume: ['Familles MOA', 'Clients', 'Clients x MOA', 'Top 25 clients'],
    certEvolution: ['Synthèse certifications', 'Décisions annuelles', 'Créations annuelles', 'Parts annuelles', ...FAMILIES],
    labels: [...FAMILIES, 'Mentions AB et AC'],
    opSize: ['Taille par référentiel', 'Centiles logements', 'Centiles bâtiments', 'Centiles surfaces']
  };
  // cellule copiée depuis Excel (format français) → valeur telle que lue dans le classeur : « 1 234,5 » → 1234.5 ; « 12,3 % » → 0.123
  function pastedCell(value) {
    const v = text(value).replace(/[\s\u00a0\u202f]/g, '');
    const pc = /^(-?\d+(?:[.,]\d+)?)%$/.exec(v);
    if (pc) return String(Number(pc[1].replace(',', '.')) / 100);
    return /^-?\d+(?:[.,]\d+)?$/.test(v) ? v.replace(',', '.') : text(value);
  }
  // collage d'un onglet du bilan copié depuis Excel : remplace cet onglet, les autres onglets du bilan affiché sont conservés
  function pasteSheet(book, name, raw) {
    const def = SHEETS.find(s => s[0] === name);
    if (!def) throw new Error(`Onglet inconnu : « ${name} ».`);
    const grid = tsv(raw).map(row => row.map(pastedCell));
    if (!grid.length) throw new Error('Colle d’abord le tableau copié depuis Excel.');
    const expected = def[1], first = grid[0] || [];
    const hasHeader = expected.every((value, col) => text(first[col]) === value);
    if (!hasHeader) {
      if (expected.length < 2 || /^Centiles /.test(name)) throw new Error(`Copie aussi la ligne d’en-têtes de l’onglet « ${name} » (${expected.join(' ⇥ ')}…).`);
      if (first.length < expected.length) throw new Error(`Colonnes attendues pour « ${name} » : ${expected.join(' ⇥ ')}.`);
      grid.unshift([...expected, ...first.slice(expected.length).map((_, i) => 'Colonne ' + (expected.length + i + 1))]);
    }
    const sheet = sheetFrom(name, expected, grid);
    return { name: book?.name || 'Tableaux collés', sheets: { ...(book?.sheets || {}), [name]: sheet }, pasted: { ...(book?.pasted || {}), [name]: sheet.rows.length } };
  }
  // onglets réellement lus par le graphique avec les réglages actuels (le premier est proposé par défaut au collage)
  function readSheets(type, c) {
    if (type === 'certEvolution') {
      const annual = c.basis === 'decision' ? 'Décisions annuelles' : 'Créations annuelles';
      if (c.series === 'detail') return [c.detail || FAMILIES[0], annual];
      return c.unit === 'share' && c.series !== 'contracts' && c.basis !== 'decision' ? [annual, 'Parts annuelles'] : [annual];
    }
    if (type === 'abandonRate') return [{ year: 'Annulations années', reference: 'Annulations référentiels', matrix: 'Annulations croisées' }[c.view] || 'Annulations années'];
    if (type === 'opSize') return ['Taille par référentiel', ...(['curve', 'centiles'].includes(c.view) ? ['Centiles ' + (c.measure || 'logements')] : [])];
    return SHEETS_FOR[type] || [];
  }
  // après un collage : aligne les réglages du graphique sur l'onglet collé, ou explique pourquoi il n'est pas lu
  function alignToSheet(type, b, sheet) {
    if (type === 'certEvolution') {
      if (sheet === 'Créations annuelles' && b.basis === 'decision') { b.basis = 'creation'; if (b.series === 'detail') b.series = 'labels'; return 'Axe temporel passé en « année de création » pour afficher ce tableau.'; }
      if (sheet === 'Décisions annuelles' && b.basis !== 'decision') { b.basis = 'decision'; return 'Axe temporel passé en « année de décision » pour afficher ce tableau.'; }
      if (sheet === 'Parts annuelles') { const m = []; if (b.basis === 'decision') { b.basis = 'creation'; m.push('axe « année de création »'); } if (b.unit !== 'share') { b.unit = 'share'; m.push('valeur « part annuelle »'); } if (b.series === 'contracts' || b.series === 'detail') { b.series = 'labels'; m.push('séries « Labels »'); } return m.length ? `Réglages adaptés pour afficher ce tableau : ${m.join(', ')}.` : ''; }
      if (FAMILIES.includes(sheet)) { b.series = 'detail'; b.detail = sheet; b.page = 1; return `Séries passées en « Détail par famille » (${sheet}).`; }
    }
    const read = readSheets(type, { ...(defaults[type]?.bilan || {}), ...b });
    return read.includes(sheet) ? '' : `Tableau enregistré, mais le graphique ne lit pas cet onglet avec les réglages actuels : il lit « ${read.join(' », « ')} ».`;
  }
  function sheetPasteControls(type, c, book, h) {
    const read = readSheets(type, c), mine = [...new Set([...read, ...(SHEETS_FOR[type] || [])])], others = SHEETS.map(s => s[0]).filter(n => !mine.includes(n));
    const cur = c.pasteSheet && SHEETS.some(s => s[0] === c.pasteSheet) ? c.pasteSheet : read[0] || mine[0];
    const exp = (SHEETS.find(s => s[0] === cur) || [, []])[1];
    const opt = n => `<option value="${h.esc(n)}"${n === cur ? ' selected' : ''}>${h.esc(n)}${book?.sheets?.[n] ? (book.pasted?.[n] != null ? ' · collé' : ' · classeur') : ' · absent'}</option>`;
    return `<div class="control-section bilan-paste"><h3>Coller un tableau Excel</h3>
      <p class="help">Copie l’onglet dans Excel (en-têtes compris) et colle-le ici : il remplace cet onglet du bilan, sans réimporter le classeur. La diapositive est recalculée dès le collage.</p>
      <div class="field"><label>Onglet du bilan</label><select data-bilan-paste-sheet="${type}"><optgroup label="Lus par le graphique (réglages actuels)">${read.map(opt).join('')}</optgroup>${mine.length > read.length ? `<optgroup label="Autres onglets de cette diapositive">${mine.filter(n => !read.includes(n)).map(opt).join('')}</optgroup>` : ''}<optgroup label="Autres onglets">${others.map(opt).join('')}</optgroup></select></div>
      <div class="field"><textarea rows="7" data-bilan-paste="${type}" placeholder="${h.esc(exp.join('\t'))}">${h.esc(c.pasteText || '')}</textarea></div>
      <div class="evolution-import-actions"><button type="button" class="btn btn-primary" data-bilan-paste-apply="${type}">Appliquer le tableau</button></div>
      <p class="help" data-bilan-paste-status role="status"></p></div>`;
  }

  const rows = (book, name) => book?.sheets?.[name]?.rows || [];
  const header = (book, name) => book?.sheets?.[name]?.header || [];
  const usesWorkbook = (type, model) => TYPES.includes(type) && (!VARIANTS.includes(type) || model?.bilan?.enabled);
  const ownData = type => ANNUL.includes(type);
  Object.values(defaults).forEach(model => {
    model.bilan.copy = { ...textDefaults };
    model.bilan.textAlign = 'left';
    model.bilan.textTreatment = 'simple';
    model.bilan.textPosition = 'above';
    model.bilan.canvas = { positions: {}, labels: {}, boxes: [] };
  });

  // les diapositives des annulations s'ouvrent avec un message encadré placé sous les données
  ANNUL.forEach(type => Object.assign(defaults[type].bilan, { textTreatment: 'callout', textPosition: 'below' }));
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
    const paste = SHEETS_FOR[type] ? sheetPasteControls(type, c, book, h) : '';
    if (!usesWorkbook(type, model)) return `<div class="control-section"><h3>Source de la diapositive</h3>${content}</div>${paste}`;
    if (ownData(type)) return annulControls(type, c, h) + textControls(type, c, book, h);
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
    return `<div class="control-section"><h3>Bilan Excel</h3>${content}</div>` + paste + textControls(type, c, book, h);
  }

  function textControls(type, c, book, h) {
    const { esc, selectField } = h;
    const display = book?.sheets || ownData(type) ? renders[type](book, c, h) : {};
    const fields = [
      ['title', 'Titre', c.title, TITLES[type], 2],
      ['subtitle', 'Sous-titre', c.copy.subtitle, display.subtitle, 2],
      ['heading', 'Titre du graphique ou du tableau', c.copy.heading, '', 1],
      ['introduction', 'Message à mettre en avant', c.copy.introduction, display.introduction, 3],
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


  // ---------- Annulations (onglet « Annulation ») ----------
  // Valeurs de référence : export de l'onglet du 25/11/2026 (colonnes H thème, N date de demande, O sous-motif, P statut).
  const ANNUL_YEARS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const ANNUL_COLORS = ['#07543d', '#3778a5', '#d1842a', '#7160a1', '#2a9d8f', '#c0485a', '#8a6a3b', '#6aa84f', '#d36fb0', '#4b5563', '#e2b007'];
  const ANNUL_DEFAULT = {
    annulThemes: {
      years: ANNUL_YEARS, asOf: '25 novembre',
      totals: { 2020: 5, 2021: 10, 2022: 27, 2023: 112, 2024: 140, 2025: 130, 2026: 112, 'Sans date': 89 },
      themes: [
        ['Permis, recours ou décision publique', [0, 0, 3, 6, 13, 8, 13]],
        ['Changement de programme ou de périmètre', [2, 3, 1, 5, 6, 8, 9]],
        ['Niveau ou exigence technique non atteint', [0, 1, 3, 3, 14, 4, 5]],
        ['Budget, financement ou intérêt fiscal', [0, 1, 2, 3, 8, 10, 2]],
        ['Certification devenue inutile ou attestation suffisante', [1, 0, 4, 2, 1, 5, 6]],
        ['Changement de label ou de certificateur', [0, 0, 2, 5, 1, 3, 4]],
        ['Relances, pièces manquantes ou calendrier', [0, 0, 1, 1, 1, 3, 9]],
        ['Commercialisation, acquéreur ou bailleur', [0, 0, 1, 0, 3, 3, 5]],
        ['Liquidation ou radiation', [0, 0, 0, 1, 0, 1, 1]],
        ['Appel d’offres ou entreprises introuvables', [0, 0, 0, 1, 2, 0, 0]],
        ['Travaux refusés', [0, 0, 0, 0, 0, 1, 0]]
      ],
      excluded: { vague: 387, gestion: 32, undated: 5 }
    },
    annulContracts: { rows: [
      ['Doublon', 12, 'Deux contrats cités comme référence figurent eux aussi dans l’export des annulations.'],
      ['Erreur d’affectation', 1, 'Le contrat a été affecté à la mauvaise opération.'],
      ['Fusion de contrats', 9, 'Huit dossiers précisent le rattachement, dont quatre vers OPE-006175.'],
      ['Nouveau contrat ou périmètre repris', 7, 'Six lignes mentionnent un nouveau contrat. Une ligne rattache le périmètre à un autre contrat.'],
      ['Remplacement ou transfert envisagé', 3, 'La mise en œuvre reste à vérifier.']
    ] },
    annulCertifier: { rows: [['Changement confirmé', 3], ['Client déjà engagé ailleurs', 1], ['À vérifier', 11], ['Autre motif documenté', 3]] },
    annulReasons: { years: ANNUL_YEARS, rows: [
      ['Montage financier infructueux', [0, 5, 6, 29, 41, 66, 27]],
      ['Impossibilité d’atteindre le ou les niveaux visés', [2, 3, 11, 42, 57, 30, 35]],
      ['Raison non renseignée', [1, 1, 1, 22, 21, 17, 32]],
      ['Refus de permis de construire', [1, 0, 3, 7, 15, 7, 8]],
      ['Changement de certificateur', [0, 0, 2, 4, 3, 3, 3]],
      ['Acquéreur VEFA se retire du projet', [1, 0, 4, 2, 0, 1, 3]],
      ['Changement location vers accession', [0, 1, 0, 2, 0, 2, 2]],
      ['Recours sur permis de construire', [0, 0, 0, 0, 1, 1, 2]],
      ['Faillite de la société', [0, 0, 0, 1, 0, 2, 0]],
      ['Appel d’offres infructueux', [0, 0, 0, 1, 1, 1, 0]],
      ['Fusion de société', [0, 0, 0, 1, 1, 0, 0]],
      ['Erreur de lecture du cahier de l’aménageur', [0, 0, 0, 1, 0, 0, 0]]
    ] }
  };
  const annulData = (type, c) => c.data || ANNUL_DEFAULT[type];
  const toNumber = value => { const v = text(value).replace(/[\s  ]/g, '').replace(',', '.'); return /^-?\d+(?:\.\d+)?$/.test(v) ? Number(v) : null; };
  // tableau copié depuis Excel / Google Sheets : tabulations, cellules entre guillemets (retours à la ligne internes)
  function tsv(raw) {
    if (!/\t/.test(String(raw || ''))) return String(raw || '').replace(/\r\n?/g, '\n').split('\n').map(l => l.trim().split(/\s{2,}/).map(c => c.trim())).filter(r => r.some(Boolean));
    const out = []; let row = [], cell = '', quoted = false; const src = String(raw || '').replace(/\r\n?/g, '\n');
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (quoted) { if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch; continue; }
      if (ch === '"' && cell === '') { quoted = true; continue; }
      if (ch === '\t') { row.push(cell.trim()); cell = ''; continue; }
      if (ch === '\n') { row.push(cell.trim()); out.push(row); row = []; cell = ''; continue; }
      cell += ch;
    }
    row.push(cell.trim()); out.push(row);
    return out.filter(r => r.some(Boolean));
  }
  function yearOf(value) {
    const v = text(value); let m;
    if ((m = /^(\d{4})-\d{2}-\d{2}/.exec(v))) return m[1];
    if ((m = /^\d{1,2}\/\d{1,2}\/(\d{4})/.exec(v))) return m[1];
    if (/^\d{5}(?:[.,]\d+)?$/.test(v)) return String(new Date(Date.UTC(1899, 11, 30) + Number(v.replace(',', '.')) * 864e5).getUTCFullYear());
    if ((m = /\b(20\d{2})\b/.exec(v))) return m[1];
    return null;
  }
  const VAGUE = /d[ée]tail vide|insuffisant|cause non pr[ée]cis[ée]e|sans cause pr[ée]cis[ée]e/i, CONTRACT = /^doublon|fusion|remplacement de contrat/i;
  const themeName = t => /plus n[ée]cessaire/i.test(t) ? 'Certification devenue inutile ou attestation suffisante' : t;
  // lignes de l'onglet source (une ligne par contrat) : thème en colonne H, date de demande en N, sous-motif en O, statut en P
  function fromSource(rows) {
    const head = rows[0].map(norm => norm.toLowerCase());
    const find = (re, fallback) => { const i = head.findIndex(x => re.test(x)); return i >= 0 ? i : fallback; };
    const iT = find(/motif tir|th[eè]me/, 7), iD = find(/date de demande/, 13), iO = find(/sous-motif/, 14), iP = find(/statut du changement|changement de certificateur/, 15);
    const lines = rows.slice(1).filter(r => text(r[iT]) || text(r[1]));
    const totals = {}, series = new Map(), excluded = { vague: 0, gestion: 0, undated: 0 }, subs = new Map(), statuses = new Map();
    for (const r of lines) {
      const y = yearOf(r[iD]), key = y && Number(y) >= 2000 ? y : 'Sans date', theme = themeName(text(r[iT]));
      totals[key] = (totals[key] || 0) + 1;
      if (text(r[iO])) subs.set(text(r[iO]), (subs.get(text(r[iO])) || 0) + 1);
      if (text(r[iP])) statuses.set(text(r[iP]), (statuses.get(text(r[iP])) || 0) + 1);
      if (!theme || VAGUE.test(theme)) { excluded.vague++; continue; }
      if (CONTRACT.test(theme)) { excluded.gestion++; continue; }
      if (key === 'Sans date') { excluded.undated++; continue; }
      if (!series.has(theme)) series.set(theme, {});
      series.get(theme)[key] = (series.get(theme)[key] || 0) + 1;
    }
    const years = Object.keys(totals).filter(k => k !== 'Sans date').sort();
    const order = ANNUL_DEFAULT.annulThemes.themes.map(t => t[0]);
    const themes = [...series].map(([name, v]) => [name, years.map(y => v[y] || 0)])
      .sort((a, b) => ((order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99)) || b[1].reduce((x, z) => x + z, 0) - a[1].reduce((x, z) => x + z, 0));
    return { themes: { years, totals, themes, excluded, source: lines.length }, subs, statuses };
  }
  // lecture du tableau collé pour une diapositive ; current = données affichées (un collage partiel les complète)
  function parseAnnul(type, raw, current) {
    const rows = tsv(raw);
    if (!rows.length) throw new Error('Colle d’abord un tableau copié depuis Excel.');
    const cur = current || ANNUL_DEFAULT[type];
    const source = rows.length > 20 && rows[0].length >= 8;
    if (type === 'annulReasons') {
      const head = rows[0].slice(1).map(text), years = head.filter(y => /^\d{4}$/.test(y));
      if (!years.length) throw new Error('La première ligne doit contenir les années (2020, 2021…) à partir de la deuxième colonne.');
      const idx = years.map(y => head.indexOf(y) + 1);
      const out = rows.slice(1).filter(r => text(r[0]) && !/^total/i.test(r[0])).map(r => [text(r[0]), idx.map(i => toNumber(r[i]) ?? 0)]);
      if (!out.length) throw new Error('Aucune raison reconnue : une raison par ligne, puis un effectif par année.');
      return { years, rows: out };
    }
    if (type === 'annulThemes') {
      if (source) return { ...fromSource(rows).themes, asOf: cur.asOf };
      const head = rows[0].slice(1), cols = head.map(x => /^\d{4}$/.test(text(x)) ? text(x) : /sans date/i.test(x) ? 'Sans date' : null);
      if (!cols.some(Boolean)) throw new Error('La première ligne doit contenir les années (2020, 2021…) et, si besoin, « Sans date ».');
      const years = cols.filter(x => x && x !== 'Sans date');
      let totals = null; const themes = [];
      for (const r of rows.slice(1)) {
        const vals = cols.map((k, i) => [k, toNumber(r[i + 1]) ?? 0]).filter(([k]) => k);
        if (/^total|^ann[ée]e/i.test(r[0])) { totals = Object.fromEntries(vals); continue; }
        if (text(r[0])) themes.push([themeName(text(r[0])), years.map(y => vals.find(v => v[0] === y)?.[1] ?? 0)]);
      }
      if (!themes.length && !totals) throw new Error('Aucune ligne reconnue : une ligne « Total des annulations » ou une ligne par thème.');
      const out = { ...cur, years: themes.length ? years : cur.years };
      if (themes.length) { out.themes = themes; out.excluded = null; }
      if (totals) { out.totals = totals; if (!themes.length) out.excluded = null; }
      return out;
    }
    if (source) {
      const r = fromSource(rows), map = type === 'annulContracts' ? r.subs : r.statuses;
      if (!map.size) throw new Error(`La colonne ${type === 'annulContracts' ? 'O (sous-motif)' : 'P (statut du changement de certificateur)'} est vide dans le tableau collé.`);
      const known = new Map((cur.rows || []).map(row => [norm(row[0]), row]));
      return { rows: [...map].map(([label, n]) => type === 'annulContracts' ? [label, n, known.get(norm(label))?.[2] || ''] : [label, n]) };
    }
    const body = rows.filter(r => toNumber(r[1]) != null && !/^total|examin/i.test(r[0]));
    if (!body.length) throw new Error(type === 'annulContracts' ? 'Format attendu : Sous-motif ⇥ Contrats ⇥ Explication.' : 'Format attendu : Statut ⇥ Dossiers.');
    return { rows: body.map(r => type === 'annulContracts' ? [text(r[0]), toNumber(r[1]), text(r[2])] : [text(r[0]), toNumber(r[1])]) };
  }
  function norm(value) { return text(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'"); }
  const sum = values => values.reduce((a, b) => a + (Number(b) || 0), 0);
  const plural = (n, one, many) => fmt(n) + ' ' + (n > 1 ? many : one);

  function groupedColumns(h, years, themes) {
    const W = 1490, H = 330, left = 46, right = 8, top = 26, bottom = 34;
    const highest = Math.max(1, ...themes.flatMap(t => t[1]));
    const step = highest <= 5 ? 1 : highest <= 10 ? 2 : highest <= 25 ? 5 : 10, max = Math.ceil(highest / step) * step;
    const y = v => H - bottom - (H - top - bottom) * v / max, slot = (W - left - right) / years.length, bw = slot * .88 / themes.length;
    let out = `<svg class="bilan-chart annul-columns" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Annulations par année et par thème">`;
    for (let v = 0; v <= max; v += step) out += `<line x1="${left}" x2="${W - right}" y1="${y(v)}" y2="${y(v)}" stroke="#dbe6df"/><text x="${left - 10}" y="${y(v) + 6}" text-anchor="end">${fmt(v)}</text>`;
    years.forEach((year, i) => {
      const x0 = left + slot * i + slot * .06;
      out += `<text x="${left + slot * (i + .5)}" y="${H - 8}" text-anchor="middle" class="annul-year">${h.esc(year)}</text>`;
      themes.forEach(([name, values], j) => {
        const v = Number(values[i]) || 0; if (!v) return;
        const x = x0 + j * bw;
        out += `<rect x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw * .9).toFixed(1)}" height="${(y(0) - y(v)).toFixed(1)}" fill="${ANNUL_COLORS[j % ANNUL_COLORS.length]}"><title>${h.esc(`${name} · ${year} · ${v}`)}</title></rect>`;
        out += `<text class="bilan-chart-value annul-value" x="${(x + bw * .45).toFixed(1)}" y="${(y(v) - 5).toFixed(1)}" text-anchor="middle">${fmt(v)}</text>`;
      });
    });
    return out + '</svg>';
  }
  const annulLegend = (h, names) => `<div class="bilan-legend annul-legend">${names.map((label, i) =>
    `<span><i style="background:${ANNUL_COLORS[i % ANNUL_COLORS.length]}"></i><span class="bilan-legend-label">${h.esc(label)}</span></span>`).join('')}</div>`;

  function annulThemes(book, c, h) {
    const d = annulData('annulThemes', c), keys = [...d.years, ...('Sans date' in (d.totals || {}) ? ['Sans date'] : [])];
    const total = sum(Object.values(d.totals || {})), dated = sum(d.themes.flatMap(t => t[1])), out = total - dated, x = d.excluded;
    const body = `<div class="annul-top"><div class="annul-kpi"><strong>${fmt(total)}</strong><span>annulations, tous motifs confondus</span><small>y compris les dossiers sans motif précis</small></div>
      ${table(h, ['Année de la demande', ...keys], [['Total des annulations', ...keys.map(k => fmt(d.totals?.[k] ?? 0))]])}</div>
      <p class="annul-chart-title">Contrats datés avec un motif explicite, par thème et par année · ${fmt(dated)} contrats</p>
      ${groupedColumns(h, d.years, d.themes)}${annulLegend(h, d.themes.map(t => t[0]))}`;
    const parts = x ? `${plural(x.vague, 'dossier au détail vide ou insuffisant', 'dossiers au détail vide ou insuffisant')}, ${plural(x.gestion, 'dossier de gestion contractuelle', 'dossiers de gestion contractuelle')} et ${plural(x.undated, 'motif explicite sans date', 'motifs explicites sans date')}, qui restent hors des barres`
      : `${plural(out, 'dossier', 'dossiers')} hors des barres (détail vide ou insuffisant, gestion contractuelle ou motif sans date)`;
    const refused = d.themes.find(t => /travaux refus/i.test(t[0]));
    return {
      subtitle: `${fmt(total)} annulations · barres : ${fmt(dated)} contrats datés avec un motif explicite`,
      body,
      note: `Lecture : le total inclut ${parts}.${d.asOf ? ` ${d.years.at(-1)} est arrêté au ${d.asOf}.` : ''}` +
        (refused && sum(refused[1]) === 1 && !c.data ? ' Le cas « Travaux refusés » correspond à Nantes – Dalby, OPE-002975, avec une demande d’annulation le 18 février 2025. Le commentaire ne précise pas l’auteur ni la cause du refus.' : '') +
        ' Source : onglet Annulation (thème en colonne H, date de demande en colonne N).'
    };
  }
  function annulContracts(book, c, h) {
    const d = annulData('annulContracts', c), n = sum(d.rows.map(r => r[1]));
    const body = `<div class="annul-top"><div class="annul-kpi"><strong>${fmt(n)}</strong><span>contrats annulés pour gestion contractuelle</span><small>doublons, fusions, reprises et remplacements</small></div></div>
      <table class="bilan-table annul-table"><thead><tr><th scope="col">Sous-motif</th><th scope="col">Contrats</th><th scope="col">Explication</th></tr></thead>
      <tbody>${d.rows.map(([label, count, why]) => `<tr><th scope="row">${h.esc(label)}</th><td>${fmt(count)}</td><td class="annul-why">${h.esc(why || '')}</td></tr>`).join('')}
      <tr class="annul-total"><th scope="row">Total</th><td>${fmt(n)}</td><td class="annul-why"></td></tr></tbody></table>`;
    return { subtitle: `${fmt(n)} contrats · sous-motif du contrat (colonne O)`, body,
      introduction: 'À vérifier : le statut des contrats de reprise doit être contrôlé pour établir la poursuite des opérations.',
      note: 'Source : onglet Annulation, sous-motif du contrat en colonne O.' };
  }
  function donut(h, rows, total) {
    const R = 170, r = 112, cx = 200, cy = 200; let a = -Math.PI / 2, out = `<svg class="annul-donut" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="Statuts des changements de certificateur">`;
    rows.forEach(([label, n], i) => {
      if (!n) return; const da = 2 * Math.PI * n / (total || 1), b = a + da, large = da > Math.PI ? 1 : 0, P = (rad, ang) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)].map(v => v.toFixed(2));
      const d = rows.filter(x => x[1]).length === 1 ? `M${cx} ${cy - R}A${R} ${R} 0 1 1 ${cx - .01} ${cy - R}L${cx - .01} ${cy - r}A${r} ${r} 0 1 0 ${cx} ${cy - r}Z`
        : `M${P(R, a)}A${R} ${R} 0 ${large} 1 ${P(R, b)}L${P(r, b)}A${r} ${r} 0 ${large} 0 ${P(r, a)}Z`;
      out += `<path d="${d}" fill="${ANNUL_COLORS[i % ANNUL_COLORS.length]}" stroke="#fff" stroke-width="3"><title>${h.esc(label + ' · ' + n)}</title></path>`;
      const m = a + da / 2, [tx, ty] = P((R + r) / 2, m); out += `<text x="${tx}" y="${Number(ty) + 9}" text-anchor="middle" class="annul-seg">${fmt(n)}</text>`; a = b;
    });
    return out + `<text x="${cx}" y="${cy + 6}" text-anchor="middle" class="annul-center">${fmt(total)}</text><text x="${cx}" y="${cy + 36}" text-anchor="middle" class="annul-center-label">dossiers</text><text x="${cx}" y="${cy + 60}" text-anchor="middle" class="annul-center-label">examinés</text></svg>`;
  }
  function annulCertifier(book, c, h) {
    const d = annulData('annulCertifier', c), n = sum(d.rows.map(r => r[1]));
    const body = `<div class="annul-donut-wrap">${donut(h, d.rows, n)}<ul class="annul-status">${d.rows.map(([label, count], i) =>
      `<li><i style="background:${ANNUL_COLORS[i % ANNUL_COLORS.length]}"></i><span>${h.esc(label)}</span><strong>${fmt(count)}</strong><small>${n ? fmt(Math.round(count * 100 / n)) + ' %' : ''}</small></li>`).join('')}</ul></div>`;
    const verify = d.rows.find(r => /v[ée]rifier/i.test(r[0]));
    return { subtitle: `${fmt(n)} dossiers examinés · statut du changement de certificateur (colonne P)`, body,
      note: (verify && verify[1] === 11 && !c.data ? 'Parmi les 11 dossiers à vérifier, 3 mentionnent un organisme imposé et 8 citent un autre label ou référentiel. ' : '') + 'Source : onglet Annulation, colonne P.' };
  }
  const UNKNOWN = /raison non renseign/i;
  function reasonLines(h, years, rows) {
    const W = 1490, H = 470, left = 78, right = 78, top = 30, bottom = 66;
    const highest = Math.max(1, ...rows.flatMap(r => r[1]));
    const step = [1, 2, 5, 10, 20, 25, 50, 100].find(s => highest / s <= 6) || 200, max = Math.ceil(highest / step) * step;
    const x = i => left + (W - left - right) * (years.length === 1 ? .5 : i / (years.length - 1)), y = v => H - bottom - (H - top - bottom) * v / max;
    const style = reasonStyles(rows);
    let out = `<svg class="bilan-chart annul-lines" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Évolution des raisons déclarées">`;
    for (let v = 0; v <= max; v += step) out += `<line x1="${left}" x2="${W - right}" y1="${y(v)}" y2="${y(v)}" stroke="#dbe6df"/><text x="${left - 10}" y="${y(v) + 6}" text-anchor="end">${fmt(v)}</text>`;
    years.forEach((yr, i) => { out += `<text x="${x(i)}" y="${H - bottom + 26}" text-anchor="middle" class="annul-year">${h.esc(yr)}</text><text x="${x(i)}" y="${H - bottom + 50}" text-anchor="middle" class="annul-ytotal">${fmt(sum(rows.map(r => r[1][i])))} contrats</text>`; });
    const order = rows.map((r, i) => i).sort((a, b) => style[a].rank - style[b].rank);
    for (const i of order) {
      const [name, values] = rows[i], st = style[i];
      out += `<path d="${values.map((v, j) => `${j ? 'L' : 'M'}${x(j).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${st.color}" stroke-width="${st.width}"${st.dash ? ` stroke-dasharray="${st.dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"><title>${h.esc(name)}</title></path>`;
      if (st.main || st.gray) out += values.map((v, j) => `<circle cx="${x(j).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${st.main ? 6 : 4}" fill="${st.color}"><title>${h.esc(`${name} · ${years[j]} · ${v}`)}</title></circle>`).join('');
      if (st.main) { const other = rows.find((r2, k) => k !== i && style[k].main); const below = st.color === '#d1842a';
        out += values.map((v, j) => { if (!v) return ''; const close = other && Math.abs(y(other[1][j]) - y(v)) < 26;
          // deux étiquettes trop proches : la série secondaire passe à droite du point
          if (close && below) return `<text class="bilan-chart-value annul-value annul-value-main" x="${(x(j) + 12).toFixed(1)}" y="${(y(v) + 20).toFixed(1)}" text-anchor="start" style="fill:${st.color}">${fmt(v)}</text>`;
          return `<text class="bilan-chart-value annul-value annul-value-main" x="${x(j).toFixed(1)}" y="${(y(v) - 12).toFixed(1)}" text-anchor="middle" style="fill:${st.color}">${fmt(v)}</text>`; }).join(''); }
    }
    return out + '</svg>';
  }
  // deux séries principales (plus gros totaux hors « Raison non renseignée ») en trait épais ; « Raison non renseignée » en gris pointillé ; les autres en trait fin
  function reasonStyles(rows) {
    const totals = rows.map((r, i) => [i, sum(r[1])]).filter(([i]) => !UNKNOWN.test(rows[i][0])).sort((a, b) => b[1] - a[1]);
    const main = new Map(totals.slice(0, 2).map(([i], k) => [i, ['#07543d', '#d1842a'][k]]));
    const others = ['#3778a5', '#7160a1', '#2a9d8f', '#c0485a', '#8a6a3b', '#6aa84f', '#d36fb0', '#4b5563', '#e2b007', '#1f8fbf', '#a0522d', '#5a3d8a'];
    let k = 0;
    return rows.map((r, i) => UNKNOWN.test(r[0]) ? { color: '#8c9399', width: 4, dash: '10 7', gray: true, rank: 1 }
      : main.has(i) ? { color: main.get(i), width: 6, main: true, rank: 2 } : { color: others[k++ % others.length], width: 2.5, rank: 0 });
  }
  function annulReasons(book, c, h) {
    const d = annulData('annulReasons', c), total = sum(d.rows.flatMap(r => r[1])), unknown = sum(d.rows.filter(r => UNKNOWN.test(r[0])).flatMap(r => r[1]));
    const st = reasonStyles(d.rows);
    const legendHtml = `<div class="bilan-legend annul-legend annul-reason-legend">${d.rows.map((r, i) => `<span class="${st[i].main ? 'is-main' : st[i].gray ? 'is-gray' : ''}"><i style="${st[i].gray ? 'background:none;height:0;border-top:4px dashed #8c9399' : 'background:' + st[i].color}"></i><span class="bilan-legend-label">${h.esc(r[0])} · ${fmt(sum(r[1]))}</span></span>`).join('')}</div>`;
    return { subtitle: `${fmt(total)} annulations datées, dont ${fmt(unknown)} sans raison renseignée`,
      body: reasonLines(h, d.years, d.rows) + legendHtml,
      note: `89 contrats sans date sont hors graphique. ${d.years.at(-1) || '2026'} est arrêté au 25 novembre. Raison déclarée dans l’export, reprise telle quelle.` };
  }
  const ANNUL_HELP = {
    annulReasons: ['Copie la plage dans Excel puis colle-la ici : première colonne = raisons, première ligne = années, cellules = effectifs. Le graphique est recalculé dès le collage.', 'Raison\t2020\t2021\t2022\nMontage financier infructueux\t0\t5\t6'],
    annulThemes: ['Thème ⇥ 2020 ⇥ 2021 ⇥ … ⇥ 2026, une ligne par thème ; ajoute une ligne « Total des annulations » (avec « Sans date ») pour le bandeau. Tu peux aussi coller l’onglet Annulation entier : les totaux sont recalculés depuis les colonnes H et N.', 'Thème\t2020\t2021\t2022\nPermis, recours ou décision publique\t0\t0\t3\nTotal des annulations\t5\t10\t27'],
    annulContracts: ['Sous-motif ⇥ Contrats ⇥ Explication, une ligne par sous-motif (ou l’onglet entier : colonne O).', 'Sous-motif\tContrats\tExplication\nDoublon\t12\tDeux contrats…'],
    annulCertifier: ['Statut ⇥ Dossiers, une ligne par statut (ou l’onglet entier : colonne P). Le total au centre est la somme.', 'Statut\tDossiers\nChangement confirmé\t3\nÀ vérifier\t11']
  };
  function annulControls(type, c, h) {
    const [help, ph] = ANNUL_HELP[type];
    return `<div class="control-section annul-paste"><h3>Coller un tableau Excel</h3><p class="help">${h.esc(help)}</p>
      <p class="help"><strong>${c.data ? 'Tableau collé appliqué.' : 'Valeurs de l’onglet Annulation au 25/11/2026.'}</strong></p>
      <div class="field"><textarea rows="7" data-annul-paste="${type}" placeholder="${h.esc(ph)}">${h.esc(c.paste || '')}</textarea></div>
      <div class="evolution-import-actions"><button type="button" class="btn btn-primary" data-annul-apply="${type}">Appliquer le tableau</button><button type="button" class="btn btn-secondary btn-small" data-annul-reset="${type}">Valeurs du 25/11/2026</button></div>
      <p class="help" data-annul-status role="status"></p></div>`;
  }

  const renders = { annulThemes, annulContracts, annulCertifier, annulReasons, bilanSummary: summary, bilanQuality: quality, abandonRate: cancellations, moaVolume: portfolio, certEvolution: evolution, labels, opSize: size };
  function html(type, model, book, h) {
    const c = config(type, model);
    const title = c.title ?? TITLES[type];
    const display = book?.sheets || ownData(type) ? renders[type](book, c, h)
      : { subtitle: 'Données du bilan consolidé', body: '<p class="bilan-empty">Importe le bilan Excel pour afficher cette diapositive.</p>' };
    const alignment = ['center', 'right'].includes(c.textAlign) ? c.textAlign : 'left';
    const treatment = c.textTreatment === 'callout' ? 'bilan-intro-callout' : '';
    const note = c.copy.note ?? display.note;
    const intro = c.copy.introduction ?? display.introduction;
    const message = intro?.trim() ? `<p class="bilan-intro ${treatment}">${h.esc(intro)}</p>` : '';
    return h.head(title, c.copy.subtitle ?? display.subtitle) + `<div class="bilan-content bilan-text-${alignment}">
      ${c.textPosition === 'below' ? '' : message}
      ${c.copy.heading?.trim() ? `<h2 class="bilan-content-heading">${h.esc(c.copy.heading)}</h2>` : ''}
      <div class="bilan-figure">${display.body}</div>
      ${c.textPosition === 'below' ? message : ''}
      ${note?.trim() ? `<p class="bilan-note">${h.esc(note)}</p>` : ''}</div>`;
  }

  window.OBSBilan = { TEMPLATES, TYPES, DECK, ANNUL, defaults, usesWorkbook, importWorkbook, controls, html, parseAnnul, pasteSheet, SHEETS_FOR, readSheets, alignToSheet };
})();
