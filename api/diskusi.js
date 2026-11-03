const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
const SHEET_API_KEY = process.env.SHEET_API_KEY;
function send(res, code, body) { res.setHeader('Cache-Control', 'no-store'); res.status(code).json(body); }
async function callSheet(action, payload = {}) {
  if (!GAS_URL || !SHEET_API_KEY) throw new Error('Spreadsheet backend belum dikonfigurasi.');
  const r = await fetch(GAS_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow', body: JSON.stringify({ action, key: SHEET_API_KEY, payload }) });
  if (!r.ok) throw new Error('Apps Script tidak tersedia.');
  const data = await r.json();
  if (!data.ok) throw new Error(data.error || 'Gagal mengakses spreadsheet.');
  return data.data;
}
module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') return send(res, 200, { ok: true, posts: await callSheet('listDiscussions') });
    if (req.method === 'POST') {
      const p = req.body || {};
      const data = { title: String(p.title || '').trim().slice(0, 160), message: String(p.message || '').trim().slice(0, 2000), author: String(p.author || 'Petugas SMP').trim().slice(0, 100), topic: String(p.topic || 'Koordinasi umum').trim().slice(0, 80) };
      if (!data.title || !data.message) return send(res, 400, { ok: false, error: 'Judul dan isi diskusi wajib diisi.' });
      return send(res, 201, { ok: true, post: await callSheet('createDiscussion', data) });
    }
    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { ok: false, error: 'Metode tidak diizinkan.' });
  } catch (error) {
    console.error('api/diskusi:', error.message);
    return send(res, 503, { ok: false, error: 'Layanan spreadsheet belum siap atau sedang tidak tersedia.' });
  }
};

