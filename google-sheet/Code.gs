/**
 * Tech & Comms — school registrations + live website content.
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet
 * (replace everything that is there), save, run `setup` once, set the
 * ADMIN_PASSWORD script property, then deploy as a Web app. See README.md.
 *
 * What it does
 *  - POST {registration fields}            → adds a row to "Registrations" (public, as before)
 *  - GET  ?action=content                  → the website's live content (public, read-only)
 *  - POST {action:"login", password}       → checks the admin password
 *  - POST {action:"saveContent", password, content} → saves new website content (admin only)
 *  - POST {action:"stats", password}       → registrations per school (admin only)
 */

const SHEET_NAME = 'Registrations';
const SUMMARY_NAME = 'By school';
const HISTORY_NAME = 'Content history';
const HEADERS = ['Timestamp', 'Full name', 'Role', 'University / institution', 'Department', 'Level',
  'Email', 'Phone / WhatsApp', 'City / state', 'Message', 'Consent', 'Page'];
const FIELDS = ['name', 'role', 'university', 'department', 'level', 'email', 'phone', 'city', 'message', 'consent', 'page'];
const CONTENT_KEY = 'SITE_CONTENT';
const MAX_CONTENT = 9000;           // characters of JSON (Apps Script property limit is 9 KB)
const MAX_FAILS = 10;               // wrong passwords allowed per 15 minutes, across everyone

/** Run once from the editor: creates the tabs and their headers. */
function setup() {
  registrationsSheet_();
  const ss = spreadsheet_();
  let sum = ss.getSheetByName(SUMMARY_NAME);
  if (!sum) sum = ss.insertSheet(SUMMARY_NAME);
  sum.clear();
  sum.getRange('A1').setFormula(
    "=QUERY(" + SHEET_NAME + "!D2:D, \"select D, count(D) where D is not null group by D order by count(D) desc label D 'University', count(D) 'Registrations'\", 0)");
  sum.setFrozenRows(1);
  historySheet_();
  if (!PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD')) {
    Logger.log('Next: Project Settings → Script properties → add ADMIN_PASSWORD.');
  }
}

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'content') {
    const raw = PropertiesService.getScriptProperties().getProperty(CONTENT_KEY);
    return json_({ ok: true, content: raw ? JSON.parse(raw) : null });
  }
  return json_({ ok: true, service: 'Tech & Comms registrations' });
}

function doPost(e) {
  let d;
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  if (d.action) return adminAction_(d);
  return register_(d);
}

// ---------- registrations (public) ----------
function register_(d) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
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

// ---------- admin (password) ----------
function adminAction_(d) {
  const props = PropertiesService.getScriptProperties();
  const expected = props.getProperty('ADMIN_PASSWORD');
  if (!expected) return json_({ ok: false, error: 'no_admin_password_set' });
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('fails') || 0);
  if (fails >= MAX_FAILS) return json_({ ok: false, error: 'locked' });
  if (!safeEqual_(String(d.password || ''), expected)) {
    cache.put('fails', String(fails + 1), 900);
    Utilities.sleep(800);
    return json_({ ok: false, error: 'wrong_password' });
  }
  if (d.action === 'login') return json_({ ok: true });
  if (d.action === 'stats') return json_({ ok: true, stats: stats_() });
  if (d.action === 'saveContent') {
    const c = d.content;
    const problem = validateContent_(c);
    if (problem) return json_({ ok: false, error: 'invalid_content', detail: problem });
    const raw = JSON.stringify(c);
    if (raw.length > MAX_CONTENT) return json_({ ok: false, error: 'too_large' });
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      props.setProperty(CONTENT_KEY, raw);
      historySheet_().appendRow([new Date(), raw]);
    } finally { lock.releaseLock(); }
    return json_({ ok: true });
  }
  return json_({ ok: false, error: 'unknown_action' });
}

function validateContent_(c) {
  if (!c || typeof c !== 'object') return 'content missing';
  if (!Array.isArray(c.calendar)) return 'calendar must be a list';
  if (!Array.isArray(c.speakers)) return 'speakers must be a list';
  if (c.calendar.length > 100 || c.speakers.length > 40) return 'too many items';
  for (const s of c.calendar) if (!s || !String(s.university || '').trim()) return 'every stop needs a university';
  return '';
}

function stats_() {
  const sh = registrationsSheet_();
  const n = sh.getLastRow() - 1;
  if (n <= 0) return { total: 0, schools: [] };
  const vals = sh.getRange(2, 4, n, 1).getValues();
  const counts = {};
  vals.forEach(function (r) { const k = String(r[0] || '').trim(); if (k) counts[k] = (counts[k] || 0) + 1; });
  const schools = Object.keys(counts).map(function (k) { return { school: k, count: counts[k] }; })
    .sort(function (a, b) { return b.count - a.count; });
  return { total: n, schools: schools };
}

// ---------- helpers ----------
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

/** Every published version of the website content, newest at the bottom (copy one back to undo). */
function historySheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(HISTORY_NAME);
  if (!sh) {
    sh = ss.insertSheet(HISTORY_NAME);
    sh.appendRow(['Published at', 'Content (JSON)']);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  return sh;
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
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
