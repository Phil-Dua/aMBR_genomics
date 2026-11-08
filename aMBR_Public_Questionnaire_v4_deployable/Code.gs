/**
 * aMBR Genomics public self-service customer discovery questionnaire.
 * Deployed as a Google Apps Script Web app:
 * - Execute as: Me (an aMBR team account with edit access to the private Sheet)
 * - Who has access: Anyone (public form; responses remain team-only)
 * Do not share the response Sheet with the public.
 */
const RESPONSE_SHEET_ID = '1JG-N2IsdR4kYH-JupwXDsmcJZfwW9qE5hOTcxrb_V0o';
const RESPONSE_TAB = 'Responses';
const VERSION = '4.0-public-self-service';
const ROLES = ['patient','caregiver','public','primary_care','specialist','genetic','nurse','scientist','laboratory','finance','administrator','payer','implementation','other'];
const USES = ['unsure','early','surveillance','diagnostic','recurrence'];
const SEGMENTS = ['unspecified','surveillance','diagnosed','caregiver','routine','other'];
const SOURCES = ['linkedin','social','direct','email','other'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('aMBR Genomics | Customer discovery questionnaire')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}

/** The only intentionally public server method for browser submissions. */
function submitResponse(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid submission.');
  if (data.hp) return {ok:true,id:'received'}; // honeypot: do not persist bots
  if (data.version !== VERSION || !data.ack) throw new Error('Consent/version missing.');
  if (!ROLES.includes(data.bankId)) throw new Error('Invalid respondent role.');
  if (!USES.includes(data.usecase) || !SEGMENTS.includes(data.segment) || !SOURCES.includes(data.source)) throw new Error('Invalid context.');
  if (!Array.isArray(data.otherRoles) || data.otherRoles.length>ROLES.length || data.otherRoles.some(r=>!ROLES.includes(r))) throw new Error('Invalid secondary roles.');
  if (!data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers)) throw new Error('Invalid answers.');
  if (!Array.isArray(data.questionTexts) || data.questionTexts.length!==8) throw new Error('Invalid question text snapshot.');
  if (Object.keys(data.answers).some(k=>!/^q[1-8]$/.test(k))) throw new Error('Invalid question field.');
  const text = (v,max) => {
    if (typeof v !== 'string' && v != null) throw new Error('Invalid text field.');
    let s=String(v||'').trim();
    if (s.length>max) throw new Error('Response too long.');
    // Protect spreadsheet interpretation of untrusted responses as formulas.
    if (/^[\s]*[=+@-]/.test(s)) s="'"+s;
    return s;
  };
  const answers=Array.from({length:8},(_,i)=>text(data.answers['q'+(i+1)],4000));
  const questionTexts=data.questionTexts.map(s=>text(s,350));
  const extras=text(data.additional,4000);
  const selfRole=text(data.selfRole,120);
  const id=Utilities.getUuid();
  const row=[
    id, new Date().toISOString(),data.bankId,data.bankId,
    data.otherRoles.join(', '),selfRole,data.usecase,data.segment,data.source,
    ...answers,extras,'Yes',VERSION,
    JSON.stringify(questionTexts),'Submitted'
  ];
  const lock=LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Service busy. Retry shortly.');
  try {
    const sheet=SpreadsheetApp.openById(RESPONSE_SHEET_ID).getSheetByName(RESPONSE_TAB);
    if (!sheet) throw new Error('Response sheet unavailable.');
    if (sheet.getLastColumn()<row.length) throw new Error('Response sheet schema mismatch.');
    sheet.appendRow(row);
    SpreadsheetApp.flush();
  } finally {lock.releaseLock();}
  return {ok:true,id:id.substring(0,8).toUpperCase()};
}

function verifySheetAccess() {
  const ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  const sheet = ss.getSheetByName(RESPONSE_TAB);
  if (!sheet) throw new Error('Responses tab not found');
  console.log('Connected successfully!');
  console.log('Spreadsheet: ' + ss.getName());
  console.log('Worksheet: ' + sheet.getName());
}
