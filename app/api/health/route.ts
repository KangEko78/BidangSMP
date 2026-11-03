import { NextResponse } from "next/server";
import { callScript, getScriptConfig } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const missing = getScriptConfig().missing;
    if (missing.length) return NextResponse.json({ ok: false, code: "config_missing", message: "Konfigurasi database belum lengkap.", missing }, { status: 503 });
    const data = await callScript("health");
    if (!data?.ok || !data?.configured || data?.spreadsheetAccessible === false || data?.tabsReady === false) {
      return NextResponse.json({ ok: false, code: "backend_not_ready", message: "Database belum siap. Periksa koneksi layanan dan konfigurasi data." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, message: "Database layanan siap." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Koneksi database gagal.";
    return NextResponse.json({ ok: false, message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
