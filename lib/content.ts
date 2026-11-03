export type ServiceView = "beranda" | "informasi" | "simulasi" | "laporan" | "dashboard" | "diskusi";

export const navigation: { id: ServiceView; label: string; icon: string }[] = [
  { id: "beranda", label: "Beranda", icon: "home" },
  { id: "informasi", label: "Informasi TKA", icon: "document" },
  { id: "simulasi", label: "Simulasi sesi", icon: "grid" },
  { id: "laporan", label: "Laporan", icon: "report" },
  { id: "dashboard", label: "Dashboard", icon: "chart" },
  { id: "diskusi", label: "Diskusi", icon: "chat" },
];

export const informationCards = [
  { title: "Jenjang & mata pelajaran", body: "Informasi Pusmendik menyebut TKA jenjang SMP/MTs/sederajat mencakup Bahasa Indonesia dan Matematika. Ikuti petunjuk teknis dan jadwal resmi terbaru untuk ketentuan tahun berjalan." },
  { title: "Prinsip pelaksanaan", body: "Gunakan prosedur resmi, jaga kerahasiaan instrumen dan data peserta, serta segera koordinasikan kendala teknis melalui penanggung jawab yang ditetapkan." },
  { title: "Tata tertib & dugaan pelanggaran", body: "Pedoman 95/M/2025 mencantumkan larangan kecurangan atau kolusi, alat dan catatan terlarang, bantuan pihak lain, serta perekaman atau penyebaran materi ujian." },
];

export const sanctionCards = [
  { title: "Peserta", body: "Tindak lanjut berjenjang dalam pedoman tersebut mencakup teguran lisan, pembatalan ujian mata pelajaran, atau pengeluaran peserta dan nilai 0 setelah pemeriksaan sesuai kewenangan." },
  { title: "Pelaksana", body: "Bagi penulis atau penelaah, pengawas, proktor, dan teknisi: teguran lisan, surat peringatan, atau pembebasan dari tugas sebagai pelaksana TKA." },
  { title: "Satuan pendidikan", body: "Dapat berupa pembatalan pelaksanaan TKA atau rekomendasi penangguhan sebagai penyelenggara selama tiga penyelenggaraan berturut-turut, menurut pedoman 95/M/2025." },
  { title: "Penanganan laporan", body: "Catat waktu, lokasi, uraian, bukti, dan saksi secara faktual. Batasi akses laporan sensitif dan lindungi identitas pelapor sesuai prosedur." },
];

export const officialSources = [
  { label: "Pusmendik — Unduhan TKA (termasuk Kepmen 56/2026)", href: "https://pusmendik.kemendikdasmen.go.id/tka/unduhan/" },
  { label: "JDIH — Kepmendikdasmen No. 95/M/2025 (PDF)", href: "https://jdih.kemendikdasmen.go.id/sjdih/siperpu/dokumen/salinan/Kepmendikdasmen_No_95_M_2025_tentang_Pedoman_Penyelenggaraan_Tes_Kemampuan_Akademik.pdf" },
  { label: "Pusmendik — Portal TKA", href: "https://pusmendik.kemendikdasmen.go.id/tka/" },
  { label: "Rumah Pendidikan — Integrasi TKA dan AN", href: "https://pusatinformasi.rumahpendidikan.kemendikdasmen.go.id/hc/id/articles/57793984987673-Integrasi-TKA-dan-Asesmen-Nasional-untuk-Data-Rapor-Pendidikan" },
];

export const reportTypes = ["Pelaksanaan", "Gangguan teknis", "Gangguan jaringan", "Gangguan perangkat", "Lainnya"];
export const impacts = ["Rendah", "Sedang", "Tinggi", "Kritis"];
export const phases = ["Persiapan", "Simulasi", "Gladi", "Pelaksanaan", "Pascapelaksanaan"];

export type Report = {
  id: string;
  createdAt: string;
  school: string;
  date: string;
  type: string;
  impact: string;
  status: string;
};

export type Discussion = { id: string; title: string; author: string; message: string; topic: string; createdAt: string };
