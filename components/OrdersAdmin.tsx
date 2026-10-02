"use client";

import QRCode from "react-qr-code";
import { useCallback, useEffect, useState } from "react";
import { Check, Package, RefreshCw, Search, Trash2, Truck, X } from "lucide-react";
import { statusColor } from "./OrderCard";
import { useShop } from "./ShopProvider";
import { DELIVERY_LABEL, type DeliveryType } from "@/lib/delivery";
import { fmtDA } from "@/lib/mock-data";
import { backendEnabled, supabase } from "@/lib/backend";
import { orderQrText, orderUrl, STATUS_LABEL, type Order, type OrderStatus } from "@/lib/orders";
import { pad2 } from "@/lib/wilayas";

type AdminOrder = Order & { _uuid: string }; // _uuid = PK Supabase (actions admin)

type DbItem = {
  product_id: string | null;
  variant_id: string | null;
  product_name_fr: string;
  variant_label: string;
  image_url: string;
  flocage_label: string | null;
  flocage_price: number;
  unit_price: number;
  qty: number;
};

type DbRow = {
  id: string;
  order_number: string;
  created_at: string;
  guest_name: string;
  guest_phone: string;
  wilaya_code: number;
  wilaya_name: string;
  commune: string;
  address: string | null;
  delivery: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  order_items: DbItem[];
};

function mapRow(r: DbRow): AdminOrder {
  const delivery: DeliveryType = r.delivery === "stopdesk" ? "bureau" : "home";
  return {
    _uuid: r.id,
    id: r.order_number,
    date: r.created_at,
    name: r.guest_name || "—",
    phone: r.guest_phone || "—",
    wilaya: r.wilaya_name || "",
    wilayaCode: r.wilaya_code,
    commune: r.commune || "",
    address: r.address ?? "",
    delivery,
    notes: r.notes ?? "",
    items: (r.order_items ?? []).map((i) => ({
      productId: i.product_id ?? i.variant_id ?? i.product_name_fr,
      name: i.product_name_fr,
      size: i.variant_label,
      price: Math.max(0, i.unit_price - (i.flocage_price ?? 0)),
      image: i.image_url || "/logo.jpg",
      qty: i.qty,
      flocageLabel: i.flocage_label ?? undefined,
      flocagePrice: i.flocage_price || undefined,
    })),
    subtotal: r.subtotal,
    fee: r.delivery_fee,
    total: r.total,
    status: r.status as OrderStatus,
  };
}

const FILTERS = ["all", "pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;

export default function OrdersAdmin() {
  const { orders, setStatus, removeOrder } = useShop();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [openQr, setOpenQr] = useState<string | null>(null);
  // Liste serveur (tous les clients) — null = backend coupé / pas encore chargée.
  const [remote, setRemote] = useState<AdminOrder[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [opError, setOpError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const loading = refreshing || (backendEnabled && remote === null);

  const fetchRemote = useCallback(async () => {
    const client = supabase();
    if (!client) return;
    const { data, error } = await client
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Lecture impossible — es-tu connecté en admin ?");
    setRemote((data as unknown as DbRow[]).map(mapRow));
    setUpdatedAt(new Date());
  }, []);

  // Chargement initial : setState uniquement dans les callbacks async.
  // En cas d'échec on le DIT (session expirée ?) au lieu d'une liste vide muette.
  useEffect(() => {
    if (!backendEnabled) return;
    const client = supabase();
    if (!client) return;
    let alive = true;
    // Promise.resolve : le builder supabase est un thenable, pas une Promise.
    Promise.resolve(
      client
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(200)
    )
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) throw new Error("read");
        setRemote((data as unknown as DbRow[]).map(mapRow));
        setUpdatedAt(new Date());
      })
      .catch(async () => {
        if (!alive) return;
        try {
          const { data } = await client.auth.getSession();
          if (alive)
            setOpError(
              !data.session
                ? "Session expirée — sors (bouton Sortir) puis reconnecte-toi."
                : "Chargement impossible — touche Actualiser."
            );
        } catch {
          if (alive) setOpError("Chargement impossible — touche Actualiser.");
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  // Auto-refresh : aucune commande ne reste invisible plus de 20 s.
  useEffect(() => {
    if (!backendEnabled) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchRemote().catch(() => {
          /* silencieux : le bouton Actualiser affiche les erreurs */
        });
      }
    }, 20000);
    return () => clearInterval(t);
  }, [fetchRemote]);

  const load = useCallback(async () => {
    setRefreshing(true); // event handler : set synchrone OK
    setOpError("");
    try {
      await fetchRemote();
    } catch (e) {
      setOpError(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setRefreshing(false);
    }
  }, [fetchRemote]);

  const source: Order[] = backendEnabled && remote ? remote : orders;

  const handleStatus = async (o: Order, st: OrderStatus) => {
    if (backendEnabled && remote) {
      const client = supabase();
      const uuid = (o as AdminOrder)._uuid;
      if (!client || !uuid) return;
      setOpError("");
      const { error } = await client.from("orders").update({ status: st }).eq("id", uuid);
      if (error) {
        setOpError("Écriture refusée — reconnecte-toi en admin");
        return;
      }
      setRemote(remote.map((x) => (x.id === o.id ? { ...x, status: st } : x)));
      return;
    }
    setStatus(o.id, st);
  };

  const handleDelete = async (o: Order) => {
    if (backendEnabled && remote) {
      const client = supabase();
      const uuid = (o as AdminOrder)._uuid;
      if (!client || !uuid) return;
      const { error } = await client.from("orders").delete().eq("id", uuid);
      if (error) {
        setOpError("Suppression refusée — reconnecte-toi en admin");
        return;
      }
      setRemote(remote.filter((x) => x.id !== o.id));
      return;
    }
    removeOrder(o.id);
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
    .filter((o) => o.status === "validated" || o.status === "confirmed" || o.status === "preparing" || o.status === "shipped" || o.status === "delivered")
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
      {backendEnabled && updatedAt && (
        <p className="mt-1.5 text-center text-[11px] text-cream/40">
          Mis à jour à {updatedAt.toLocaleTimeString("fr-DZ")} • auto toutes les 20 s
        </p>
      )}
      {opError && (
        <p className="mt-3 rounded-2xl bg-signal/15 px-4 py-2.5 text-center text-sm font-bold text-red-300">
          {opError}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/12 bg-coal px-4 py-2.5">
          <Search size={16} className="text-cream/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, téléphone ou N° (BPR-…)…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-cream/40"
          />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${filter === f ? "bg-cream text-ink" : "bg-white/10"}`}
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
                <span className="font-mono text-lg font-black tracking-[0.1em] break-all sm:text-xl">{o.id}</span>
                <span className={`ml-2 rounded-full px-3 py-1 text-[11px] font-black whitespace-nowrap ${statusColor(o.status)}`}>
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
                <button onClick={() => handleStatus(o, "confirmed")} className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs font-black text-ink">
                  <Check size={14} /> Confirmer
                </button>
              )}
              {o.status === "confirmed" && (
                <button onClick={() => handleStatus(o, "preparing")} className="flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-black text-ink">
                  <Package size={14} /> Préparer
                </button>
              )}
              {o.status === "preparing" && (
                <button onClick={() => handleStatus(o, "shipped")} className="flex items-center gap-1.5 rounded-full bg-violet-500 px-4 py-2 text-xs font-black text-white">
                  <Truck size={14} /> Expédier
                </button>
              )}
              {(o.status === "shipped" || o.status === "validated") && (
                <button onClick={() => handleStatus(o, "delivered")} className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-black text-ink">
                  <Truck size={14} /> Livrée
                </button>
              )}
              {o.status !== "cancelled" && o.status !== "delivered" && (
                <button onClick={() => handleStatus(o, "cancelled")} className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold hover:bg-signal">
                  <X size={14} /> Refuser
                </button>
              )}
              {o.status === "cancelled" && (
                <button onClick={() => handleStatus(o, "pending")} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold">
                  Remettre en attente
                </button>
              )}
              <button onClick={() => setOpenQr(openQr === o.id ? null : o.id)} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold hover:bg-white/10">
                QR client
              </button>
              <button onClick={() => handleDelete(o)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-signal hover:bg-signal hover:text-white" aria-label="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>
            {openQr === o.id && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-ink p-3">
                <div className="rounded-xl bg-white p-2">
                  <QRCode value={orderQrText(o)} size={84} />
                </div>
                <p className="text-xs text-cream/60">Le client scanne : ticket complet + lien suivi.<br /><span className="font-mono break-all">{orderUrl(o.id)}</span></p>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-cream/40">
        {backendEnabled
          ? "Serveur partagé actif : toutes les commandes clients arrivent ici. Actualise pendant les rush (matchs, TikTok live)."
          : "Note: sans backend, les commandes sont stockées dans le navigateur de l'appareil où elles sont passées."}
      </p>
    </div>
  );
}
