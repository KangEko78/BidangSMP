import { NextRequest, NextResponse } from "next/server";
import { callScript } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await callScript("listDiscussions");
    return NextResponse.json({ ok: true, posts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Layanan database belum siap.";
    return NextResponse.json({ ok: false, error: message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    const title = String(input.title ?? "").trim().slice(0, 160);
    const message = String(input.message ?? "").trim().slice(0, 2000);
    const author = String(input.author ?? "Petugas SMP").trim().slice(0, 100);
    const topic = String(input.topic ?? "Koordinasi umum").trim().slice(0, 80);
    if (!title || !message) return NextResponse.json({ ok: false, error: "Judul dan isi diskusi wajib diisi." }, { status: 400 });
    const post = await callScript("createDiscussion", { title, author, message, topic });
    return NextResponse.json({ ok: true, post }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Layanan database belum siap.";
    return NextResponse.json({ ok: false, error: message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
