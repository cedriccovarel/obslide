/**
 * PRESTATERRE OBSERVATOIRE — V29.7.13
 * DATA CONNECTED + ZONAGE LOGEMENT SOCIAL 1 / 1 BIS / 2 / 3
 *
 * Principe important :
 * - le navigateur n'appelle PLUS un endpoint Zone123 séparé ;
 * - le doGet() habituel enrichit directement les opérations avec leur zonage ;
 * - la slide lit donc le zonage dans la même réponse /exec que les opérations.
 *
 * Google Sheet : onglet OPERATIONS
 * Ligne 1 : libre
 * Ligne 2 : en-têtes
 * Ligne 3 : libre / formules
 * Ligne 4 et suivantes : données
 */
const OBSERVATOIRE_CONFIG = {
  SHEET_NAME: 'OPERATIONS',
  HEADER_ROW: 2,
  FIRST_DATA_ROW: 4,
  ZONE123_URLS: [
    'https://gitlab.com/pidila/sp-simulateurs-data/-/raw/master/donnees-de-reference/Zone123.json',
    'https://www.data.gouv.fr/api/1/datasets/r/eedf8bf6-052f-4354-b80c-fe9c1065693a'
  ],
  COMMUNES_API_BASE: 'https://geo.api.gouv.fr/communes'
};

function doGet(e) {
  try {
    const operations = getObservatoireOperations_();
    let zone123Status = { ok: true, matched: 0, unmatched: 0, source: 'DILA / Service-Public' };

    try {
      const zoneIndex = getZone123Index_();
      const enriched = enrichOperationsWithZone123_(operations, zoneIndex);
      zone123Status.matched = enriched.matched;
      zone123Status.unmatched = enriched.unmatched;
    } catch (zoneError) {
      // La base opérations reste disponible même si la ressource officielle
      // est temporairement indisponible côté serveur.
      zone123Status = {
        ok: false,
        matched: 0,
        unmatched: operations.length,
        source: 'DILA / Service-Public',
        error: String(zoneError && zoneError.message ? zoneError.message : zoneError)
      };
    }

    return jsonOutput_({
      ok: true,
      generatedAt: new Date().toISOString(),
      count: operations.length,
      operations: operations,
      zone123Status: zone123Status
    });
  } catch (error) {
    return jsonOutput_({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  }
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function fetchJson_(url) {
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { Accept: 'application/json,text/plain,*/*' }
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) throw new Error('HTTP ' + status + ' sur ' + url);
  return JSON.parse(response.getContentText('UTF-8'));
}

function getZone123Rows_() {
  const errors = [];
  for (let i = 0; i < OBSERVATOIRE_CONFIG.ZONE123_URLS.length; i += 1) {
    const url = OBSERVATOIRE_CONFIG.ZONE123_URLS[i];
    try {
      const json = fetchJson_(url);
      const rows = Array.isArray(json)
        ? json
        : (Array.isArray(json.zone123) ? json.zone123 : (Array.isArray(json.data) ? json.data : []));
      if (!rows.length) throw new Error('Aucune ligne Zone123 trouvée');
      return rows;
    } catch (error) {
      errors.push(String(error && error.message ? error.message : error));
    }
  }
  throw new Error('Référentiel Zone123 indisponible côté serveur : ' + errors.join(' | '));
}

function getZone123Index_() {
  const rows = getZone123Rows_();
  const byInsee = {};
  const byNameDepartment = {};
  const byName = {};

  rows.forEach(function(item) {
    const insee = String(item.codeInsee || item.code_insee || item.insee || item.code || '').trim();
    const commune = String(item.nomCommune || item.nom_commune || item.commune || item.nom || '').trim();
    const zone = normalizeZone123_(item.zone || item.zonage || item.zone123 || '');
    if (!insee || !commune || !zone) return;
    const dep = departmentFromInsee_(insee);
    const row = { insee: insee, commune: commune, department: dep, zone: zone };
    byInsee[insee] = row;
    byNameDepartment[dep + '|' + normalizeText_(commune)] = row;
    const nameKey = normalizeText_(commune);
    if (!byName[nameKey]) byName[nameKey] = [];
    byName[nameKey].push(row);
  });

  return { byInsee: byInsee, byNameDepartment: byNameDepartment, byName: byName };
}

function normalizeZone123_(value) {
  const raw = String(value || '').trim();
  const s = normalizeText_(raw).replace(/\s+/g, '');
  if (!s) return '';
  if (s.indexOf('1bis') >= 0 || s.indexOf('ibis') >= 0) return 'Zone 1 bis';
  if (s === '3' || s === 'iii' || s === 'zone3' || s === 'zoneiii') return 'Zone 3';
  if (s === '2' || s === 'ii' || s === 'zone2' || s === 'zoneii') return 'Zone 2';
  if (s === '1' || s === 'i' || s === 'zone1' || s === 'zonei') return 'Zone 1';
  return raw;
}

function normalizeText_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’'`´\-]/g, ' ')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bsainte\b/g, 'ste')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function departmentFromInsee_(insee) {
  const code = String(insee || '').toUpperCase();
  if (/^97[1-6]/.test(code)) return code.slice(0, 3);
  if (/^2A|^2B/.test(code)) return code.slice(0, 2);
  if (/^20/.test(code)) {
    const n = Number(code);
    return n >= 20200 ? '2B' : '2A';
  }
  return code.slice(0, 2);
}

function departmentFromPostalCode_(postalCode) {
  const cp = String(postalCode || '').match(/\b(97[1-6]\d{2}|\d{5})\b/);
  if (!cp) return '';
  const value = cp[1];
  if (/^97[1-6]/.test(value)) return value.slice(0, 3);
  if (value.indexOf('20') === 0) {
    const n = Number(value);
    return (n >= 20200 || n >= 20600) ? '2B' : '2A';
  }
  return value.slice(0, 2);
}

function rowValueByAliases_(row, aliases) {
  const keys = Object.keys(row || {});
  const normalized = {};
  keys.forEach(function(key) { normalized[normalizeText_(key)] = key; });

  for (let i = 0; i < aliases.length; i += 1) {
    const alias = normalizeText_(aliases[i]);
    if (normalized[alias] !== undefined) {
      const value = row[normalized[alias]];
      if (String(value == null ? '' : value).trim() !== '') return value;
    }
  }

  for (let i = 0; i < aliases.length; i += 1) {
    const alias = normalizeText_(aliases[i]);
    for (let j = 0; j < keys.length; j += 1) {
      const keyNorm = normalizeText_(keys[j]);
      if (keyNorm.indexOf(alias) >= 0) {
        const value = row[keys[j]];
        if (String(value == null ? '' : value).trim() !== '') return value;
      }
    }
  }
  return '';
}

function operationLocationHints_(operation) {
  let postalCode = String(rowValueByAliases_(operation, ['code postal','cp','postal code']) || '').trim();
  let city = String(rowValueByAliases_(operation, ['commune','ville','nom commune',"commune de l'opération","commune de l'operation","ville de l'opération","ville de l'operation"]) || '').trim();
  const address = String(rowValueByAliases_(operation, ['adresse opération','adresse operation','adresse']) || '').trim();
  let department = String(rowValueByAliases_(operation, ['département','departement','dept','code département','code departement']) || '').trim();

  if (!postalCode) {
    const m = address.match(/\b(97[1-6]\d{2}|\d{5})\b/);
    if (m) postalCode = m[1];
  }
  if (!city && address) {
    const m = address.match(/\b\d{5}\s+([^,;]+)$/i);
    if (m) city = String(m[1] || '').replace(/cedex.*/i, '').trim();
  }
  department = normalizeDepartmentCode_(department) || departmentFromPostalCode_(postalCode);

  return { postalCode: postalCode, city: city, address: address, department: department };
}

function normalizeDepartmentCode_(value) {
  const raw = String(value || '').toUpperCase().trim();
  if (!raw) return '';
  const m = raw.match(/(2A|2B|97[1-6]|\d{1,2})/);
  if (!m) return '';
  const code = m[1];
  if (code === '2A' || code === '2B' || /^97[1-6]$/.test(code)) return code;
  return code.padStart(2, '0');
}

function resolveCommuneFromGeoApi_(hints) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'commune|' + normalizeText_(hints.city) + '|' + hints.postalCode + '|' + hints.department;
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  const queries = [];
  const fields = 'nom,code,centre,departement';
  if (hints.city && hints.department) {
    queries.push(OBSERVATOIRE_CONFIG.COMMUNES_API_BASE + '?nom=' + encodeURIComponent(hints.city) + '&codeDepartement=' + encodeURIComponent(hints.department) + '&fields=' + encodeURIComponent(fields) + '&boost=population&limit=5');
  }
  if (hints.postalCode) {
    queries.push(OBSERVATOIRE_CONFIG.COMMUNES_API_BASE + '?codePostal=' + encodeURIComponent(hints.postalCode) + '&fields=' + encodeURIComponent(fields) + '&boost=population&limit=10');
  }
  if (hints.city) {
    queries.push(OBSERVATOIRE_CONFIG.COMMUNES_API_BASE + '?nom=' + encodeURIComponent(hints.city) + '&fields=' + encodeURIComponent(fields) + '&boost=population&limit=5');
  }

  for (let i = 0; i < queries.length; i += 1) {
    try {
      const data = fetchJson_(queries[i]);
      if (!Array.isArray(data) || !data.length) continue;
      const cityKey = normalizeText_(hints.city);
      const department = hints.department;
      let best = null;
      let bestScore = -1;
      data.forEach(function(candidate, index) {
        const nameKey = normalizeText_(candidate.nom || '');
        const candidateDepartment = normalizeDepartmentCode_(candidate.departement && candidate.departement.code);
        let score = 0;
        if (cityKey && nameKey === cityKey) score += 12;
        else if (cityKey && (nameKey.indexOf(cityKey) >= 0 || cityKey.indexOf(nameKey) >= 0)) score += 6;
        if (department && candidateDepartment === department) score += 4;
        score += Math.max(0, 1 - index * 0.1);
        if (score > bestScore) { best = candidate; bestScore = score; }
      });
      if (best) {
        const result = {
          nom: String(best.nom || '').trim(),
          code: String(best.code || '').trim(),
          department: normalizeDepartmentCode_(best.departement && best.departement.code),
          centre: best.centre || null
        };
        try { cache.put(cacheKey, JSON.stringify(result), 21600); } catch (e) {}
        return result;
      }
    } catch (e) {}
  }
  return null;
}

function enrichOperationsWithZone123_(operations, zoneIndex) {
  let matched = 0;
  let unmatched = 0;

  operations.forEach(function(operation) {
    const hints = operationLocationHints_(operation);
    let zoneRow = null;
    let resolved = null;

    if (hints.city && hints.department) {
      zoneRow = zoneIndex.byNameDepartment[hints.department + '|' + normalizeText_(hints.city)] || null;
    }
    if (!zoneRow && hints.city) {
      const candidates = zoneIndex.byName[normalizeText_(hints.city)] || [];
      if (candidates.length === 1) zoneRow = candidates[0];
      else if (hints.department) zoneRow = candidates.find(function(item) { return item.department === hints.department; }) || null;
    }

    if (!zoneRow) {
      resolved = resolveCommuneFromGeoApi_(hints);
      if (resolved && resolved.code) zoneRow = zoneIndex.byInsee[resolved.code] || null;
    }

    // Même quand le zonage est trouvé directement par Ville + département,
    // on récupère le centre officiel de la commune pour localiser précisément
    // l'opération sur la carte de détail.
    if (zoneRow && (!resolved || !resolved.code)) {
      resolved = resolveCommuneFromGeoApi_({
        postalCode: hints.postalCode,
        city: zoneRow.commune || hints.city,
        address: hints.address,
        department: zoneRow.department || hints.department
      });
    }

    if (zoneRow) {
      matched += 1;
      operation['Zonage logement social 1/2/3'] = zoneRow.zone;
      operation['Commune zonage'] = zoneRow.commune || (resolved && resolved.nom) || hints.city || '';
      operation['Code INSEE commune'] = zoneRow.insee || (resolved && resolved.code) || '';
      operation['Département zonage'] = zoneRow.department || (resolved && resolved.department) || hints.department || '';
      if (resolved && resolved.centre && Array.isArray(resolved.centre.coordinates)) {
        operation['Longitude commune'] = resolved.centre.coordinates[0];
        operation['Latitude commune'] = resolved.centre.coordinates[1];
      }
    } else {
      unmatched += 1;
      operation['Zonage logement social 1/2/3'] = '';
      operation['Commune zonage'] = (resolved && resolved.nom) || hints.city || '';
      operation['Code INSEE commune'] = (resolved && resolved.code) || '';
      operation['Département zonage'] = (resolved && resolved.department) || hints.department || '';
    }
  });

  return { matched: matched, unmatched: unmatched };
}

function getObservatoireOperations_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(OBSERVATOIRE_CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('Onglet "' + OBSERVATOIRE_CONFIG.SHEET_NAME + '" introuvable.');

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1 || lastRow < OBSERVATOIRE_CONFIG.HEADER_ROW) return [];

  const headers = sheet
    .getRange(OBSERVATOIRE_CONFIG.HEADER_ROW, 1, 1, lastColumn)
    .getDisplayValues()[0]
    .map(function(header) { return String(header || '').trim(); });

  if (lastRow < OBSERVATOIRE_CONFIG.FIRST_DATA_ROW) return [];

  const rows = sheet
    .getRange(
      OBSERVATOIRE_CONFIG.FIRST_DATA_ROW,
      1,
      lastRow - OBSERVATOIRE_CONFIG.FIRST_DATA_ROW + 1,
      lastColumn
    )
    .getDisplayValues();

  return rows
    .filter(function(row) { return row.some(function(cell) { return String(cell || '').trim() !== ''; }); })
    .map(function(row) {
      const operation = {};
      headers.forEach(function(header, index) {
        if (!header) return;
        operation[header] = row[index] == null ? '' : row[index];
      });
      return operation;
    });
}

function testerObservatoireConnexion() {
  const operations = getObservatoireOperations_();
  Logger.log('Nombre de lignes de données détectées : ' + operations.length);
  if (operations.length) Logger.log(JSON.stringify(operations[0], null, 2));
}

function testerZonage123() {
  const operations = getObservatoireOperations_();
  const index = getZone123Index_();
  const result = enrichOperationsWithZone123_(operations.slice(0, Math.min(operations.length, 20)), index);
  Logger.log('Test zonage : ' + JSON.stringify(result));
  if (operations.length) Logger.log(JSON.stringify(operations[0], null, 2));
}

function verifierObservatoire() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(OBSERVATOIRE_CONFIG.SHEET_NAME);
  Logger.log('Fichier : ' + spreadsheet.getName());
  if (!sheet) {
    Logger.log('ERREUR : onglet OPERATIONS introuvable.');
    return;
  }
  Logger.log('Onglet trouvé : ' + sheet.getName());
  Logger.log('Ligne des en-têtes : ' + OBSERVATOIRE_CONFIG.HEADER_ROW);
  Logger.log('Première ligne de données : ' + OBSERVATOIRE_CONFIG.FIRST_DATA_ROW);
  Logger.log('Dernière ligne utilisée : ' + sheet.getLastRow());
  Logger.log('Dernière colonne utilisée : ' + sheet.getLastColumn());
  Logger.log('Nombre de lignes de données détectées : ' + getObservatoireOperations_().length);
}
