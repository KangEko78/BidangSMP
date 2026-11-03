"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { Icon } from "@/components/icon";
import { MagneticCursor } from "@/components/cursor";
import { AppearanceClock } from "@/components/appearance-clock";
import { useCinematicMotion } from "@/hooks/useCinematicMotion";
import { impacts, informationCards, navigation, officialSources, phases, reportTypes, sanctionCards, ServiceView, Report, Discussion } from "@/lib/content";

type SimulatorResult = { rows: number[][]; capacity: number; missing: number; remaining: number };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || body.message || "Permintaan belum dapat diproses.");
  return body as T;
}

const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

export default function PortalPage() {
  const root = useRef<HTMLElement>(null);
  const [view, setView] = useState<ServiceView>("beranda");
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<Discussion[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [simInput, setSimInput] = useState({ peserta: "", client: "", sesi: "", gelombang: "", mode: "cbt" });
  const [simResult, setSimResult] = useState<SimulatorResult | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [topicBusy, setTopicBusy] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [replyTitle, setReplyTitle] = useState("");
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");

  useCinematicMotion(root, view);

  async function loadReports() {
    try {
      const health = await request<{ ok: boolean; message: string }>("/api/health");
      const result = await request<{ reports: Report[] }>("/api/laporan");
      setReports(result.reports || []);
      setOnline(health.ok);
      setMessage(health.message);
    } catch (error) {
      setOnline(false);
      setMessage(error instanceof Error ? error.message : "Database belum terhubung.");
    }
  }

  async function loadPosts() {
    try {
      const result = await request<{ posts: Discussion[] }>("/api/diskusi");
      setPosts(result.posts || []);
    } catch {
      setPosts([]);
    }
  }

  useEffect(() => { void loadReports(); void loadPosts(); }, []);

  const titles: Record<ServiceView, string> = { beranda: "Beranda", informasi: "Informasi TKA", simulasi: "Simulasi sesi", laporan: "Laporan", dashboard: "Dashboard", diskusi: "Ruang diskusi" };
  const pending = reports.filter((item) => !/selesai|tuntas/i.test(item.status || "")).length;
  const completed = reports.length - pending;
  const issues = reports.filter((item) => item.type !== "Pelaksanaan").length;
  const typeCounts = useMemo(() => reportTypes.map((name) => ({ name, count: reports.filter((item) => item.type === name).length })), [reports]);
  const impactCounts = useMemo(() => impacts.map((name) => ({ name, count: reports.filter((item) => item.impact === name).length })), [reports]);
  const statusDonut = reports.length ? `conic-gradient(#64d7b2 0 ${Math.round(completed / reports.length * 100)}%, #f4bc64 ${Math.round(completed / reports.length * 100)}% 100%)` : "conic-gradient(#34404b 0 100%)";

  function calculate() {
    const n = Number(simInput.peserta), c = Number(simInput.client), s = Number(simInput.sesi), g = Number(simInput.gelombang);
    if (![n, c, s, g].every((value) => Number.isInteger(value) && value > 0)) { setNotice("Isi semua kapasitas dengan angka lebih dari nol."); return; }
    if (s * g > 500) { setNotice("Jumlah total sesi terlalu besar. Periksa kembali input Anda."); return; }
    const capacity = c * s * g;
    let counts = Array(s * g).fill(0) as number[];
    if (simInput.mode === "cbt") {
      let remaining = n;
      counts = counts.map(() => { const assigned = Math.max(0, Math.min(c, remaining)); remaining -= assigned; return assigned; });
    } else {
      const base = Math.floor(n / counts.length), extra = n % counts.length;
      counts = counts.map((_, index) => Math.min(c, base + (index < extra ? 1 : 0)));
    }
    const rows = Array.from({ length: g }, (_, wave) => counts.slice(wave * s, (wave + 1) * s));
    setSimResult({ rows, capacity, missing: Math.max(n - capacity, 0), remaining: Math.max(capacity - n, 0) });
    setNotice("");
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormBusy(true);
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await request("/api/laporan", { method: "POST", body: JSON.stringify(payload) });
      setNotice("Laporan berhasil tersimpan di database.");
      form.reset();
      await loadReports();
      setView("dashboard");
    } catch (error) {
      setNotice(error instanceof Error ? `Belum terkirim: ${error.message}` : "Laporan belum terkirim.");
    } finally { setFormBusy(false); }
  }

  async function submitDiscussion(title: string, text: string) {
    await request("/api/diskusi", { method: "POST", body: JSON.stringify({ title, message: text, author: "Petugas SMP", topic: "Koordinasi umum" }) });
    await loadPosts();
  }

  async function addTopic() {
    if (!topicTitle.trim()) return;
    setTopicBusy(true);
    try { await submitDiscussion(topicTitle.trim(), "Topik baru untuk koordinasi."); setTopicTitle(""); setNotice("Topik berhasil dibuat."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Topik belum dapat dibuat."); }
    finally { setTopicBusy(false); }
  }

  async function addReply() {
    if (!replyTitle.trim() || !reply.trim()) { setNotice("Isi judul dan tanggapan terlebih dahulu."); return; }
    setTopicBusy(true);
    try { await submitDiscussion(replyTitle.trim(), reply.trim()); setReplyTitle(""); setReply(""); setNotice("Tanggapan berhasil dikirim."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Tanggapan belum dapat dikirim."); }
    finally { setTopicBusy(false); }
  }

  function exportCsv() {
    const escape = (value: string) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [["Tanggal", "Satuan pendidikan", "Jenis", "Dampak", "Status"], ...reports.map((item) => [item.date, item.school, item.type, item.impact, item.status])];
    const csv = "\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "rekap-laporan-smp.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  const lastSevenDays = useMemo(() => {
    const end = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(end); day.setDate(end.getDate() - (6 - index));
      const key = day.toISOString().slice(0, 10);
      return { label: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(day), value: reports.filter((item) => String(item.date).slice(0, 10) === key).length };
    });
  }, [reports]);

  return (
    <main className="app-shell" ref={root}>
      <div className="grain" aria-hidden="true" />
      <MagneticCursor />
      <aside className="sidebar glass-panel">
        <a className="brand" href="#beranda" onClick={(event) => { event.preventDefault(); setView("beranda"); }}>
          <span className="brand-logo"><Image src="/tut-wuri-handayani.png" alt="" width={32} height={32} priority /></span>
          <span><b>Helpdesk TKA</b><small>Kabupaten Banyuwangi</small></span>
        </a>
        <p className="nav-caption">Layanan SMP</p>
        <nav className="nav-list" aria-label="Menu layanan">
          {navigation.map((item, index) => <button key={item.id} type="button" className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => { setView(item.id); setNotice(""); }} aria-current={view === item.id ? "page" : undefined}>
            <span className="nav-index">0{index + 1}</span><Icon name={item.icon} size={18} /><span>{item.label}</span>{view === item.id && <i className="nav-marker" />}
          </button>)}
        </nav>
        <div className="sidebar-bottom"><span className="seal">TW</span><span><b>Bidang SMP</b><small>Dinas Pendidikan Banyuwangi</small></span></div>
      </aside>

      <section className="workspace">
        <header className="topbar glass-panel">
          <div className="breadcrumbs"><span>PORTAL LAYANAN</span><i>/</i><b>{titles[view]}</b></div>
          <div className="topbar-tools">
            <div className={`connection-pill ${online === true ? "is-online" : online === false ? "is-offline" : ""}`}><i />{online === true ? "Database tersambung" : online === false ? "Database belum siap" : "Memeriksa koneksi"}</div>
            <AppearanceClock />
          </div>
        </header>

        <div className="view-content" key={view}>
          {view === "beranda" && <>
            <section className="story-hero" aria-label="Sambutan Helpdesk TKA SMP">
              <div className="hero-orbit orbit-one" data-depth="1" /><div className="hero-orbit orbit-two" data-depth="0.6" /><div className="hero-grid" data-depth="0.3" />
              <div className="hero-copy">
                <p className="eyebrow" data-reveal><span className="live-dot" /> PUSAT LAYANAN · JENJANG SMP</p>
                <h1 className="story-title" data-reveal>Persiapan yang baik.<br /><span>Pelaksanaan yang lancar.</span></h1>
                <p className="hero-description" data-reveal>Informasi, koordinasi teknis, dan dukungan TKA untuk satuan pendidikan SMP di Kabupaten Banyuwangi.</p>
                <div className="hero-actions" data-reveal><button className="button-primary" onClick={() => setView("informasi")}>Jelajahi informasi <Icon name="arrow" size={16} /></button><button className="button-quiet" onClick={() => setView("laporan")}>Laporkan kendala <Icon name="arrow" size={16} /></button></div>
                <p className="hero-footnote" data-reveal><Icon name="shield" size={15} /> Kanal koordinasi resmi · Jaga kerahasiaan data peserta</p>
              </div>
              <div className="hero-seal" data-depth="0.5"><Image src="/tut-wuri-handayani.png" alt="Lambang Tut Wuri Handayani" width={168} height={168} priority /><span>DINAS PENDIDIKAN<br />KABUPATEN BANYUWANGI</span></div>
              <div className="hero-bottom"><span>LAYANAN DIGITAL PENDIDIKAN</span><span>08°13′ S &nbsp; 114°22′ E</span><span>SCROLL TO EXPLORE ↓</span></div>
            </section>

            <section className="home-overview" data-reveal>
              <div className="section-heading"><div><p className="eyebrow">RUANG KERJA</p><h2>Akses layanan</h2></div><p>Semua dukungan SMP dalam satu ruang.</p></div>
              <div className="quick-grid">
                {navigation.slice(1).map((item, index) => <button className="quick-card liquid-card" data-card data-magnetic key={item.id} onClick={() => setView(item.id)}><span className="quick-number">0{index + 1} / 05</span><span className="quick-icon"><Icon name={item.icon} size={21} /></span><b>{item.label}</b><span className="quick-description">{item.id === "informasi" ? "Aturan dan sumber resmi TKA" : item.id === "simulasi" ? "Rencana pembagian peserta" : item.id === "laporan" ? "Catat pelaksanaan atau kendala" : item.id === "dashboard" ? "Pantau laporan dan tindak lanjut" : "Koordinasi operator dan proktor"}</span><span className="quick-arrow"><Icon name="arrow" size={17} /></span></button>)}
              </div>
              <div className={`home-database ${online ? "ready" : ""}`}><span className="database-symbol"><Icon name={online ? "check" : "clock"} /></span><div><b>{online ? "Database layanan aktif" : "Status koneksi database"}</b><p>{online ? "Data terbaru tersedia di dashboard dan forum diskusi." : message || "Koneksi formulir dan forum memerlukan konfigurasi database."}</p></div><button onClick={loadReports} aria-label="Periksa ulang koneksi"><Icon name="refresh" size={16} /></button></div>
            </section>
          </>}

          {view === "informasi" && <section className="content-section">
            <div className="page-intro" data-reveal><p className="eyebrow">PANDUAN & REGULASI</p><h1>Informasi <span>TKA SMP</span></h1><p>Ringkasan awal dengan tautan menuju sumber resmi. Selalu cocokkan pelaksanaan dengan pedoman yang berlaku.</p></div>
            <div className="notice-card" data-reveal><Icon name="shield" size={22} /><div><b>Catatan pembaruan aturan</b><p>Pedoman terbaru yang tercantum di portal Pusmendik adalah Kepmendikdasmen No. 56 Tahun 2026 tentang Pedoman Penyelenggaraan TKA dan AN. Rincian sanksi di bawah perlu diverifikasi terhadap naskah Kepmen 56/2026 dan juknis tahun berjalan. Kepmen 95/M/2025 hanya ditampilkan sebagai rujukan historis yang memuat rincian sanksi secara eksplisit.</p></div></div>
            <div className="editorial-grid">{informationCards.map((card, index) => <article className="editorial-card liquid-card" data-card key={card.title}><span className="card-index">0{index + 1}</span><div><p className="eyebrow">POKOK INFORMASI</p><h3>{card.title}</h3><p>{card.body}</p></div></article>)}</div>
            <div className="section-heading"><div><p className="eyebrow">RUJUKAN HISTORIS · BAB VIII</p><h2>Sanksi dalam pedoman 95/M/2025</h2></div></div>
            <p className="section-note">Penerapan pada penyelenggaraan terbaru wajib merujuk aturan yang berlaku saat kejadian.</p>
            <div className="sanction-grid">{sanctionCards.map((card) => <article className="sanction-card" data-card key={card.title}><span className="mini-seal"><Icon name="shield" size={16} /></span><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>
            <div className="danger-note"><b>Jangan jadikan ringkasan ini dasar menjatuhkan sanksi.</b><span>Penetapan pelanggaran dan sanksi harus dilakukan oleh pihak berwenang setelah pemeriksaan, berdasarkan regulasi dan juknis yang berlaku.</span></div>
            <div className="source-list"><p className="eyebrow">SUMBER RESMI</p>{officialSources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.href}><span>{source.label}</span><Icon name="arrow" size={15} /></a>)}</div>
          </section>}

          {view === "simulasi" && <section className="content-section">
            <div className="page-intro" data-reveal><p className="eyebrow">PERENCANAAN RUANG CBT</p><h1>Simulasi <span>sesi & client</span></h1><p>Perkirakan distribusi peserta berdasarkan kapasitas perangkat dan jumlah gelombang.</p></div>
            <div className="notice-card compact" data-reveal><Icon name="clock" size={20} /><p>Hasil ini alat bantu perencanaan. Cocokkan kembali dengan kapasitas ruang, jadwal, dan ketentuan resmi.</p></div>
            <div className="sim-layout"><div className="form-panel"><div className="panel-heading"><div><p className="eyebrow">KONFIGURASI</p><h2>Atur kapasitas</h2></div><span className="panel-number">01 / INPUT</span></div><div className="form-grid">
              {[{ key: "peserta", label: "Jumlah peserta", placeholder: "Contoh: 120" }, { key: "client", label: "Client per sesi", placeholder: "Contoh: 30" }, { key: "sesi", label: "Sesi per gelombang", placeholder: "Contoh: 3" }, { key: "gelombang", label: "Maksimal gelombang", placeholder: "Contoh: 2" }].map((field) => <label className="field" key={field.key}><span>{field.label}</span><input type="number" min="1" value={simInput[field.key as keyof typeof simInput]} onChange={(event) => setSimInput((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} /></label>)}
              <label className="field full-field"><span>Mode pembagian</span><select value={simInput.mode} onChange={(event) => setSimInput((current) => ({ ...current, mode: event.target.value }))}><option value="cbt">Standar CBT — isi kapasitas penuh dulu</option><option value="rata">Rata — sebar peserta seimbang</option></select></label>
            </div><div className="form-actions"><button className="button-primary" onClick={calculate}>Hitung pembagian <Icon name="arrow" size={16} /></button><button className="button-outline" onClick={() => { setSimInput({ peserta: "", client: "", sesi: "", gelombang: "", mode: "cbt" }); setSimResult(null); setNotice(""); }}>Reset</button>{simResult && <button className="button-outline" onClick={() => window.print()}>Cetak hasil</button>}</div>{notice && <p className="inline-notice">{notice}</p>}</div>
              <div className="sim-aside"><span className="eyebrow">ALUR HITUNG</span><div className="flow-step"><i>01</i><span>Jumlah client menentukan kapasitas tiap sesi.</span></div><div className="flow-step"><i>02</i><span>Jumlah sesi dikalikan dengan jumlah gelombang.</span></div><div className="flow-step"><i>03</i><span>Peserta dibagikan sesuai mode yang dipilih.</span></div><div className="formula">KAPASITAS TOTAL <b>client × sesi × gelombang</b></div></div></div>
            {simResult && <div className="result-panel" data-reveal><div className="panel-heading"><div><p className="eyebrow">HASIL PERHITUNGAN</p><h2>Rencana distribusi</h2></div><span className="panel-number">02 / HASIL</span></div><div className="result-metrics"><div><span>Total kapasitas</span><b>{simResult.capacity.toLocaleString("id-ID")}</b></div><div><span>Belum tertampung</span><b className={simResult.missing ? "attention" : ""}>{simResult.missing.toLocaleString("id-ID")}</b></div><div><span>Sisa kapasitas</span><b>{simResult.remaining.toLocaleString("id-ID")}</b></div></div><div className="table-scroll"><table><thead><tr><th>Gelombang</th>{simResult.rows[0]?.map((_, index) => <th key={index}>Sesi {index + 1}</th>)}<th>Total</th></tr></thead><tbody>{simResult.rows.map((row, index) => <tr key={index}><td>Gelombang {index + 1}</td>{row.map((count, col) => <td key={col}>{count} peserta</td>)}<td><b>{row.reduce((sum, value) => sum + value, 0)}</b></td></tr>)}</tbody></table></div></div>}
          </section>}

          {view === "laporan" && <section className="content-section">
            <div className="page-intro" data-reveal><p className="eyebrow">KANAL TINDAK LANJUT</p><h1>Laporan <span>pelaksanaan</span></h1><p>Catat kejadian dengan ringkas dan faktual agar tim dapat menindaklanjuti.</p></div>
            <div className={`notice-card ${online ? "success" : "warning"}`}><Icon name={online ? "check" : "clock"} size={20} /><div><b>{online ? "Database terhubung" : "Koneksi database belum aktif"}</b><p>{online ? "Data laporan disimpan pada database." : message || "Formulir memerlukan konfigurasi database layanan."} Jangan masukkan nama/NISN siswa, kata sandi, token, atau materi soal.</p></div></div>
            <form className="form-panel report-form" onSubmit={submitReport}><div className="panel-heading"><div><p className="eyebrow">FORMULIR LAPORAN</p><h2>Detail kejadian</h2></div><span className="panel-number">DATA TERBATAS</span></div><div className="form-grid">
              <label className="field"><span>Nama satuan pendidikan *</span><input name="school" required maxLength={300} placeholder="Nama sekolah" /></label><label className="field"><span>NPSN</span><input name="npsn" inputMode="numeric" maxLength={8} pattern="\d{8}" placeholder="8 digit" /></label>
              <label className="field"><span>Tanggal kejadian *</span><input name="date" type="date" required /></label><label className="field"><span>Tahap kegiatan</span><select name="phase">{phases.map((phase) => <option key={phase}>{phase}</option>)}</select></label>
              <label className="field"><span>Jenis laporan</span><select name="type">{reportTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className="field"><span>Tingkat dampak</span><select name="impact">{impacts.map((impact) => <option key={impact}>{impact}</option>)}</select></label>
              <label className="field full-field"><span>Uraian dan waktu kejadian *</span><textarea name="detail" required maxLength={2500} placeholder="Jelaskan singkat, faktual, dan tanpa data pribadi peserta." /></label><label className="field full-field"><span>Tindakan yang sudah dilakukan</span><textarea name="action" maxLength={2500} placeholder="Contoh: perangkat dimulai ulang; proktor menghubungi teknisi." /></label>
              <label className="field"><span>Nama petugas pelapor</span><input name="reporter" maxLength={300} placeholder="Nama petugas" /></label><label className="field"><span>Kontak petugas</span><input name="contact" maxLength={300} placeholder="WA/telepon dinas" /></label>
            </div><div className="form-actions"><button className="button-primary" disabled={formBusy}>{formBusy ? "Mengirim…" : "Kirim laporan"}<Icon name="arrow" size={16} /></button><button className="button-outline" type="reset">Kosongkan</button></div>{notice && <p className="inline-notice">{notice}</p>}</form>
          </section>}

          {view === "dashboard" && <section className="content-section dashboard-view">
            <div className="page-intro dashboard-intro" data-reveal><div><p className="eyebrow">PEMANTAUAN OPERASIONAL · SMP</p><h1>Ringkasan <span>pelaksanaan</span></h1><p>Ikhtisar laporan terkini dari database layanan.</p></div><div className="dashboard-actions"><button className="button-outline" onClick={loadReports}><Icon name="refresh" size={15} /> Perbarui</button><button className="button-primary" onClick={exportCsv}><Icon name="download" size={15} /> Unduh CSV</button></div></div>
            {!online && <div className="notice-card warning"><Icon name="clock" size={20} /><div><b>Belum ada koneksi data</b><p>{message || "Sambungkan database untuk menampilkan ringkasan laporan."}</p></div></div>}
            <div className="metric-grid">{[{ label: "Total laporan", value: reports.length, note: "Semua periode", icon: "document" }, { label: "Gangguan tercatat", value: issues, note: "Teknis dan lainnya", icon: "report" }, { label: "Perlu tindak lanjut", value: pending, note: "Belum selesai", icon: "clock" }, { label: "Sudah selesai", value: completed, note: "Ditangani tuntas", icon: "check" }].map((item) => <article className="metric-card" data-card key={item.label}><div className="metric-top"><span>{item.label}</span><i><Icon name={item.icon} size={17} /></i></div><b>{item.value.toLocaleString("id-ID")}</b><small>{item.note}</small></article>)}</div>
            <div className="charts-grid"><article className="chart-panel wide-chart" data-card><div className="panel-heading"><div><p className="eyebrow">7 HARI TERAKHIR</p><h3>Tren laporan</h3></div><span className="chart-legend"><i /> Jumlah laporan</span></div><TrendChart values={lastSevenDays} /></article><article className="chart-panel donut-panel" data-card><div className="panel-heading"><div><p className="eyebrow">STATUS SAAT INI</p><h3>Tindak lanjut</h3></div></div><div className="donut-content"><div className="donut-graphic" style={{ background: statusDonut }}><div><b>{reports.length}</b><span>laporan</span></div></div><div className="donut-legend"><span><i className="legend-green" /> Selesai <b>{completed}</b></span><span><i className="legend-gold" /> Perlu tindak lanjut <b>{pending}</b></span></div></div></article>
              <article className="chart-panel" data-card><div className="panel-heading"><div><p className="eyebrow">KLASIFIKASI</p><h3>Jenis laporan</h3></div></div><BarChart items={typeCounts} /></article><article className="chart-panel" data-card><div className="panel-heading"><div><p className="eyebrow">PRIORITAS</p><h3>Tingkat dampak</h3></div></div><BarChart items={impactCounts} gold /></article></div>
            <article className="table-panel" data-card><div className="panel-heading"><div><p className="eyebrow">DATA TERBARU</p><h3>Laporan terbaru</h3></div><span className="panel-number">RINGKASAN PUBLIK</span></div><div className="table-scroll"><table><thead><tr><th>Tanggal</th><th>Satuan pendidikan</th><th>Jenis</th><th>Dampak</th><th>Status</th></tr></thead><tbody>{reports.length ? reports.map((item) => <tr key={item.id}><td>{dateLabel(item.date)}</td><td>{item.school}</td><td>{item.type}</td><td><span className={`impact-tag impact-${item.impact.toLowerCase()}`}>{item.impact}</span></td><td><span className="status-tag">{item.status || "Belum ditangani"}</span></td></tr>) : <tr><td className="empty-cell" colSpan={5}>Belum ada laporan tersimpan.</td></tr>}</tbody></table></div><p className="table-footnote">Uraian kejadian, tindakan, dan kontak petugas tidak ditampilkan di ringkasan publik.</p></article>
          </section>}

          {view === "diskusi" && <section className="content-section">
            <div className="page-intro" data-reveal><p className="eyebrow">KOORDINASI OPERATOR · PROKTOR · TEKNISI</p><h1>Ruang <span>diskusi</span></h1><p>Bagikan informasi operasional dan koordinasikan tindak lanjut bersama tim SMP.</p></div>
            {!online && <div className="notice-card warning"><Icon name="clock" size={20} /><div><b>Forum belum terhubung</b><p>{message || "Hubungkan database untuk memuat dan menyimpan diskusi."}</p></div></div>}
            <div className="forum-layout"><div className="forum-rail"><div className="form-panel"><div className="panel-heading"><div><p className="eyebrow">TOPIK BARU</p><h2>Mulai koordinasi</h2></div><span className="mini-seal"><Icon name="plus" size={16} /></span></div><label className="field"><span>Judul topik</span><input value={topicTitle} onChange={(event) => setTopicTitle(event.target.value)} placeholder="Judul topik" maxLength={160} /></label><button className="button-primary full-button" disabled={topicBusy || !topicTitle.trim()} onClick={addTopic}>Buat topik <Icon name="arrow" size={15} /></button></div><div className="forum-note"><Icon name="shield" size={18} /><p>Jangan membagikan data pribadi peserta, kata sandi, token, atau materi soal.</p></div><div className="topic-index"><p className="eyebrow">TOPIK TERBARU</p>{posts.length ? posts.slice(0, 6).map((post) => <div key={post.id} className="topic-row"><i /><span>{post.title}</span></div>) : <p className="empty-note">Belum ada topik diskusi.</p>}</div></div>
              <div className="forum-main"><div className="panel-heading forum-heading"><div><p className="eyebrow">ALIRAN DISKUSI</p><h2>Diskusi terbaru</h2></div><span className="post-count">{posts.length} PESAN</span></div><div className="post-list">{posts.length ? posts.map((post) => <article className="post-card" key={post.id}><span className="post-avatar">{post.author.slice(0, 1).toUpperCase()}</span><div><div className="post-meta"><b>{post.author}</b><time>{dateLabel(post.createdAt)}</time></div><h3>{post.title}</h3><p>{post.message}</p><span className="topic-pill">{post.topic}</span></div></article>) : <div className="empty-forum"><span className="empty-chat"><Icon name="chat" size={24} /></span><b>Belum ada diskusi</b><p>Mulai topik baru untuk membuka koordinasi pertama.</p></div>}</div><div className="reply-composer"><p className="eyebrow">KIRIM TANGGAPAN</p><input value={replyTitle} onChange={(event) => setReplyTitle(event.target.value)} placeholder="Judul singkat" maxLength={160} aria-label="Judul tanggapan" /><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Tulis tanggapan singkat…" maxLength={2000} aria-label="Tulis tanggapan" /><button className="button-primary" disabled={topicBusy || !replyTitle.trim() || !reply.trim()} onClick={addReply}>Kirim tanggapan <Icon name="arrow" size={15} /></button>{notice && <p className="inline-notice">{notice}</p>}</div></div></div>
          </section>}
        </div>
        <footer className="app-footer"><span>HELPDESK TKA SMP · KABUPATEN BANYUWANGI</span><span>Informasi per bidang · 2026</span></footer>
      </section>
      <nav className="mobile-nav" aria-label="Menu layanan seluler">{navigation.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)} aria-label={item.label}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>)}</nav>
    </main>
  );
}

function TrendChart({ values }: { values: { label: string; value: number }[] }) {
  const max = Math.max(1, ...values.map((item) => item.value));
  const points = values.map((item, index) => ({ x: 34 + index * 100, y: 160 - item.value / max * 120, ...item }));
  const path = points.map((item, index) => `${index ? "L" : "M"}${item.x} ${item.y}`).join(" ");
  const area = `${path} L ${points.at(-1)?.x} 176 L ${points[0]?.x} 176 Z`;
  return <svg className="trend-chart" viewBox="0 0 670 210" role="img" aria-label="Grafik tren jumlah laporan selama tujuh hari terakhir"><defs><linearGradient id="trend-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#69d6b4" stopOpacity=".25" /><stop offset="1" stopColor="#69d6b4" stopOpacity="0" /></linearGradient></defs>{[40, 85, 130, 175].map((y) => <line key={y} x1="20" x2="650" y1={y} y2={y} className="chart-gridline" />)}<path d={area} fill="url(#trend-gradient)" /><path d={path} className="trend-line" />{points.map((item) => <g key={item.label}><circle cx={item.x} cy={item.y} r="4" className="trend-point"><title>{item.value} laporan</title></circle><text x={item.x} y="200" textAnchor="middle">{item.label}</text><text x={item.x} y={item.y - 12} textAnchor="middle" className="trend-value">{item.value}</text></g>)}</svg>;
}

function BarChart({ items, gold = false }: { items: { name: string; count: number }[]; gold?: boolean }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return <div className="bar-list">{items.map((item) => <div className="bar-row" key={item.name}><span>{item.name}</span><div className="bar-track"><i className={gold ? "bar-fill gold-fill" : "bar-fill"} style={{ width: `${item.count ? Math.max(4, item.count / max * 100) : 0}%` }} /></div><b>{item.count}</b></div>)}</div>;
}

