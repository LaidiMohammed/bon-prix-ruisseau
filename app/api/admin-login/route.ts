import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Journalise une tentative de login admin (succès OU échec) avec un max
// d'infos : email tapé, IP, pays/ville (headers Vercel), navigateur.
// Toujours 200 côté client : le logging ne doit jamais bloquer le login.

let sb: SupabaseClient | null = null;

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!sb) sb = createClient(url, key);
  return sb;
}

const hits = new Map<string, number[]>();

function limited(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const client = db();
  if (!client) return Response.json({ ok: true }); // backend coupé : silencieux

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";
  if (limited(`adminlog:${ip || "unknown"}`, 15))
    return Response.json({ ok: true }); // spammeur : on l'ignore, sans le dire

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().slice(0, 120) : "";
  if (!EMAIL_RE.test(email))
    return Response.json({ error: "bad_email" }, { status: 400 });

  // Best-effort : un échec d'écriture ne remonte jamais au client.
  let city = "";
  try {
    city = decodeURIComponent(req.headers.get("x-vercel-ip-city") || "");
  } catch {
    city = req.headers.get("x-vercel-ip-city") || ""; // header malformé : brut
  }
  try {
    await client.from("admin_login_attempts").insert({
      email,
      ip: ip.slice(0, 80),
      country: (req.headers.get("x-vercel-ip-country") || "").slice(0, 10),
      city: city.slice(0, 80),
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300),
      success: body.success === true,
    });
  } catch {
    /* silencieux */
  }
  return Response.json({ ok: true });
}
