# Helpdesk TKA SMP Banyuwangi

Aplikasi Vercel statis + Serverless Functions dengan Google Apps Script sebagai jembatan ke spreadsheet.

## Data yang dipakai

- Spreadsheet ID: `1wk4JYy2qlwkAsItke_v7e5BUQ9ac4xpgkn4K86xfDYc`
- Tab otomatis: `Laporan SMP` dan `Diskusi SMP`
- Browser memanggil `/api/health`, `/api/laporan`, dan `/api/diskusi`. Kunci Google Sheets disimpan sebagai environment variable di Vercel dan Script Properties Apps Script, tidak diletakkan di HTML.
- Dashboard hanya menerima kolom ringkas. Uraian laporan, tindakan, dan kontak petugas tidak dikirim dalam respons dashboard.
- Logo Tut Wuri Handayani menjadi aset lokal agar tidak bergantung pada hotlink gambar pihak ketiga. Grafik dashboard dibuat dengan SVG dari data laporan yang dibaca dari Sheets.

## 1. Siapkan Google Apps Script

1. Buka [script.google.com](https://script.google.com/) dengan akun yang memiliki akses edit ke spreadsheet di atas, lalu buat project.
2. Salin `gas/Code.gs` ke editor.
3. Di **Project Settings → Script Properties**, tambahkan:
   - `SHEET_ID` = `1wk4JYy2qlwkAsItke_v7e5BUQ9ac4xpgkn4K86xfDYc`
   - `SHEET_API_KEY` = secret acak kuat (minimal 32 byte). Buat satu secret, simpan aman, lalu gunakan nilai yang sama di Vercel.
4. Pilih fungsi `setupSheets` lalu **Run** dan setujui akses spreadsheet. Fungsi ini membuat header di tab `Laporan SMP` dan `Diskusi SMP`.
5. **Deploy → New deployment → Web app**. Jalankan sebagai akun Anda. Pilih akses yang memungkinkan Vercel memanggil endpoint (biasanya *Anyone*); operasi tetap diperiksa dengan `SHEET_API_KEY`.
6. Salin URL Web App berakhiran `/exec`.

Jika deployment sudah dibuat sebelumnya, setelah mengubah kode pilih **Deploy → Manage deployments → Edit → New version → Deploy**. Membuka URL `/exec` di browser menjalankan pemeriksaan `doGet`; kiriman data dari Vercel memakai `doPost`.

Jangan kirim atau commit nilai secret. Batasi akses edit spreadsheet hanya ke petugas yang berwenang.

## 2. Pasang di Vercel

Deploy folder ini sebagai project Vercel (framework **Other**, root folder `bidang-smp-app`). Atur environment variables untuk **Production**, **Preview**, dan **Development**:

- `GOOGLE_APPS_SCRIPT_URL` = URL `/exec` dari deployment Apps Script
- `SHEET_API_KEY` = secret yang sama dengan Script Property

Contoh lokal: salin `.env.example` menjadi `.env.local`, isi dua nilai itu, lalu jalankan `vercel dev` dari folder aplikasi. Jangan memasukkan nilai secret ke file HTML atau repository.

Setelah variabel disimpan, redeploy agar fungsi memakai konfigurasi baru. Buka `/api/health`; respons `ok: true` menandakan Vercel dapat menjangkau Apps Script dan tab spreadsheet siap. Bila gagal, pesan menunjukkan apakah environment Vercel, Script Properties, izin spreadsheet, atau deployment Apps Script yang perlu diperiksa. Buka `/api/laporan` dan `/api/diskusi` untuk uji baca. Kemudian kirim satu laporan uji tanpa data pribadi dan pastikan baris baru muncul di tab `Laporan SMP`.

## Catatan privasi dan akses

Endpoint laporan menerima kiriman dari browser publik. Dashboard publik hanya menampilkan tanggal, sekolah, jenis, dampak, dan status. Uraian kejadian dan kontak petugas disimpan di spreadsheet dan tidak disajikan pada endpoint dashboard. Sebelum mempublikasikan, aktifkan kontrol akses yang sesuai bagi lingkungan sekolah, moderasi diskusi, dan prosedur retensi/penghapusan data. Jangan masukkan nama/NISN murid, kata sandi, token, atau isi soal.

Google Apps Script dan spreadsheet harus berada di akun yang sama atau akun tersebut harus diberi akses. Koneksi live belum aktif sampai Apps Script dideploy dan kedua environment variable Vercel diisi.
