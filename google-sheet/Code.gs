/**
 * Tech & Comms — school registrations.
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet,
 * run `setup` once, then deploy it as a Web app (see README.md in this folder).
 * The website POSTs each registration here and it becomes a new row.
 */

const SHEET_NAME = 'Registrations';
const SUMMARY_NAME = 'By school';
const HEADERS = ['Timestamp', 'Full name', 'Role', 'University / institution', 'Department', 'Level',
  'Email', 'Phone / WhatsApp', 'City / state', 'Message', 'Consent', 'Page'];
const FIELDS = ['name', 'role', 'university', 'department', 'level', 'email', 'phone', 'city', 'message', 'consent', 'page'];

/** Run once from the editor: creates the two tabs and their headers. */
function setup() {
  registrationsSheet_();
  const ss = spreadsheet_();
  let sum = ss.getSheetByName(SUMMARY_NAME);
  if (!sum) sum = ss.insertSheet(SUMMARY_NAME);
  sum.clear();
  sum.getRange('A1').setFormula(
    "=QUERY(" + SHEET_NAME + "!D2:D, \"select D, count(D) where D is not null group by D order by count(D) desc label D 'University', count(D) 'Registrations'\", 0)");
  sum.setFrozenRows(1);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return json_({ ok: true });                 // spam trap filled in: pretend success, store nothing
    if (!clean_(d.name) || !clean_(d.university)) return json_({ ok: false, error: 'missing_fields' });
    if (!clean_(d.email) && !clean_(d.phone)) return json_({ ok: false, error: 'missing_contact' });
    if (d.consent !== 'Yes') return json_({ ok: false, error: 'no_consent' });
    const row = [new Date()].concat(FIELDS.map(function (k) { return clean_(d[k]); }));
    registrationsSheet_().appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server_error', detail: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/** Visiting the web app URL in a browser shows this, which confirms the deployment works. */
function doGet() {
  return json_({ ok: true, service: 'Tech & Comms registrations' });
}

/** The sheet this script is attached to (create the script from the sheet: Extensions → Apps Script). */
function spreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('spreadsheet not found - create this script from the sheet via Extensions > Apps Script');
  return ss;
}

function registrationsSheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME, 0);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

/** Trim, cap the length, and stop text from being read as a spreadsheet formula. */
function clean_(v) {
  let s = String(v == null ? '' : v).trim().slice(0, 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
