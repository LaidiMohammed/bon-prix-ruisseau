"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/backend";

type Attempt = {
  id: string;
  email: string;
  ip: string;
  country: string;
  city: string;
  user_agent: string;
  success: boolean;
  created_at: string;
};

// Qui a essayé d'entrer dans le studio (email, IP, pays, navigateur).
// Lecture directe Supabase : RLS réserve ça aux admins connectés.
export default function AdminSecurity() {
  const [rows, setRows] = useState<Attempt[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now] = useState(() => Date.now()); // figé au montage (pureté render)
  const loading = refreshing || rows === null;

  const load = useCallback(async () => {
    const client = supabase();
    if (!client) return;
    setRefreshing(true);
    try {
      const { data, error } = await client
        .from("admin_login_attempts")
        .select("id,email,ip,country,city,user_agent,success,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error) setRows(data as unknown as Attempt[]);
    } catch {
      /* table pas encore créée ? lance le SQL section 26 */
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const client = supabase();
    if (!client) return;
    let alive = true;
    // Promise.resolve : le builder supabase est un thenable, pas une Promise.
    Promise.resolve(
      client
        .from("admin_login_attempts")
        .select("id,email,ip,country,city,user_agent,success,created_at")
        .order("created_at", { ascending: false })
        .limit(100)
    )
      .then(({ data, error }) => {
        if (alive && !error) setRows(data as unknown as Attempt[]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const fails24h = (rows ?? []).filter(
    (r) => !r.success && now - new Date(r.created_at).getTime() < 24 * 3600 * 1000
  ).length;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-3xl border border-white/12 bg-coal p-4 text-center">
          <p className="font-display text-2xl text-gold">{rows?.length ?? "…"}</p>
          <p className="text-[11px] font-bold tracking-widest text-cream/60 uppercase">
            Tentatives (100 dernières)
          </p>
        </div>
        <div className="rounded-3xl border border-white/12 bg-coal p-4 text-center">
          <p className={`font-display text-2xl ${fails24h > 0 ? "text-red-300" : "text-[#25D366]"}`}>
            {rows ? fails24h : "…"}
          </p>
          <p className="text-[11px] font-bold tracking-widest text-cream/60 uppercase">
            Échecs 24h
          </p>
        </div>
      </div>

      <button
        onClick={load}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-2.5 text-sm font-bold hover:bg-white/10 disabled:opacity-50"
      >
        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        {loading ? "Chargement…" : "Actualiser"}
      </button>

      {rows !== null && rows.length === 0 && (
        <p className="mt-6 rounded-3xl border border-dashed border-white/20 p-8 text-center text-sm text-cream/50">
          Aucune tentative enregistrée.
          <span className="mt-1 block text-xs">
            Table vide ? Lance le SQL section 26 (admin_login_attempts) dans Supabase.
          </span>
        </p>
      )}

      <div className="mt-4 space-y-2.5">
        {(rows ?? []).map((r) => (
          <div key={r.id} className="rounded-3xl border border-white/12 bg-coal p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="truncate text-sm font-bold">{r.email}</p>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-black ${
                  r.success
                    ? "bg-[#25D366]/15 text-[#25D366]"
                    : "bg-signal/15 text-red-300"
                }`}
              >
                {r.success ? "OK ✓" : "ÉCHEC"}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-gold">
              {r.ip || "IP masquée"}
              {r.city || r.country ? ` • ${[r.city, r.country].filter(Boolean).join(", ")}` : ""}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-cream/40" title={r.user_agent}>
              {r.user_agent || "navigateur inconnu"}
            </p>
            <p className="mt-0.5 text-[11px] text-cream/50">
              {new Date(r.created_at).toLocaleString("fr-DZ")}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-1.5 text-xs text-cream/40">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        Beaucoup d’échecs d’un inconnu ? Change ton mot de passe Supabase Auth aussitôt.
      </p>
    </div>
  );
}
