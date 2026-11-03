const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
const SHEET_API_KEY = process.env.SHEET_API_KEY;

function reply(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

async function callSheet(action, payload = {}) {
  if (!GAS_URL || !SHEET_API_KEY) throw new Error('Spreadsheet backend belum dikonfigurasi.');
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    redirect: 'follow',
    body: JSON.stringify({ action, key: SHEET_API_KEY, payload }),
  });
  if (!response.ok) throw new Error(`Apps Script mengembalikan HTTP ${response.status}.`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'Gagal mengakses Google Sheets.');
  return result.data;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await callSheet('listReports');
      const reports = rows.map(({ id, createdAt, school, date, type, impact, status }) => ({ id, createdAt, school, date, type, impact, status }));
      return reply(res, 200, { ok: true, reports });
    }
    if (req.method === 'POST') {
      const p = req.body || {};
      const fields = ['school', 'npsn', 'date', 'phase', 'type', 'impact', 'detail', 'action', 'reporter', 'contact'];
      const data = Object.fromEntries(fields.map((k) => [k, String(p[k] || '').trim().slice(0, k === 'detail' || k === 'action' ? 2500 : 300)]));
      if (!data.school || !data.date || !data.detail) return reply(res, 400, { ok: false, error: 'Nama sekolah, tanggal, dan uraian wajib diisi.' });
      if (data.npsn && !/^\d{8}$/.test(data.npsn)) return reply(res, 400, { ok: false, error: 'NPSN harus terdiri dari 8 angka.' });
      if (p.website) return reply(res, 400, { ok: false, error: 'Permintaan tidak valid.' });
      const report = await callSheet('createReport', data);
      return reply(res, 201, { ok: true, report: { id: report.id, createdAt: report.createdAt, status: report.status } });
    }
    res.setHeader('Allow', 'GET, POST');
    return reply(res, 405, { ok: false, error: 'Metode tidak diizinkan.' });
  } catch (error) {
    console.error('api/laporan:', error.message);
    return reply(res, 503, { ok: false, error: 'Layanan spreadsheet belum siap atau sedang tidak tersedia.' });
  }
};


