/**
 * PRESTATERRE OBSERVATOIRE — V29.1 DATA CONNECTED
 *
 * Google Sheet : onglet OPERATIONS
 * Ligne 1 : libre
 * Ligne 2 : en-têtes
 * Ligne 3 : libre / formules
 * Ligne 4 et suivantes : données
 *
 * Le préfixe OBSERVATOIRE_ évite les conflits avec d'autres CONFIG du projet.
 */
const OBSERVATOIRE_CONFIG = {
  SHEET_NAME: 'OPERATIONS',
  HEADER_ROW: 2,
  FIRST_DATA_ROW: 4
};

function doGet(e) {
  try {
    const operations = getObservatoireOperations_();
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        generatedAt: new Date().toISOString(),
        count: operations.length,
        operations: operations
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: String(error && error.message ? error.message : error)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
    .map(header => String(header || '').trim());

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
    .filter(row => row.some(cell => String(cell || '').trim() !== ''))
    .map(row => {
      const operation = {};
      headers.forEach((header, index) => {
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
