/** Helpdesk TKA SMP Banyuwangi - bridge to Google Sheets.
 * Set Script Properties before deployment:
 *   SHEET_ID = 1wk4JYy2qlwkAsItke_v7e5BUQ9ac4xpgkn4K86xfDYc
 *   SHEET_API_KEY = same long random value configured in Vercel
 */
const REPORT_HEADERS = ['id','createdAt','school','npsn','date','phase','type','impact','detail','action','reporter','contact','status'];
const DISCUSSION_HEADERS = ['id','createdAt','topic','title','message','author'];

// Health check for opening the Web App URL in a browser.
// Data operations still require POST + the shared API key in doPost().
function doGet() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty('SHEET_ID');
  const configured = Boolean(sheetId && props.getProperty('SHEET_API_KEY'));
  let spreadsheetAccessible = false;
  let tabsReady = false;
  if (configured) {
    try {
      const ss = SpreadsheetApp.openById(sheetId);
      spreadsheetAccessible = true;
      tabsReady = Boolean(ss.getSheetByName('Laporan SMP') && ss.getSheetByName('Diskusi SMP'));
    } catch (err) {
      spreadsheetAccessible = false;
    }
  }
  return json_({
    ok: true,
    service: 'Helpdesk TKA SMP Banyuwangi Sheets API',
    configured: configured,
    spreadsheetAccessible: spreadsheetAccessible,
    tabsReady: tabsReady,
    message: !configured ? 'Script Properties belum lengkap.' : !spreadsheetAccessible ? 'Apps Script belum dapat membuka spreadsheet.' : !tabsReady ? 'Tab layanan belum dibuat.' : 'Web App dan Google Sheets siap.'
  });
}

function setupSheets() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  if (!id) throw new Error('Set Script Property SHEET_ID terlebih dahulu.');
  const ss = SpreadsheetApp.openById(id);
  ensureSheet_(ss, 'Laporan SMP', REPORT_HEADERS);
  ensureSheet_(ss, 'Diskusi SMP', DISCUSSION_HEADERS);
  Logger.log('Tab Laporan SMP dan Diskusi SMP siap: ' + ss.getUrl());
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty('SHEET_API_KEY');
    if (!expected || !body.key || !constantTimeEqual_(String(body.key), expected)) {
      return json_({ ok: false, error: 'Unauthorized' });
    }
    const props = PropertiesService.getScriptProperties();
    const ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
    const payload = body.payload || {};
    let data;
    switch (body.action) {
      case 'listReports': data = listRows_(ss, 'Laporan SMP', REPORT_HEADERS); break;
      case 'createReport': data = createRow_(ss, 'Laporan SMP', REPORT_HEADERS, payload, 'report'); break;
      case 'listDiscussions': data = listRows_(ss, 'Diskusi SMP', DISCUSSION_HEADERS); break;
      case 'createDiscussion': data = createRow_(ss, 'Diskusi SMP', DISCUSSION_HEADERS, payload, 'discussion'); break;
      default: return json_({ ok: false, error: 'Action tidak dikenal.' });
    }
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#dbeafe');
    sheet.autoResizeColumns(1, headers.length);
  }
}

function listRows_(ss, sheetName, headers) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const count = Math.min(sheet.getLastRow() - 1, 500);
  const values = sheet.getRange(sheet.getLastRow() - count + 1, 1, count, headers.length).getDisplayValues();
  return values.reverse().map(function(row) {
    const item = {};
    headers.forEach(function(key, i) { item[key] = row[i]; });
    return item;
  });
}

function createRow_(ss, sheetName, headers, payload, kind) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error('Tab belum ada; jalankan setupSheets().');
    const now = new Date().toISOString();
    const id = Utilities.getUuid();
    const status = kind === 'report' ? 'Belum ditangani' : '';
    const rowObj = Object.assign({}, payload, { id: id, createdAt: now, status: status });
    const row = headers.map(function(key) { return safeCell_(rowObj[key] || ''); });
    sheet.appendRow(row);
    headers.forEach(function(key) { rowObj[key] = String(rowObj[key] || ''); });
    return rowObj;
  } finally {
    lock.releaseLock();
  }
}

function safeCell_(value) {
  let text = String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, 3000);
  if (/^[=+@\-]/.test(text)) text = "'" + text;
  return text;
}

function constantTimeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
