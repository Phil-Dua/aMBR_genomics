/**
 * aMBR Genomics team interview recorder.
 * Deployed as a Google Apps Script web app:
 * - Execute as: Me (yduan47@wisc.edu, the account that can edit the private Sheet)
 * - Who has access: Anyone with the link. No Wisc account is required.
 * The script writes the private sheet. People opening the form do not need Sheet edit access.
 * Do not share the response Sheet. Share only the form link.
 *
 * Saves go to the Responses tab by column name. Deleting a row, editing a cell,
 * reordering columns, or adding a notes column does not move the next interview.
 * Run prepareResponseSheet once from the editor after replacing this file.
 */
const RESPONSE_SHEET_ID = '1JG-N2IsdR4kYH-JupwXDsmcJZfwW9qE5hOTcxrb_V0o';
const RESPONSE_TAB = 'Responses';
const VERSION = '6.1-team-interview-record';
const ROLES = ['patient','caregiver','public','primary_care','specialist','genetic','nurse','scientist','laboratory','finance','administrator','payer','implementation','other'];
const USES = ['unsure','early','surveillance','diagnostic','recurrence'];
const SEGMENTS = ['unspecified','surveillance','diagnosed','caregiver','routine','other'];
const SOURCES = ['linkedin','social','direct','email','other'];
const HEADERS = [
  'Submission ID',
  'Submitted at (UTC)',
  'Stakeholder category',
  'Question bank ID',
  'Role subtype',
  'Self-described role',
  'Clinical use case / context',
  'Patient or caregiver segment',
  'Recruitment source',
  'Response 1',
  'Response 2',
  'Response 3',
  'Response 4',
  'Response 5',
  'Response 6',
  'Response 7',
  'Response 8',
  'Additional comments',
  'Acknowledged research-purpose notice',
  'Questionnaire version',
  'Question text snapshot (JSON)',
  'Submission status'
];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('aMBR Genomics | Interview notes')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}

/** Saves one interview record. Called only from the team web app. */
function submitResponse(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid submission.');
  if (data.hp) return {ok:true,id:'received'};
  if (data.version !== VERSION || !data.ack) throw new Error('Confirmation missing.');
  if (!ROLES.includes(data.bankId)) throw new Error('Invalid interviewee role.');
  if (!USES.includes(data.usecase) || !SEGMENTS.includes(data.segment) || !SOURCES.includes(data.source)) throw new Error('Invalid context.');
  if (!Array.isArray(data.questionTexts) || data.questionTexts.length !== 4) throw new Error('Invalid question text snapshot.');
  if (!data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers)) throw new Error('Invalid answers.');
  if (Object.keys(data.answers).some(function(k){ return !/^q[1-4]$/.test(k); })) throw new Error('Invalid question field.');
  var text = function(v, max) {
    if (typeof v !== 'string' && v != null) throw new Error('Invalid text field.');
    var s = String(v || '').trim();
    if (s.length > max) throw new Error('Response too long.');
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return s;
  };
  var answers = [1,2,3,4].map(function(n){ return text(data.answers['q' + n], 2500); });
  if (!answers.some(function(s){ return s; })) throw new Error('Record at least one answer.');
  var questionTexts = data.questionTexts.map(function(s){ return text(s, 350); });
  var id = Utilities.getUuid();
  var record = {
    'Submission ID': id,
    'Submitted at (UTC)': new Date().toISOString(),
    'Stakeholder category': data.bankId,
    'Question bank ID': data.bankId,
    'Role subtype': text(data.secondaryRole, 120),
    'Self-described role': text(data.selfRole, 120),
    'Clinical use case / context': data.usecase,
    'Patient or caregiver segment': data.segment,
    'Recruitment source': data.source,
    'Response 1': answers[0],
    'Response 2': answers[1],
    'Response 3': answers[2],
    'Response 4': answers[3],
    'Response 5': '',
    'Response 6': '',
    'Response 7': '',
    'Response 8': '',
    'Additional comments': text(data.additional, 2500),
    'Acknowledged research-purpose notice': 'Yes',
    'Questionnaire version': VERSION,
    'Question text snapshot (JSON)': JSON.stringify(questionTexts),
    'Submission status': 'Submitted'
  };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Service busy. Retry shortly.');
  try {
    appendInterviewRecord_(responseSheet_(), record);
  } finally {
    lock.releaseLock();
  }
  return {ok:true, id:id.substring(0, 8).toUpperCase()};
}

function verifySheetAccess() {
  var ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  var sheet = ss.getSheetByName(RESPONSE_TAB);
  if (!sheet) throw new Error('Responses tab not found');
  console.log('Connected successfully!');
  console.log('Spreadsheet: ' + ss.getName());
  console.log('Worksheet: ' + sheet.getName());
  console.log('Last row: ' + sheet.getLastRow());
  console.log('Last column: ' + sheet.getLastColumn());
  console.log('Tabs: ' + ss.getSheets().map(function(s){ return s.getName(); }).join(', '));
}

/**
 * One-time sheet cleanup. Safe to run again.
 * Removes leftover form tabs, test rows, and the filter that made new rows
 * land in the wrong place. Does not change real interview text.
 */
function prepareResponseSheet() {
  var ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  var removedTabs = [];
  ['Form Responses 1', 'Form Responses 2', 'Setup & notes'].forEach(function(name) {
    var extra = ss.getSheetByName(name);
    if (!extra || ss.getSheets().length < 2) return;
    try {
      ss.deleteSheet(extra);
      removedTabs.push(name);
    } catch (error) {
      console.log('Could not delete ' + name + ': ' + error.message);
    }
  });
  if (ss.getName().indexOf('STAGING') !== -1) ss.rename('aMBR Genomics — Interview notes');
  var sheet = responseSheet_();
  var filter = sheet.getFilter();
  if (filter) filter.remove();
  var removedRows = deleteKnownTestRows_(sheet);
  ensureHeaders_(sheet);
  trimEmptyGrid_(sheet);
  protectHeader_(sheet);
  SpreadsheetApp.flush();
  console.log(JSON.stringify({
    spreadsheet: ss.getName(),
    removedTabs: removedTabs,
    removedTestConfirmations: removedRows,
    remainingTabs: ss.getSheets().map(function(s){ return s.getName(); }),
    rows: sheet.getLastRow(),
    columns: sheet.getLastColumn()
  }));
}

function responseSheet_() {
  var ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  var sheet = ss.getSheetByName(RESPONSE_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(RESPONSE_TAB);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Writes one record on the next unused row, matched by header name.
 * appendRow is not used: a filter, a deleted row, or a note in a far
 * column makes appendRow skip or overwrite. This leaves every existing
 * row untouched.
 */
function appendInterviewRecord_(sheet, record) {
  ensureHeaders_(sheet);
  var columns = headerColumns_(sheet);
  if (submissionExists_(sheet, columns, record['Submission ID'])) return;
  var rowIndex = nextRecordRow_(sheet, columns);
  var width = lastHeaderColumn_(columns);
  // A short sheet has no row to write into. Grow it before touching that row.
  if (rowIndex > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), rowIndex - sheet.getMaxRows() + 20);
  }
  var line = sheet.getRange(rowIndex, 1, 1, width).getValues()[0];
  HEADERS.forEach(function(header) {
    line[columns[header] - 1] = record[header];
  });
  var filterState = liftFilter_(sheet);
  sheet.getRange(rowIndex, 1, 1, width).setValues([line]);
  restoreFilter_(sheet, filterState, Math.max(rowIndex, sheet.getLastRow()));
  SpreadsheetApp.flush();
}

function ensureHeaders_(sheet) {
  var first = String(sheet.getRange(1, 1).getValue() || '');
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(first)) {
    sheet.insertRowBefore(1);
    first = '';
  }
  if (!first.trim()) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }
  var columns = readHeaderColumns_(sheet);
  var missing = HEADERS.filter(function(header){ return !columns[header]; });
  if (!missing.length) return;
  var start = Math.max(sheet.getLastColumn(), 1) + 1;
  sheet.getRange(1, start, 1, missing.length).setValues([missing]);
}

function headerColumns_(sheet) {
  ensureHeaders_(sheet);
  var columns = readHeaderColumns_(sheet);
  HEADERS.forEach(function(header) {
    if (!columns[header]) throw new Error('Missing column: ' + header);
  });
  return columns;
}

function readHeaderColumns_(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, width).getValues()[0];
  var columns = {};
  headers.forEach(function(header, index) {
    var name = String(header || '').trim();
    if (name && !columns[name]) columns[name] = index + 1;
  });
  return columns;
}

function lastHeaderColumn_(columns) {
  return HEADERS.reduce(function(max, header) {
    return Math.max(max, columns[header] || 0);
  }, 1);
}

function nextRecordRow_(sheet, columns) {
  var width = lastHeaderColumn_(columns);
  var last = Math.max(sheet.getLastRow(), 1);
  var values = sheet.getRange(1, 1, last, width).getValues();
  for (var r = values.length - 1; r >= 1; r--) {
    if (values[r].some(function(cell){ return String(cell || '').trim(); })) return r + 2;
  }
  return 2;
}

function submissionExists_(sheet, columns, id) {
  var column = columns['Submission ID'];
  var last = sheet.getLastRow();
  if (!column || last < 2) return false;
  var ids = sheet.getRange(2, column, last - 1, 1).getValues();
  return ids.some(function(row){ return String(row[0] || '') === id; });
}

function liftFilter_(sheet) {
  var filter = sheet.getFilter();
  if (!filter) return null;
  var range = filter.getRange();
  var criteria = [];
  for (var column = range.getColumn(); column < range.getColumn() + range.getNumColumns(); column++) {
    var criterion = filter.getColumnFilterCriteria(column);
    if (criterion) criteria.push({column: column, criterion: criterion});
  }
  filter.remove();
  return criteria;
}

function restoreFilter_(sheet, criteria, lastRow) {
  if (!criteria) return;
  var width = Math.max(sheet.getLastColumn(), HEADERS.length);
  var filter = sheet.getRange(1, 1, Math.max(lastRow, 1), width).createFilter();
  criteria.forEach(function(item) {
    if (item.column <= width) filter.setColumnFilterCriteria(item.column, item.criterion);
  });
}

function protectHeader_(sheet) {
  var width = Math.max(sheet.getLastColumn(), HEADERS.length);
  sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function(protection) {
    if (protection.getRange().getRow() === 1) protection.remove();
  });
  var protection = sheet.getRange(1, 1, 1, width).protect();
  protection.setWarningOnly(true);
  protection.setDescription('Column names. The form uses these to place each answer. Interview rows below can be edited or deleted.');
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, width).setFontWeight('bold');
}

function trimEmptyGrid_(sheet) {
  var keepColumns = Math.max(sheet.getLastColumn(), HEADERS.length);
  var maxColumns = sheet.getMaxColumns();
  if (maxColumns > keepColumns) {
    var extraColumns = sheet.getRange(1, keepColumns + 1, sheet.getMaxRows(), maxColumns - keepColumns).getValues();
    var columnUsed = extraColumns.some(function(row) {
      return row.some(function(cell){ return String(cell || '').trim(); });
    });
    if (!columnUsed) sheet.deleteColumns(keepColumns + 1, maxColumns - keepColumns);
  }
  var keepRows = Math.max(sheet.getLastRow() + 50, 50);
  var maxRows = sheet.getMaxRows();
  if (maxRows > keepRows) sheet.deleteRows(keepRows + 1, maxRows - keepRows);
}

/** Removes the two known practice rows. A normal deleted interview is not recreated. */
function deleteKnownTestRows_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var width = Math.min(Math.max(sheet.getLastColumn(), 1), HEADERS.length);
  var values = sheet.getRange(2, 1, last - 1, width).getValues();
  var removed = [];
  for (var i = values.length - 1; i >= 0; i--) {
    var id = String(values[i][0] || '');
    var selfRole = String(values[i][5] || '');
    var answers = [9, 10, 11, 12].map(function(column){ return String(values[i][column] || ''); });
    var additional = String(values[i][17] || '');
    var fictional = id.indexOf('1b26de90-') === 0 && selfRole === 'FICTIONAL TEST';
    var freezeCheck = id.indexOf('1f79245a-') === 0 && answers.join('|') === '1|1|1|1' && additional === '1';
    if (!fictional && !freezeCheck) continue;
    sheet.deleteRow(i + 2);
    removed.push(id.substring(0, 8).toUpperCase());
  }
  return removed;
}
