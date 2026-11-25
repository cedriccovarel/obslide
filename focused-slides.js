/* Diapositives calculées à partir des lignes source conservées par Obslide. */
(function () {
  'use strict';

  const clean = value => String(value ?? '').trim();
  const norm = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ');
  const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format;
  const integer = new Intl.NumberFormat('fr-FR').format;
  const esc = value => clean(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
  const split = value => clean(value).split(/\s*(?:<br\s*\/?>|&lt;br\s*\/?&gt;|[;\n\r])\s*/i).filter(Boolean);
  const positive = value => {
    const s = clean(value).replace(/\s/g, '').replace(',', '.');
    return /^\d+(?:\.\d+)?$/.test(s) && Number.isFinite(Number(s)) && Number(s) > 0 ? Number(s) : null;
  };
  const nonnegative = value => /^0(?:[,.]0+)?$/.test(clean(value)) ? 0 : positive(value);
  const unique = values => [...new Map(values.filter(v => v != null && v !== '').map(v => [norm(v), v])).values()];
  const unambiguous = values => {
    const distinct = unique(values);
    return distinct.length === 1 ? distinct[0] : null;
  };
  const inOrder = (a, b) => a.localeCompare(b, 'fr', { numeric: true });
  const activity = 'Activité et annulations', portfolio = 'Clients et familles de MOA';
  const certification = 'Certifications, labels et mentions', size = 'Taille des opérations';
  const construction = 'Construction et isolation', equipment = 'Équipements';
  const energy = 'Énergie et confort d’été', carbon = 'Carbone', dpe = 'DPE';
  const geography = 'Territoires';
  const lessHistory = 'Les cohortes récentes disposent de moins de recul.';
  const reported = 'Mentions renseignées. La délivrance du label exige une preuve spécifique.';
  const statsLevels = [1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99];
  const operationCache = new WeakMap();

  function dateYear(value) {
    const s = clean(value);
    if (!s) return null;
    let y;
    if (/^\d{4}$/.test(s)) y = Number(s);
    else if (/^\d{4}-\d{2}-\d{2}(?:[ T].*)?$/.test(s)) y = Number(s.slice(0, 4));
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) y = Number(s.slice(-4));
    else if (/^\d{5}(?:\.\d+)?$/.test(s)) y = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400000).getUTCFullYear();
    return y >= 1900 && y <= 2100 ? y : null;
  }

  function rawFields(row) {
    const entries = Object.entries(row || {});
    const map = new Map(entries.map(([key, value]) => [norm(key), value]));
    return (...keys) => keys.map(key => map.get(norm(key))).find(value => clean(value) !== '') ?? '';
  }

  function labelData(get) {
    const historical = split(get('Opération: Mentions', 'Mentions', 'Mention'));
    const performance = split(get('Opération: Performance', 'Performance')).filter(t => !/^voir (?:les )?mentions?$/i.test(t));
    const tags = [...historical, ...performance];
    const labels = {};
    for (const [key, family, aliases, recognize] of LABELS) {
      const special = split(get(...aliases))
        .filter(v => !/^(?:0|non|false|aucun|sans mention)$/i.test(v))
        .map(v => /^(?:oui|true|1)$/i.test(v) ? family : recognize.test(norm(v)) ? v : family + ' ' + v);
      labels[key] = unique([...tags.filter(v => recognize.test(norm(v))), ...special].map(v => labelName(key, v)));
    }
    return { historical, performance, labels, profile: clean(get('Opération: Profil choisi', 'Profil choisi', 'Profil spécifique')) };
  }

  const LABELS = [
    ['Bee', 'BEE+', ['Opération: Mention BEE+', 'Mention BEE+'], /\bbee\s*\+/],
    ['Bbca', 'BBCA', ['Mention Label BBCA', 'Label BBCA'], /\bbbca\b/],
    ['Bio', 'Bâtiment Biosourcé', ['Mention Label Bâtiment Biosourcé', 'Label Bâtiment Biosourcé'], /\bbiosource\b/],
    ['Eff', 'Effinergie', ['Mention Label Effinergie', 'Label Effinergie'], /\beffinergie\b/]
  ];

  function labelName(key, value) {
    let v = value.replace(/^mention\s+/i, '').replace(/^label\s+/i, '').trim();
    if (key === 'Bee') v = v.replace(/^bee\s*\+/i, 'BEE+');
    if (key === 'Bbca') v = v.replace(/^bbca\s+(standard|performance|excellence)$/i, (_, level) => 'BBCA ' + level[0].toUpperCase() + level.slice(1).toLowerCase());
    return v;
  }

  function rowsOf(operations, anonymized) {
    return operations.flatMap(op => {
      if (!operationCache.has(op)) {
        const raw = op.rawRows?.length ? op.rawRows : op.raw ? [op.raw] : [];
        operationCache.set(op, raw.map(row => {
          const get = rawFields(row);
          const status = clean(get('Contrat: Statut', 'Statut'));
          const group = clean(get('Nom de la société: Groupe principal Nom', 'Groupe principal Nom', 'Maître d’ouvrage: Groupe principal Nom'));
          const labels = labelData(get);
          return {
            get, code: op.code, raw: row, rawRows: [row],
            contractId: clean(get('Numéro du contrat', 'Contrat: Numéro du contrat')),
            operationId: clean(get('Opération: Code interne', 'Code interne', 'Code opération', 'ID opération')),
            year: dateYear(get("Date de création de l'affaire", 'Affaire: Date de création', 'Opportunité: Date de création')),
            decision: dateYear(get('Date de décision de certification')) || dateYear(get('Certification: Date de décision CD')),
            rawStatus: status, status: norm(status),
            referential: clean(get('Référentiel', 'Référentiel: Nom du référentiel')) || op.referential || '',
            regulation: clean(get('Réglementation thermique', 'Réglementation', 'Réglementation applicable')),
            version: clean(get('Version', 'Version du référentiel')),
            department: op.department, nature: op.nature, group, moa: op.moa,
            family: clean(get("Nom de la société: Secteur d'activité", 'Famille MOA', 'Famille de MOA')),
            mentions: unique([...labels.historical, ...Object.values(labels.labels).flat()]).join('\n'),
            ...labels
          };
        }));
      }
      const rows = operationCache.get(op);
      // Le mode anonymisé ne relit aucun nom de groupe dans les colonnes Salesforce.
      return anonymized ? rows.map(row => ({ ...row, group: '', moa: op.moa })) : rows;
    });
  }

  function groupBy(rows, key) {
    const map = new Map();
    for (const row of rows) {
      const k = key(row);
      if (k == null || k === '') continue;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(row);
    }
    return map;
  }

  const field = (rows, key) => unambiguous(rows.map(row => row[key]));
  const from = (rows, aliases, parse = clean) => unambiguous(rows.map(row => parse(row.get(...aliases))));
  const activeStatus = status => ['solde', 'en cours'].includes(status);
  const cancelledStatus = status => /^annule(?:e)?$/.test(status || '');
  const operationKey = row => row.operationId ? 'op:' + norm(row.operationId) : row.contractId ? 'contract:' + norm(row.contractId) : '';
  const contractKey = row => norm(row.contractId);
  const metricNumber = {
    logements: ['Total logements', 'Nombre de logements'],
    bâtiments: ['Total bâtiments', 'Nombre de bâtiments'],
    'm²': ['Total surface'],
    '€ HT': ['Opportunité: Montant HT', 'Montant HT affaire']
  };

  function distribution(values) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return { n: 0, quantiles: {} };
    const quantiles = {};
    for (const p of statsLevels) {
      const i = (sorted.length - 1) * p / 100;
      const lo = Math.floor(i), hi = Math.ceil(i);
      quantiles[p] = sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
    }
    return { n: sorted.length, min: sorted[0], max: sorted.at(-1), mean: sorted.reduce((a, b) => a + b, 0) / sorted.length, quantiles, atOrBelow80: sorted.filter(value => value <= quantiles[80]).length };
  }

  const definitions = [];
  function define(id, label, family, legacy, kind, spec = {}) {
    definitions.push({ type: 'focus' + id, label, family, legacy, kind, ...spec });
  }

  define('Contracts', 'Volume global de contrats', activity, ['bilanSummary'], 'contracts');
  define('ContractsByYear', 'Évolution annuelle des contrats', activity, ['bilanSummary', 'evolution'], 'contractYears');
  define('ContractStatuses', 'Répartition par statut de contrat', activity, ['bilanSummary', 'tunnel'], 'statuses');
  define('CancellationRate', 'Taux global d’annulation', activity, ['abandonRate'], 'cancelTotal');
  define('CancellationCountYear', 'Nombre annuel d’annulations', activity, ['abandonRate'], 'cancelYear');
  define('CancellationRateYear', 'Taux annuel d’annulation', activity, ['abandonRate'], 'cancelYear', { rate: true });
  define('CancellationRateRef', 'Taux d’annulation par référentiel', activity, ['abandonRate'], 'cancelRef', { rate: true });
  define('CancellationRateCross', 'Taux d’annulation par année et référentiel', activity, ['abandonRate'], 'cancelCross', { rate: true });

  for (const [id, label, unit] of [
    ['Contracts', 'nombre de contrats', 'contrats'], ['Housing', 'nombre de logements', 'logements'],
    ['Buildings', 'nombre de bâtiments', 'bâtiments'], ['Revenue', 'montant HT du portefeuille', '€ HT']
  ]) define('Clients' + id, 'Groupes clients par ' + label, portfolio, ['moaVolume', 'moaList'], 'clients', { unit });
  define('MoaFamilies', 'Contrats actifs par famille de MOA', portfolio, ['moaVolume', 'stakeholderSplit'], 'families');
  define('ClientConcentration', 'Concentration des dix premiers groupes clients', portfolio, ['moaVolume'], 'concentration');
  define('MoaFamiliesYear', 'Évolution des contrats actifs par famille de MOA', portfolio, ['moaVolume'], 'familiesYear');

  define('CertificationYears', 'Évolution annuelle des décisions de certification', certification, ['certEvolution'], 'decisions');
  define('CertificationRefs', 'Décisions de certification par référentiel', certification, ['certEvolution', 'labels'], 'decisionRefs');
  for (const [id, label] of LABELS) {
    define(id + 'Ambitions', label + ' · ambitions par année de création', certification, ['certEvolution'], 'labelYears', { labelKey: id, group: 'pending' });
    define(id + 'Decisions', label + ' · mentions par année de décision', certification, ['certEvolution'], 'labelYears', { labelKey: id, group: 'dated' });
    define(id + 'Levels', label + ' · répartition des déclinaisons', certification, ['labels'], 'labelLevels', { labelKey: id });
  }
  define('BioVersions', 'Bâtiment Biosourcé · versions 2013 et 2024', certification, ['labels'], 'labelVersions', { labelKey: 'Bio' });
  define('Historical', 'Mentions historiques · BPE, BPEC, TFPB', certification, ['mentionList', 'labels'], 'historical');
  define('Profiles', 'Répartition des profils spécifiques', certification, ['performanceList'], 'profiles');
  define('PerfMentions', 'Mentions de performance spécifiques', certification, ['labels', 'performanceList'], 'performance');
  for (const [id, label, alias] of [
    ['IcConstruction', 'IC Construction', 'Niveau IC Construction'], ['IcEnergy', 'IC Énergie', 'Niveau IC Énergie'],
    ['Cep', 'Cep', 'Niveau Cep'], ['Cepnr', 'Cep,nr', 'Niveau Cep,nr'], ['Bbio', 'Bbio', 'Niveau Bbio']
  ]) define('Levels' + id, label + ' · niveaux renseignés', certification, ['labels', 'certEvolution'], 'reportedLevels', { aliases: [alias] });

  for (const [id, noun, unit, scope] of [
    ['Housing', 'nombre de logements', 'logements', 'housing'], ['Buildings', 'nombre de bâtiments', 'bâtiments', 'all'],
    ['Surface', 'surface tertiaire', 'm²', 'tertiary']
  ]) {
    define(id + 'Mean', 'Moyenne · ' + noun + ' par opération', size, ['opSize', 'bilanSummary'], 'opMean', { unit, scope });
    define(id + 'Percentiles', 'Centiles · ' + noun + ' par opération', size, ['opSize'], 'opPercentiles', { unit, scope });
  }

  for (const [id, noun, unit] of [['Operations', 'Opérations', 'opérations'], ['Housing', 'Logements', 'logements'], ['Buildings', 'Bâtiments', 'bâtiments']]) {
    define('Territory' + id, noun + ' par département', geography, ['map', 'communeMap', 'cityList'], 'territory', { unit });
  }

  function technical(id, label, family, legacy, aliases, unit, comparison) {
    define(id, label, family, [legacy], unit ? 'technicalNumbers' : 'technicalCategories', { aliases, unit, comparison });
  }

  technical('ConstructionMode', 'Modes constructifs', construction, 'envelope', ['Mode constructif principal', 'Mode constructif', 'Structure']);
  technical('Structure', 'Matériaux de structure', construction, 'envelope', ['Matériaux de structure', 'Parois verticales structure']);
  for (const [id, part, aliases, rAliases] of [
    ['Facade', 'des façades', ['Parois verticales type d’isolant', 'Parois verticales type isolant'], ['Parois verticales R isolant']],
    ['Roof', 'des toitures', ['Planchers hauts isolant'], ['Planchers hauts R isolant']],
    ['Floor', 'des planchers bas', ['Planchers bas isolant'], ['Planchers bas R isolant']]
  ]) {
    technical(id + 'Insulation', 'Matériaux d’isolation ' + part, construction, 'envelope', aliases);
    technical(id + 'Resistance', 'Résistance thermique ' + part, construction, 'envelope', rAliases, 'm²·K/W');
  }
  technical('Windows', 'Matériaux des menuiseries extérieures', construction, 'envelope', ['Menuiseries matériau']);
  technical('AirLeakage', 'Perméabilité à l’air · Q4Pa-surf', construction, 'envelope', ['Q4Pa-surf', 'Perméabilité à l’air Q4Pa-surf'], 'm³/(h·m²)');
  for (const [id, title, aliases] of [
    ['Heating', 'Systèmes de chauffage', ['Mode de chauffage après travaux', 'Vecteur chauffage après travaux', 'Chauffage après travaux']],
    ['HotWater', 'Production d’eau chaude sanitaire', ['ECS', 'Mode ECS après travaux', 'Vecteur ECS après travaux']],
    ['Ventilation', 'Systèmes de ventilation', ['Ventilation']],
    ['Cooling', 'Systèmes de refroidissement', ['Refroidissement']]
  ]) technical(id, title, equipment, 'equipments', aliases);
  for (const [id, title, aliases, unit] of [
    ['Cep', 'Cep', ['Cep'], 'kWhEP/(m²·an)'], ['Cepnr', 'Cep,nr', ['Cepnr', 'Cep,nr'], 'kWhEP/(m²·an)'],
    ['Bbio', 'Bbio', ['Bbio'], 'points'], ['Ubat', 'Ubât après travaux', ['Ubat après travaux', 'Ubat après'], 'W/(m²·K)'],
    ['Dh', 'Degrés-heures d’inconfort (DH)', ['DH'], '°C·h'], ['Tic', 'Température intérieure conventionnelle (TIC)', ['TIC'], '°C']
  ]) technical('Energy' + id, title, energy, 'equipments', aliases, unit);

  for (const [id, label, aliases, unit] of [
    ['IcConstruction', 'IC Construction', ['IC composants bâtiment', 'IC Construction'], 'kgCO₂e/m²'],
    ['IcEnergy', 'IC Énergie', ['IC Énergie bâtiment', 'IC Énergie'], 'kgCO₂e/m²'],
    ['Stock', 'Stock C', ['Stock C', 'Stock C bâtiment'], 'kgC/m²'],
    ['EgesEnergy', 'EGES Énergie', ['EGES Énergie'], 'unité source'],
    ['EgesSite', 'EGES Chantier', ['EGES Chantier'], 'unité source'],
    ['EgesTotal', 'EGES Total', ['EGES Total'], 'unité source']
  ]) technical('Carbon' + id, label, carbon, 'carbon', aliases, unit);
  technical('CarbonConstructionThreshold', 'IC Construction · seuil réglementaire applicable', carbon, 'carbon',
    ['IC composants bâtiment', 'IC Construction'], '%', ['IC Construction max']);
  technical('CarbonEnergyThreshold', 'IC Énergie · seuil réglementaire applicable', carbon, 'carbon',
    ['IC Énergie bâtiment', 'IC Énergie'], '%', ['IC Énergie max']);
  for (const year of [2028, 2031]) technical('CarbonThreshold' + year, 'IC Construction · comparaison au seuil ' + year, carbon, 'carbon',
    ['IC composants bâtiment', 'IC Construction'], '%', ['IC Construction max ' + year, 'Seuil IC Construction ' + year]);

  for (const [id, label, before, after] of [
    ['Energy', 'Étiquettes DPE énergie avant / après', ['DPE énergie avant travaux', 'DPE énergie avant'], ['DPE énergie après travaux final', 'DPE énergie après']],
    ['Ges', 'Étiquettes DPE GES avant / après', ['DPE GES avant travaux', 'DPE GES avant'], ['DPE GES après travaux final', 'DPE GES après']]
  ]) define('Dpe' + id, label, dpe, ['dpe'], 'dpeClasses', { before, after });
  define('DpeEnergyGain', 'DPE · gains de consommation énergétique', dpe, ['dpe'], 'pairedGain', {
    before: ['Cep avant travaux'], after: ['Cep après travaux final'], unit: 'kWhEP/(m²·an)'
  });
  define('DpeGesGain', 'DPE · gains d’émissions de GES', dpe, ['dpe'], 'pairedGain', {
    before: ['GES avant travaux', 'Émissions de GES avant travaux'], after: ['GES après travaux final', 'Émissions de GES après travaux'], unit: 'kgCO₂e/(m²·an)'
  });

  const contractUnit = 'contrats';
  const activeScope = 'Contrats soldés ou en cours. Volumes relevés par contrat.';
  const basis = {
    active: activeScope,
    pending: 'Contrats en cours, par année de création de l’affaire.',
    dated: 'Contrats soldés, par année de décision de certification finale.',
    sold: 'Contrats soldés, avec ou sans décision datée.'
  };
  const isEligible = (contract, population) => ({
    active: activeStatus(contract.status),
    pending: contract.status === 'en cours',
    dated: contract.status === 'solde' && contract.decision != null,
    sold: contract.status === 'solde'
  })[population];

  function contractsOf(rows) {
    return [...groupBy(rows, contractKey).values()].map(items => ({
      items, status: field(items, 'status'), rawStatus: field(items, 'rawStatus'),
      year: field(items, 'year'), decision: field(items, 'decision'), referential: field(items, 'referential'),
      family: field(items, 'family'), group: field(items, 'group')
    }));
  }

  const barsBy = (rows, key) => [...groupBy(rows, key)].map(([label, items]) => ({ label: String(label), value: items.length }));
  const rank = bars => bars.sort((a, b) => b.value - a.value || inOrder(a.label, b.label));
  const chronological = bars => bars.sort((a, b) => inOrder(a.label, b.label));
  const measure = (items, unit) => from(items, metricNumber[unit], unit === '€ HT' ? nonnegative : positive);
  const labelValues = (contract, key) => {
    const all = unique(contract.items.flatMap(item => item.labels[key] || []));
    const generic = norm(LABELS.find(label => label[0] === key)[1]);
    return all.length > 1 ? all.filter(v => norm(v) !== generic) : all;
  };
  function tagBars(contracts, values, unit = contractUnit) {
    const tags = contracts.flatMap(contract => unique(values(contract)).map(label => ({ label })));
    return { bars: rank(barsBy(tags, tag => tag.label)), n: contracts.filter(c => values(c).length).length, base: contracts.length, unit };
  }

  function cancellationBars(contracts, group, rate) {
    return [...groupBy(contracts, group)].map(([label, cohort]) => {
      const count = cohort.filter(c => cancelledStatus(c.status)).length;
      const known = cohort.every(c => c.status);
      return { label: String(label), value: rate ? known ? count * 100 / cohort.length : null : count,
        detail: count + ' / ' + cohort.length + (known ? '' : ' · statuts incomplets') };
    });
  }

  const contractExclusion = rows => {
    const count = rows.filter(row => !row.contractId).length;
    return count ? integer(count) + ' lignes sans numéro de contrat exclues.' : '';
  };
  const operationExclusion = rows => {
    const fallback = groupBy(rows.filter(row => !row.operationId), operationKey).size;
    const missing = rows.filter(row => !operationKey(row)).length;
    return [
      fallback ? integer(fallback) + (fallback === 1 ? ' identifiant de substitution' : ' identifiants de substitution') + ' par numéro de contrat. Unicité physique non confirmée.' : '',
      missing ? integer(missing) + ' lignes sans identifiant exclues.' : ''
    ].filter(Boolean).join(' ');
  };

  function contractAnalysis(def, rows, model) {
    const contracts = contractsOf(rows);
    const n = contracts.length;
    const active = contracts.filter(c => isEligible(c, 'active'));
    const exclusions = contractExclusion(rows);
    const allScope = 'Contrats uniques, tous statuts dans le périmètre filtré.';
    const result = { n, base: n, sample: contractUnit, unit: contractUnit, scope: allScope, caution: exclusions };
    const dated = contracts.filter(c => isEligible(c, 'dated'));
    const withBars = (bars, extras = {}) => ({ ...result, bars, ...extras });
    const excludedStatus = contracts.filter(c => !c.status).length;
    switch (def.kind) {
      case 'contracts':
        return { ...result, big: n, message: 'Contrats uniques identifiés par leur numéro.' };
      case 'contractYears':
        return withBars(chronological(barsBy(contracts, c => c.year)), { n: contracts.filter(c => c.year).length, scope: allScope + ' Année de création de l’affaire.' });
      case 'statuses':
        return withBars(rank(barsBy(contracts, c => c.rawStatus || 'Statut absent ou contradictoire')), { n: n - excludedStatus });
      case 'cancelTotal': {
        const [item] = cancellationBars(contracts, () => 'Total', true);
        return { ...result, n: n - excludedStatus, big: item?.value, unit: '%', message: item ? item.detail + ' contrats annulés / contrats de la cohorte' : '', caution: [lessHistory, exclusions].join(' ') };
      }
      case 'cancelYear':
      case 'cancelRef':
      case 'cancelCross': {
        const key = def.kind === 'cancelYear' ? c => c.year : def.kind === 'cancelRef' ? c => c.referential :
          c => c.year && c.referential ? c.year + ' · ' + c.referential : null;
        const eligible = contracts.filter(c => key(c));
        return withBars(chronological(cancellationBars(eligible, key, def.rate)), {
          n: eligible.filter(c => c.status).length, base: n, unit: def.rate ? '%' : contractUnit,
          scope: allScope + ' Annulés / total de la cohorte (y compris les annulés).',
          caution: [lessHistory, exclusions].join(' ')
        });
      }
      case 'clients': {
        const valid = active.flatMap(c => {
          const value = def.unit === contractUnit ? 1 : measure(c.items, def.unit);
          return c.group && value != null ? [{ group: c.group, value }] : [];
        });
        const bars = rank([...groupBy(valid, c => norm(c.group))].map(([, items]) => ({
          label: items[0].group, value: items.reduce((sum, item) => sum + item.value, 0), detail: integer(items.length) + ' contrats'
        })));
        return withBars(bars, { n: valid.length, base: active.length, unit: def.unit, scope: activeScope + ' Groupe principal Salesforce renseigné.' });
      }
      case 'concentration': {
        const known = active.filter(c => c.group);
        const top = rank(barsBy(known, c => norm(c.group))).slice(0, 10).reduce((sum, group) => sum + group.value, 0);
        return { ...result, n: known.length, base: active.length, unit: '%', share: known.length ? top / known.length : null,
          big: known.length ? top / known.length * 100 : null, scope: activeScope + ' Contrats avec groupe principal renseigné.',
          message: known.length ? integer(top) + ' / ' + integer(known.length) + ' contrats des groupes identifiés.' : '' };
      }
      case 'families':
      case 'familiesYear': {
        const annual = def.kind === 'familiesYear';
        const eligible = active.filter(c => !annual || c.year);
        const key = c => (annual ? c.year + ' · ' : '') + (c.family || 'Famille non renseignée ou contradictoire');
        return withBars((annual ? chronological : rank)(barsBy(eligible, key)), {
          n: eligible.filter(c => c.family).length, base: active.length,
          scope: activeScope + ' Famille Salesforce par contrat.'
        });
      }
      case 'decisions':
      case 'decisionRefs': {
        const key = c => def.kind === 'decisions' ? c.decision : c.referential;
        return withBars((def.kind === 'decisions' ? chronological : rank)(barsBy(dated, key)), {
          n: dated.filter(c => key(c)).length, base: contracts.filter(c => c.status === 'solde').length,
          scope: basis.dated
        });
      }
      case 'labelYears': {
        const eligible = contracts.filter(c => isEligible(c, def.group) && (def.group !== 'pending' || c.year));
        const key = c => def.group === 'pending' ? c.year : c.decision;
        const tagged = eligible.filter(c => labelValues(c, def.labelKey).length);
        const totals = new Map(barsBy(eligible, key).map(item => [item.label, item.value]));
        const counts = new Map(barsBy(tagged, key).map(item => [item.label, item.value]));
        const bars = [...totals].map(([label, total]) => ({ label, value: counts.get(label) ?? 0, detail: integer(total) + ' contrats éligibles' }));
        return withBars(chronological(bars), { n: tagged.length, base: eligible.length, scope: basis[def.group], caution: [reported, exclusions].join(' ') });
      }
      default: {
        const population = model.population || 'active';
        const eligible = contracts.filter(c => isEligible(c, population));
        const values = c => {
          if (def.kind === 'labelVersions') return labelValues(c, 'Bio').map(v => v.match(/\b(?:2013|2024)\b/)?.[0] || 'Version non renseignée');
          if (def.kind === 'labelLevels') return labelValues(c, def.labelKey);
          if (def.kind === 'reportedLevels') return c.items.flatMap(row => split(row.get(...def.aliases)));
          if (def.kind === 'performance') return c.items.flatMap(row => row.performance);
          if (def.kind === 'profiles') return c.items.map(row => row.profile);
          return c.items.flatMap(row => [...row.historical, ...row.performance.filter(v => /\b(?:bpec|bpe|tfpb)\b/.test(norm(v)))].flatMap(v => {
            const keys = norm(v).match(/\b(?:bpec|bpe|tfpb)\b/g);
            return keys?.length ? keys.map(key => key.toUpperCase()) : LABELS.some(label => label[3].test(norm(v))) ? [] : [v];
          }));
        };
        const distribution = tagBars(eligible, values);
        return { ...result, ...distribution, scope: basis[population], caution: [reported, exclusions].join(' ') };
      }
    }
  }

  function operationAnalysis(def, rows, model) {
    const keys = groupBy(rows, operationKey);
    if (def.kind === 'territory') {
      const values = [...keys.values()].flatMap(items => {
        const label = field(items, 'department');
        const value = def.unit === 'opérations' ? 1 : measure(items, def.unit);
        return label && value != null ? [{ label, value }] : [];
      });
      const bars = [...groupBy(values, item => item.label)].map(([label, items]) => ({
        label: 'Département ' + label, value: items.reduce((sum, item) => sum + item.value, 0)
      }));
      return { bars: rank(bars), n: values.length, base: keys.size, sample: 'opérations', unit: def.unit, scope: 'Opérations uniques dans le périmètre filtré.', caution: operationExclusion(rows) };
    }
    const activeKeys = groupBy(rows.filter(row => activeStatus(row.status)), operationKey);
    const selected = [...activeKeys.values()].flatMap(items => {
      const ref = field(items, 'referential');
      if (def.scope === 'housing' && !/logement/.test(norm(ref))) return [];
      if (def.scope === 'tertiary' && !/tertiaire/.test(norm(ref))) return [];
      if (model.segment && norm(ref) !== norm(model.segment)) return [];
      return [{ ref: ref || 'Référentiel indéterminé', value: measure(items, def.unit), items }];
    });
    const stats = distribution(selected.map(item => item.value));
    const groups = [...groupBy(selected, item => item.ref)].map(([label, items]) => ({ label, stats: distribution(items.map(item => item.value)) }));
    const scope = 'Opérations du portefeuille actif' + (model.segment ? ' · ' + model.segment : def.scope === 'housing' ? ' · logement' : def.scope === 'tertiary' ? ' · tertiaire' : '') + '. Valeurs strictement positives.';
    const eligibleWithoutId = rows.filter(row => !operationKey(row) && activeStatus(row.status) &&
      (!model.segment || norm(model.segment) === norm(row.referential)) &&
      (def.scope === 'all' || (def.scope === 'housing' ? /logement/ : /tertiaire/).test(norm(row.referential))));
    const caution = [operationExclusion([...selected.flatMap(item => item.items), ...eligibleWithoutId]),
      'Valeurs discordantes au sein d’une opération exclues.'].filter(Boolean).join(' ');
    const result = { n: stats.n, base: selected.length, stats, sample: 'opérations', unit: def.unit, scope, caution };
    if (def.kind === 'opPercentiles') return { ...result, curve: stats };
    const bars = groups.filter(g => g.stats.n).map(g => ({ label: g.label, value: g.stats.mean, detail: integer(g.stats.n) + ' opérations' }));
    return { ...result, bars: rank(bars), message: stats.n ? 'Moyenne du périmètre : ' + fmt(stats.mean) + ' ' + def.unit + ' par opération.' : '' };
  }

  function technicalAnalysis(def, rows, model) {
    const observations = groupBy(rows, row => {
      const op = operationKey(row);
      const building = clean(row.get('Bâtiment: Code interne', 'Code bâtiment', 'Identifiant bâtiment', 'Bâtiment'));
      if (model.observation === 'building') return op && building ? JSON.stringify([op, building]) : '';
      return op;
    });
    const scope = 'Périmètre filtré' + (model.segment ? ' · ' + model.segment : '') + '. Une observation par ' + (model.observation === 'building' ? 'bâtiment identifié dans l’opération.' : 'opération identifiée.');
    const caution = [operationExclusion(rows), model.observation === 'building' ? 'Les lignes sans identifiant de bâtiment sont exclues.' : 'Valeurs discordantes au sein d’une observation exclues.'].filter(Boolean).join(' ');
    const sample = model.observation === 'building' ? 'bâtiments' : 'opérations';
    const groups = [...observations.values()].filter(items => !model.segment || norm(field(items, 'referential')) === norm(model.segment));
    const result = { base: groups.length, sample, scope, caution };
    if (def.kind === 'technicalCategories') {
      const values = groups.map(items => from(items, def.aliases)).filter(Boolean);
      return { ...result, n: values.length, unit: sample, bars: rank(barsBy(values, v => v)) };
    }
    if (def.kind === 'dpeClasses') {
      const getClass = value => /^[A-G]$/i.test(clean(value)) ? clean(value).toUpperCase() : null;
      const pairs = groups.map(items => [from(items, def.before, getClass), from(items, def.after, getClass)]).filter(pair => pair.every(Boolean));
      return { ...result, n: pairs.length, unit: sample, bars: [...'ABCDEFG'].map(label => ({
        label, value: pairs.filter(pair => pair[1] === label).length, before: pairs.filter(pair => pair[0] === label).length
      })), legend: true, message: 'Distribution avant et après sur les mêmes observations renseignées.' };
    }
    const reading = items => {
      if (def.kind === 'pairedGain') {
        const before = from(items, def.before, nonnegative), after = from(items, def.after, nonnegative);
        return before != null && after != null ? before - after : null;
      }
      const value = from(items, def.aliases, nonnegative);
      if (value == null || !def.comparison) return value;
      const threshold = from(items, def.comparison, positive);
      return threshold == null ? null : 100 * value / threshold;
    };
    // Un référentiel ou une réglementation distincte constitue un périmètre de calcul distinct.
    const byScope = groupBy(groups, items => [field(items, 'referential'), field(items, 'regulation'), field(items, 'version')].filter(Boolean).join(' · ') || 'Périmètre réglementaire non renseigné');
    const panels = [...byScope].map(([label, items]) => ({ label, stats: distribution(items.map(reading)) })).filter(item => item.stats.n);
    const n = panels.reduce((sum, item) => sum + item.stats.n, 0);
    const stats = panels.length === 1 ? panels[0].stats : null;
    const bars = panels.map(item => ({ label: item.label, value: item.stats.mean, detail: integer(item.stats.n) + ' ' + sample }));
    return { ...result, n, unit: def.unit, stats, bars: rank(bars),
      curve: model.showCurve && stats ? stats : null,
      message: def.comparison ? '100 % correspond au seuil propre à chaque observation.' :
        def.kind === 'pairedGain' ? 'Un gain positif indique une baisse entre les deux mesures appariées.' :
          panels.length > 1 ? 'Moyennes calculées séparément par périmètre réglementaire.' : '' };
  }

  const lookup = new Map(definitions.map(def => [def.type, def]));
  const supported = type => lookup.has(type);
  const usesPopulation = def => ['labelLevels', 'labelVersions', 'historical', 'profiles', 'performance', 'reportedLevels'].includes(def.kind);
  const isSize = def => def.kind === 'opMean' || def.kind === 'opPercentiles';
  const usesOperations = def => isSize(def) || def.kind === 'territory';
  const usesTechnical = def => ['technicalCategories', 'technicalNumbers', 'dpeClasses', 'pairedGain'].includes(def.kind);
  function analyze(type, rows, model = {}) {
    const def = lookup.get(type);
    if (usesOperations(def)) return operationAnalysis(def, rows, model);
    if (usesTechnical(def)) return technicalAnalysis(def, rows, model);
    return contractAnalysis(def, rows, model);
  }

  const defaults = Object.fromEntries(definitions.map(def => [def.type, {
    title: def.label, dataFilter: {}, page: 1, segment: '', observation: 'operation', population: 'active',
    showStats: true, showCurve: true, showReading: true, ...(isSize(def) ? { sizeDetails: false } : {})
  }]));

  function controls(type, model, helpers, rows) {
    const def = lookup.get(type), p = key => type + '.' + key;
    const { field, selectField, toggleField } = helpers;
    const options = (tuples) => tuples.map(([value, label]) => ({ value, label }));
    const byRef = isSize(def) || usesTechnical(def);
    const references = unique(rows.map(row => row.referential)).sort(inOrder);
    return '<div class="control-section"><h3>Lecture et périmètre</h3>' +
      (byRef ? selectField(isSize(def) ? 'Référentiel étudié' : 'Référentiel comparé', p('segment'), options([
        ['', 'Tous les référentiels éligibles'],
        ...unique([...references, model.segment]).map(r => [r, r])
      ])) : '') +
      (usesTechnical(def) ? selectField('Unité d’observation', p('observation'), options([['operation', 'Opérations'], ['building', 'Bâtiments identifiés']])) : '') +
      (usesPopulation(def) ? selectField('Population Salesforce', p('population'), options([
        ['active', 'Portefeuille actif'], ['pending', 'Ambitions des contrats en cours'], ['sold', 'Mentions des contrats soldés'], ['dated', 'Mentions des contrats soldés avec décision datée']
      ])) : '') +
      (isSize(def) ? toggleField(def.kind === 'opMean' ? 'Afficher la comparaison et les statistiques' : 'Afficher la courbe et les centiles détaillés', p('sizeDetails')) : '') +
      (!isSize(def) || (def.kind === 'opMean' && model.sizeDetails) ? field('Page du graphique', p('page'), 'number') : '') +
      ((usesTechnical(def) && def.unit || def.kind === 'pairedGain') ? toggleField('Courbe de centiles si un seul périmètre', p('showCurve')) : '') +
      ((usesTechnical(def) || isSize(def) && model.sizeDetails) ? toggleField('Afficher les statistiques détaillées', p('showStats')) : '') +
      toggleField('Afficher la clé de lecture', p('showReading')) + '</div>';
  }

  const dark = '#123b30', green = '#22825a', muted = '#526c61', light = '#e0eee6', blue = '#6889a5';
  const rectangle = (x, y, width, height, color, radius = 0) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${color}"/>`;
  const text = (value, x, y, size, { color = dark, weight = 500, anchor = 'start' } = {}) =>
    `<text x="${x}" y="${y}" font-family="Arial" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(value)}</text>`;
  let measureContext;
  function wrap(value, size, width, weight = 500) {
    measureContext ||= document.createElement('canvas').getContext('2d');
    measureContext.font = weight + ' ' + size + 'px Arial';
    const lines = [];
    let line = '';
    for (const word of clean(value).split(/\s+/)) {
      if (!word) continue;
      if (line && measureContext.measureText(line + ' ' + word).width > width) {
        lines.push(line);
        line = '';
      }
      const pieces = [];
      let piece = '';
      for (const char of word) {
        if (piece && measureContext.measureText(piece + char).width > width) {
          pieces.push(piece);
          piece = '';
        }
        piece += char;
      }
      line = line ? line + ' ' + word : piece;
      lines.push(...pieces);
    }
    if (line) lines.push(line);
    return lines;
  }
  function paragraph(value, x, y, size, width, opts = {}) {
    return wrap(value, size, width, opts.weight).map((line, i) => text(line, x, y + i * size * 1.22, size, opts)).join('');
  }

  function barChart(bars, result, top, bottom) {
    const values = bars.flatMap(item => [item.value, item.before]).filter(Number.isFinite);
    const lo = Math.min(0, ...values), hi = Math.max(0, ...values);
    const width = 645, start = 576;
    const pos = value => start + width * (value - lo) / (hi - lo || 1);
    const zero = pos(0), band = Math.min(118, (bottom - top) / bars.length);
    const thickness = result.legend ? band * .2 : Math.min(47, band * .45);
    let out = rectangle(zero, top, 1.5, band * bars.length, '#a4b9ad');
    bars.forEach((item, i) => {
      const y = top + (i + .5) * band;
      const maxHeight = band - (item.detail ? 24 : 6);
      let labelSize = Math.max(14, Math.min(25, band * .28));
      let lines = wrap(item.label, labelSize, 502, 700);
      while (lines.length * labelSize * 1.22 > maxHeight && labelSize > 9) {
        labelSize--;
        lines = wrap(item.label, labelSize, 502, 700);
      }
      const labelY = y - (lines.length - 1) * labelSize * .61 + (item.detail ? -5 : 5);
      out += paragraph(item.label, 54, labelY, labelSize, 502, { weight: 700 });
      if (item.detail) out += text(item.detail, 54, y + band * .36, Math.min(17, band * .22), { color: muted });
      if (result.legend) out += rectangle(zero, y - thickness - 4, pos(item.before) - zero, thickness, blue, 4);
      if (Number.isFinite(item.value)) out += rectangle(Math.min(zero, pos(item.value)), y - (result.legend ? -4 : thickness / 2), Math.abs(pos(item.value) - zero), thickness, green, 4);
      const val = Number.isFinite(item.value) ? fmt(item.value) : '—';
      out += text(result.legend ? fmt(item.before) + ' → ' + val : val, 1508, y + 7, 24, { anchor: 'end', weight: 700 });
    });
    return out;
  }

  function curveChart(stats, top, bottom) {
    const left = 125, right = 1505;
    const delta = stats.max - stats.min;
    const x = p => left + (right - left) * p / 100;
    const y = value => delta ? bottom - (bottom - top) * (value - stats.min) / delta : (top + bottom) / 2;
    const probs = [0, ...statsLevels, 100];
    const values = probs.map(p => p === 0 ? stats.min : p === 100 ? stats.max : stats.quantiles[p]);
    let out = '';
    for (const v of delta ? [stats.min, (stats.min + stats.max) / 2, stats.max] : [stats.min]) {
      out += rectangle(left, y(v), right - left, 1, light) + text(fmt(v), left - 14, y(v) + 6, 18, { anchor: 'end', color: muted });
    }
    out += `<polyline fill="none" stroke="${green}" stroke-width="5" points="${probs.map((p, i) => x(p) + ',' + y(values[i])).join(' ')}"/>`;
    for (const p of [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
      out += text(p + ' %', x(p), bottom + 30, 17, { anchor: 'middle', color: muted });
    }
    out += probs.map((p, i) => `<circle cx="${x(p)}" cy="${y(values[i])}" r="5" fill="${green}"/>`).join('');
    return out + text('Rang centile', (left + right) / 2, bottom + 57, 19, { anchor: 'middle', color: muted });
  }

  function statTable(stats, y) {
    const entries = [
      ['Min.', stats.min], ['Max.', stats.max], ['Moy.', stats.mean], ['Médiane', stats.quantiles[50]],
      ...statsLevels.filter(p => p !== 50).map(p => ['P' + p, stats.quantiles[p]])
    ];
    return entries.map(([name, value], i) => {
      const x = 54 + (i % 9) * 165, top = y + Math.floor(i / 9) * 56;
      return rectangle(x, top, 153, 48, '#f0f7f3', 6) + text(name, x + 8, top + 17, 15, { color: muted }) +
        text(fmt(value), x + 8, top + 39, 19, { weight: 700 });
    }).join('');
  }

  function sizeSummary(def, result, model, top, scale) {
    const { stats, unit } = result;
    const percentile = def.kind === 'opPercentiles';
    const value = percentile ? stats.quantiles[80] : stats.mean;
    const noun = unit === 'm²' ? 'm²' : fmt(value) === '1' ? unit.slice(0, -1) : unit;
    const center = 800;
    const cardY = top + 45;
    const display = fmt(value);
    const caption = percentile ? 'Au plus' : 'En moyenne par opération';
    let out = rectangle(190, cardY, 1220, 445, '#eef6f0', 24);
    out += text(caption, center, cardY + 57, 33, { anchor: 'middle', weight: 700, color: muted });
    out += text(display, center, cardY + 205, Math.min(154, 136 * scale, 1660 / display.length), { anchor: 'middle', weight: 800, color: dark });
    out += text(noun, center, cardY + 258, 44, { anchor: 'middle', weight: 750, color: dark });
    const start = 380, width = 840, y = cardY + 305;
    out += rectangle(start, y, width, 17, '#cfe4d6', 8);
    if (percentile) {
      out += rectangle(start, y, width * stats.atOrBelow80 / stats.n, 17, green, 8);
      if (model.showReading !== false) {
        const n = stats.atOrBelow80;
        const verb = unit === 'm²' ? (n === 1 ? ' couvre' : ' couvrent') : (n === 1 ? ' compte' : ' comptent');
        const reading = integer(n) + (n === 1 ? ' opération sur ' : ' opérations sur ') + integer(stats.n) + verb + ' au plus ' + display + ' ' + noun + '.';
        out += paragraph(reading, center, cardY + 384, 31, 1150, { anchor: 'middle', weight: 700 });
      }
    } else {
      const marker = stats.min === stats.max ? center : start + width * (stats.mean - stats.min) / (stats.max - stats.min);
      out += `<circle cx="${marker}" cy="${y + 8.5}" r="13" fill="${green}" stroke="#fff" stroke-width="3"/>`;
      if (model.showReading !== false) {
        const reading = stats.min === stats.max ? 'Toutes les opérations renseignées ont la même valeur.' :
          'Les opérations étudiées vont de ' + fmt(stats.min) + ' à ' + fmt(stats.max) + ' ' + unit + '.';
        out += paragraph(reading, center, cardY + 384, 31, 1150, { anchor: 'middle', weight: 700 });
      }
    }
    const note = [percentile ? 'Seuil P80 interpolé' : '', stats.n < 10 ? 'Effectif faible, lecture indicative' : ''].filter(Boolean).join(' · ');
    if (note) out += text(note, center, cardY + 424, 20, { anchor: 'middle', color: muted });
    return out;
  }

  function svg(type, model, rows, options) {
    const def = lookup.get(type);
    const result = analyze(type, rows, model);
    const simpleSize = isSize(def) && !model.sizeDetails;
    const hasStats = !simpleSize && model.showStats !== false && result.stats?.n > 0;
    const hasReading = model.showReading !== false;
    const limit = hasStats ? 5 : hasReading ? 7 : 8;
    const allBars = result.bars || [];
    const pages = Math.max(1, Math.ceil(allBars.length / limit));
    const page = Math.min(pages, Math.max(1, Math.trunc(Number(model.page) || 1)));
    const bars = allBars.slice((page - 1) * limit, page * limit);
    const title = model.title || def.label;
    const scale = Math.max(.7, Math.min(1.35, Number(options.textScale) || 1));
    let titleSize = Math.min(54, 43 * scale);
    while (wrap(title, titleSize, 1280, 800).length > 2 && titleSize > 22) titleSize--;
    const titleLines = wrap(title, titleSize, 1280, 800);
    const top = Math.max(174, 117 + titleLines.length * titleSize * 1.22);
    const bottom = hasStats ? 542 : hasReading ? 680 : 762;
    let out = '<svg class="focused-slide-svg" xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="' + esc(title) + '">';
    out += rectangle(0, 0, 1600, 900, '#fff') + rectangle(53, 35, 7, 46, green, 3);
    out += paragraph(title, 74, 71, titleSize, 1280, { weight: 800 });
    if (options.logo) out += `<image href="${esc(options.logo)}" x="1434" y="18" width="115" height="79" preserveAspectRatio="xMidYMid meet"/>`;
    const scopeY = top - 63;
    const nLabel = options.connected ? 'Effectif exploitable : ' + integer(result.n) + ' / ' + integer(result.base) + ' ' + result.sample : 'Source d’opérations à connecter';
    out += text(nLabel, 54, scopeY, 23, { weight: 700 });
    if (options.connected) out += paragraph(result.scope, 54, scopeY + 29, 19, 1480, { color: muted });
    const plot = options.connected && rows.length && (Number.isFinite(result.big) || result.n > 0);
    let reading = result.message;
    if (!plot) {
      out += paragraph(options.connected ? 'Aucune donnée exploitable pour cet indicateur dans le périmètre.' : 'Connectez une source d’opérations depuis le menu Données.', 800, (top + bottom) / 2, 29, 1460, { anchor: 'middle', color: muted });
    } else if (simpleSize) {
      out += sizeSummary(def, result, model, top, scale);
    } else if (Number.isFinite(result.big)) {
      out += text(fmt(result.big) + (result.unit === '%' ? ' %' : ''), 800, top + (bottom - top) * .54, Math.min(170, 148 * scale), { anchor: 'middle', weight: 800, color: green });
      if (result.unit !== '%') out += text(result.unit, 800, top + (bottom - top) * .67, 32, { anchor: 'middle' });
      if (result.share != null) out += rectangle(360, bottom - 44, 880, 26, light, 13) + rectangle(360, bottom - 44, 880 * result.share, 26, green, 13);
    } else if (result.curve?.n) {
      out += text('Unité · ' + result.unit, 54, top, 19, { color: muted, weight: 700 });
      out += curveChart(result.curve, top + 38, bottom - 60);
      const p80 = result.curve.quantiles[80];
      const share = 100 * result.curve.atOrBelow80 / result.curve.n;
      reading = `P80 = ${fmt(p80)} ${result.unit} (seuil interpolé). ${fmt(share)} % des ${result.sample} observés sont à ce seuil ou en dessous.`;
      if (result.curve.n < 10) reading += ' Effectif faible, lecture indicative.';
    } else if (bars.length) {
      out += text(result.legend ? 'Avant (bleu) · Après (vert) · ' + result.unit : 'Unité · ' + result.unit, 54, top, 19, { color: muted, weight: 700 });
      if (pages > 1) out += text('Page ' + page + ' / ' + pages, 1508, top, 19, { anchor: 'end', color: muted });
      out += barChart(bars, result, top + 24, bottom);
      const sample = bars.find(item => Number.isFinite(item.value));
      if (!reading && sample) reading = sample.label + ' : ' + fmt(sample.value) + ' ' + result.unit + (sample.detail ? ' (' + sample.detail + ')' : '') + '.';
    }
    if (hasStats) out += statTable(result.stats, 557);
    if (!simpleSize && hasReading && reading && plot) {
      out += rectangle(54, 692, 1492, 91, '#ecf5ef', 12);
      out += text('CLÉ DE LECTURE', 73, 718, 15, { color: green, weight: 800 });
      out += paragraph(reading, 73, 749, 22, 1430);
    }
    if (options.connected && result.caution) out += paragraph(result.caution, 54, 814, 16, 1460, { color: muted });
    return out + '</svg>';
  }

  window.OBSFocusedSlides = { definitions, defaults, supported, controls, svg, rowsOf, analyze, distribution };
})();
