const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
const SHEET_API_KEY = process.env.SHEET_API_KEY;
function send(res, code, body) { res.setHeader('Cache-Control', 'no-store'); res.status(code).json(body); }
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { ok: false, code: 'method_not_allowed' }); }
  const missing = [];
  if (!GAS_URL) missing.push('GOOGLE_APPS_SCRIPT_URL');
  if (!SHEET_API_KEY) missing.push('SHEET_API_KEY');
  if (missing.length) return send(res, 503, { ok: false, code: 'vercel_env_missing', message: 'Environment variable belum dipasang di Vercel.', missing });
  try {
    const response = await fetch(GAS_URL, { method: 'GET', redirect: 'follow', cache: 'no-store' });
    if (!response.ok) return send(res, 502, { ok: false, code: 'apps_script_http_error', message: `Apps Script merespons HTTP ${response.status}.` });
    const data = await response.json();
    if (!data.ok) return send(res, 502, { ok: false, code: 'apps_script_unhealthy', message: 'Pemeriksaan Apps Script gagal.' });
    if (!data.configured) return send(res, 503, { ok: false, code: 'script_properties_missing', message: 'SHEET_ID atau SHEET_API_KEY belum tersimpan di Script Properties.' });
    if (data.spreadsheetAccessible === false) return send(res, 503, { ok: false, code: 'spreadsheet_access_denied', message: 'Apps Script belum dapat membuka spreadsheet.' });
    if (data.tabsReady === false) return send(res, 503, { ok: false, code: 'sheet_tabs_missing', message: 'Tab laporan/diskusi belum siap. Jalankan setupSheets().' });
    return send(res, 200, { ok: true, code: 'connected', message: 'Vercel, Apps Script, dan Google Sheets siap.' });
  } catch (error) {
    console.error('api/health:', error.message);
    return send(res, 502, { ok: false, code: 'apps_script_unreachable', message: 'URL Web App tidak dapat diakses. Periksa deployment Apps Script dan URL /exec.' });
  }
};
