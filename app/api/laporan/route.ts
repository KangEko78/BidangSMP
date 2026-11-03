import { NextRequest, NextResponse } from "next/server";
import { callScript } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await callScript("listReports");
    const reports = rows.map(({ id, createdAt, school, date, type, impact, status }: Record<string, string>) => ({ id, createdAt, school, date, type, impact, status }));
    return NextResponse.json({ ok: true, reports }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Layanan database belum siap.";
    return NextResponse.json({ ok: false, error: message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    if (input.website) return NextResponse.json({ ok: false, error: "Permintaan tidak valid." }, { status: 400 });
    const fields = Object.fromEntries(["school", "npsn", "date", "phase", "type", "impact", "detail", "action", "reporter", "contact"].map((key) => [key, String(input[key] ?? "").trim().slice(0, key === "detail" || key === "action" ? 2500 : 300)]));
    if (!fields.school || !fields.date || !fields.detail) return NextResponse.json({ ok: false, error: "Nama sekolah, tanggal, dan uraian wajib diisi." }, { status: 400 });
    if (fields.npsn && !/^\d{8}$/.test(fields.npsn)) return NextResponse.json({ ok: false, error: "NPSN harus terdiri dari 8 angka." }, { status: 400 });

    const report = await callScript("createReport", fields);
    return NextResponse.json({ ok: true, report: { id: report.id, createdAt: report.createdAt, status: report.status } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Layanan database belum siap.";
    return NextResponse.json({ ok: false, error: message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
