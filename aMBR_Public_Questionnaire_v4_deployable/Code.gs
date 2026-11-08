/**
 * aMBR Genomics team interview recorder.
 * Deployed as a Google Apps Script web app:
 * - Execute as: Me (yduan47@wisc.edu, the account that can edit the private Sheet)
 * - Who has access: Anyone with the link. No Wisc account is required.
 * The script writes the private sheet. People opening the form do not need Sheet edit access.
 * Do not share the response Sheet. Share only the form link.
 */
const RESPONSE_SHEET_ID = '1JG-N2IsdR4kYH-JupwXDsmcJZfwW9qE5hOTcxrb_V0o';
const RESPONSE_TAB = 'Responses';
const VERSION = '6.1-team-interview-record';
const ROLES = ['patient','caregiver','public','primary_care','specialist','genetic','nurse','scientist','laboratory','finance','administrator','payer','implementation','other'];
const USES = ['unsure','early','surveillance','diagnostic','recurrence'];
const SEGMENTS = ['unspecified','surveillance','diagnosed','caregiver','routine','other'];
const SOURCES = ['linkedin','social','direct','email','other'];

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
  // Four prompts, then four blanks, so the row still matches the 8-answer Responses sheet.
  var row = [
    id, new Date().toISOString(), data.bankId, data.bankId,
    text(data.secondaryRole, 120), text(data.selfRole, 120), data.usecase, data.segment, data.source,
    answers[0], answers[1], answers[2], answers[3], '', '', '', '',
    text(data.additional, 2500), 'Yes', VERSION,
    JSON.stringify(questionTexts), 'Submitted'
  ];
  if (row.length !== 22) throw new Error('Expected 22 columns, got ' + row.length);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Service busy. Retry shortly.');
  try {
    var sheet = SpreadsheetApp.openById(RESPONSE_SHEET_ID).getSheetByName(RESPONSE_TAB);
    if (!sheet) throw new Error('Response sheet unavailable.');
    sheet.appendRow(row);
    SpreadsheetApp.flush();
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
}
