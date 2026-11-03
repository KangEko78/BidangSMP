type ScriptPayload = Record<string, string>;

export function getScriptConfig() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL?.trim() || "";
  const key = process.env.SHEET_API_KEY?.trim() || "";
  const missing = [!url ? "GOOGLE_APPS_SCRIPT_URL" : "", !key ? "SHEET_API_KEY" : ""].filter(Boolean);
  return { url, key, missing };
}

export async function callScript(action: string, payload: ScriptPayload = {}) {
  const { url, key, missing } = getScriptConfig();
  if (missing.length) throw new Error(`Konfigurasi database belum lengkap: ${missing.join(", ")}.`);
  const response = await fetch(url, {
    method: action === "health" ? "GET" : "POST",
    headers: action === "health" ? undefined : { "content-type": "application/json" },
    redirect: "follow",
    cache: "no-store",
    ...(action === "health" ? {} : { body: JSON.stringify({ action, key, payload }) }),
  });
  if (!response.ok) throw new Error(`Layanan database merespons HTTP ${response.status}.`);
  const result = await response.json();
  if (!result?.ok) throw new Error("Database belum siap. Periksa koneksi layanan dan konfigurasi data.");
  return result.data ?? result;
}
