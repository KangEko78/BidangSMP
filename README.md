# Helpdesk TKA SMP Banyuwangi

Portal Next.js untuk informasi TKA, simulasi sesi/client, laporan pelaksanaan/gangguan, dashboard grafik, dan forum diskusi. **Google Sheets tetap menjadi penyimpanan data** melalui Google Apps Script; istilah yang tampil pada antarmuka web dibuat umum sebagai “database”.

## Koneksi yang digunakan

- `GOOGLE_APPS_SCRIPT_URL` = URL Web App Apps Script yang berakhiran `/exec`.
- `SHEET_API_KEY` = secret yang sama dengan Script Property `SHEET_API_KEY` di Apps Script.
- `SHEET_ID` tetap tersimpan di Script Properties Apps Script. Nilai ini tidak perlu dipasang di Vercel.
- Fungsi Apps Script yang dipanggil: `health`, `listReports`, `createReport`, `listDiscussions`, dan `createDiscussion`.

Pastikan Apps Script sudah dideploy sebagai **Web app**, menjalankan `setupSheets()` agar tab `Laporan SMP` dan `Diskusi SMP` tersedia, dan URL `/exec` dapat diakses. Jika kode Apps Script berubah, deploy versi baru. Jangan menaruh API key di HTML atau repository.

## GitHub → Vercel

- Tambahkan dua environment variable di Vercel: `GOOGLE_APPS_SCRIPT_URL` dan `SHEET_API_KEY`.
- Pilih environment **Production**; aktifkan juga Preview jika ingin mencoba deployment pratinjau.
- Jika isi folder ini menjadi root repository GitHub, biarkan **Root Directory** Vercel kosong.
- Jika seluruh folder `outputs` disimpan sebagai root repository, set **Root Directory** ke `outputs/bidang-smp-next`.
- Framework preset: **Next.js**. Gunakan build command dan output default Next.js.
- Setelah menyimpan environment variable, lakukan deployment baru.
- Periksa `https://<domain>/api/health`. Respons `ok: true` menunjukkan Vercel, Apps Script, dan tab Google Sheets tersambung.

## Menjalankan lokal

Gunakan Node.js 20.9 atau lebih baru. Salin `.env.example` menjadi `.env.local`, isi URL `/exec` dan secret yang sama, lalu jalankan:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Fitur yang dipertahankan

- Navigasi Beranda, Informasi TKA, Simulasi sesi, Laporan, Dashboard, dan Diskusi.
- Simulasi pembagian mode CBT dan rata, hasil cetak, validasi laporan, unduhan CSV, grafik laporan, pembuatan topik, dan tanggapan.
- Dashboard publik hanya menampilkan tanggal, sekolah, jenis, dampak, dan status. Detail kejadian, tindakan, dan kontak tetap tidak ditampilkan pada ringkasan dashboard.
- Struktur data konten tersedia di `lib/content.ts`; laporan dan diskusi tidak diisi data contoh palsu.

## Struktur

```text
app/          Next.js App Router, UI, dan API routes
components/   Ikon dan kursor interaktif
hooks/        Animasi GSAP dan ScrollTrigger
lib/          Konten dan koneksi Apps Script
public/       Aset Tut Wuri Handayani
```
