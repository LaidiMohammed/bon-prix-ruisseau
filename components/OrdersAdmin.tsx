"use client";

import QRCode from "react-qr-code";
import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, Search, Trash2, Truck, X } from "lucide-react";
import { statusColor } from "./OrderCard";
import { useShop } from "./ShopProvider";
import { DELIVERY_LABEL } from "@/lib/delivery";
import { fmtDA } from "@/lib/mock-data";
import {
  apiListOrders,
  apiSetStatus,
  backendEnabled,
} from "@/lib/backend";
import { orderUrl, STATUS_LABEL, type Order, type OrderStatus } from "@/lib/orders";
import { pad2 } from "@/lib/wilayas";

export default function OrdersAdmin() {
  const { orders, setStatus, removeOrder } = useShop();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [openQr, setOpenQr] = useState<string | null>(null);
  // Shared server list (all users) — null = backend off / not loaded yet.
  const [remote, setRemote] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loading = refreshing || (backendEnabled && remote === null);

  const fetchRemote = useCallback(async () => {
    try {
      setRemote(await apiListOrders());
    } catch {
      /* server busy — keep previous list, never block the admin */
    }
  }, []);

  // Initial load: state updates only inside async callbacks (no cascading render).
  useEffect(() => {
    if (!backendEnabled) return;
    let alive = true;
    apiListOrders()
      .then((list) => {
        if (alive) setRemote(list);
      })
      .catch(() => {
        /* retry via the refresh button */
      });
    return () => {
      alive = false;
    };
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true); // event-handler path: sync set is fine
    try {
      await fetchRemote();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRemote]);

  const source = backendEnabled && remote ? remote : orders;

  const handleStatus = async (id: string, st: OrderStatus) => {
    if (backendEnabled && remote) {
      try {
        await apiSetStatus(id, st);
      } catch {
        /* offline — still update the local view below */
      }
      setRemote(remote.map((o) => (o.id === id ? { ...o, status: st } : o)));
    }
    setStatus(id, st);
  };

  const handleDelete = (id: string) => {
    if (backendEnabled && remote)
      setRemote(remote.filter((o) => o.id !== id));
    removeOrder(id);
  };

  const clean = q.trim().toUpperCase();
  const list = source.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      (clean === "" ||
        o.id.toUpperCase().includes(clean) ||
        o.phone.includes(clean) ||
        o.name.toUpperCase().includes(clean))
  );

  const revenue = source
    .filter((o) => o.status === "validated" || o.status === "delivered")
    .reduce((n, o) => n + o.total, 0);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { l: "Commandes", v: source.length },
          { l: "En attente", v: source.filter((o) => o.status === "pending").length },
          { l: "Revenu validé", v: fmtDA(revenue) },
        ].map((s) => (
          <div key={s.l} className="rounded-3xl border border-white/12 bg-coal p-4 text-center">
            <p className="font-display text-2xl text-gold">{s.v}</p>
            <p className="text-[11px] font-bold tracking-widest text-cream/60 uppercase">{s.l}</p>
          </div>
        ))}
      </div>

      {backendEnabled && (
        <button
          onClick={load}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-2.5 text-sm font-bold hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Chargement…" : remote ? `Actualiser — ${remote.length} en ligne ✓` : "Charger les commandes en ligne"}
        </button>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/12 bg-coal px-4 py-2.5">
          <Search size={16} className="text-cream/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, téléphone ou N° (8 caractères)…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-cream/40"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "validated", "delivered", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold ${filter === f ? "bg-cream text-ink" : "bg-white/10"}`}
            >
              {f === "all" ? "Tout" : STATUS_LABEL[f].fr}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-3xl border border-dashed border-white/20 p-8 text-center text-sm text-cream/50">
          {backendEnabled && !remote
            ? "Clique « Charger les commandes en ligne » pour voir les commandes de tous les clients."
            : `Aucune commande ${q || filter !== "all" ? "trouvée" : "pour l'instant — elles apparaîtront ici dès qu'un client commande"}.`}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {list.map((o) => (
          <div key={o.id} className="rounded-3xl border border-white/12 bg-coal p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-xl font-black tracking-[0.15em]">{o.id}</span>
                <span className={`ml-2 rounded-full px-3 py-1 text-[11px] font-black ${statusColor(o.status)}`}>
                  {STATUS_LABEL[o.status].fr}
                </span>
              </div>
              <span className="text-xs text-cream/50">{new Date(o.date).toLocaleString("fr-DZ")}</span>
            </div>
            <p className="mt-2 text-sm"><b>{o.name}</b> • {o.phone}</p>
            <p className="text-xs text-cream/60">
              {pad2(o.wilayaCode)} {o.wilaya} — {o.commune}{o.delivery === "home" && o.address ? ` — ${o.address}` : ""} • {DELIVERY_LABEL[o.delivery].fr}
              {o.notes ? ` • «${o.notes}»` : ""}
            </p>
            <p className="mt-1 text-xs text-cream/60">
              {o.items.map((i) => `${i.name} ×${i.qty} (${i.size})${i.flocageLabel ? ` [✍ ${i.flocageLabel}]` : ""}`).join(" • ")}
            </p>
            <p className="mt-1 text-sm font-black">Total: <span className="text-gold">{fmtDA(o.total)}</span> <span className="font-normal text-cream/50">(articles {fmtDA(o.subtotal)} + livraison {fmtDA(o.fee)})</span></p>
            <div className="mt-3 flex flex-wrap gap-2">
              {o.status === "pending" && (
                <button onClick={() => handleStatus(o.id, "validated")} className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs font-black text-ink">
                  <Check size={14} /> Valider
                </button>
              )}
              {(o.status === "validated" || o.status === "pending") && (
                <button onClick={() => handleStatus(o.id, "delivered")} className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-black text-ink">
                  <Truck size={14} /> Livrée
                </button>
              )}
              {o.status !== "cancelled" && (
                <button onClick={() => handleStatus(o.id, "cancelled")} className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold hover:bg-signal">
                  <X size={14} /> Refuser
                </button>
              )}
              {o.status === "cancelled" && (
                <button onClick={() => handleStatus(o.id, "pending")} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold">
                  Remettre en attente
                </button>
              )}
              <button onClick={() => setOpenQr(openQr === o.id ? null : o.id)} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold hover:bg-white/10">
                QR client
              </button>
              <button onClick={() => handleDelete(o.id)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-signal hover:bg-signal hover:text-white" aria-label="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>
            {openQr === o.id && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-ink p-3">
                <div className="rounded-xl bg-white p-2">
                  <QRCode value={orderUrl(o.id)} size={72} />
                </div>
                <p className="text-xs text-cream/60">Le client scanne pour suivre sa commande.<br /><span className="font-mono">{orderUrl(o.id)}</span></p>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-cream/40">
        {backendEnabled
          ? "Serveur partagé actif : toutes les commandes clients arrivent ici. Actualise pendant les rush (matchs, TikTok live)."
          : "Note: sans backend, les commandes sont stockées dans le navigateur de l'appareil où elles sont passées. Pour centraliser toutes les commandes (téléphone + PC + site), active Supabase — table prête dans supabase/schema.sql."}
      </p>
    </div>
  );
}
