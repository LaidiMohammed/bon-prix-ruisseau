import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // jamais de cache : vrai test à chaque appel

// Sonde publique : le site est-il debout + la base répond-elle ?
// Utilisée par le workflow keep-alive (anti-pause) et les moniteurs uptime.
// Lecture minuscule (compte wilayas), coût quasi nul, jamais de cache.
export async function GET() {
  const started = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return Response.json({ ok: true, backend: "off" });

  try {
    const sb = createClient(url, key);
    const { error } = await sb
      .from("wilayas")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return Response.json({
      ok: true,
      backend: "on",
      dbMs: Date.now() - started,
    });
  } catch {
    return Response.json({
      ok: true,
      backend: "error",
      dbMs: Date.now() - started,
    });
  }
}
