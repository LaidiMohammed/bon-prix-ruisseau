"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import SectionHeading from "@/components/SectionHeading";
import ZoomBg from "@/components/ZoomBg";
import { useShop } from "@/components/ShopProvider";
import { apiGetOrder, backendEnabled } from "@/lib/backend";
import type { Order } from "@/lib/orders";
import { useSiteData } from "@/lib/store";

export default function SuiviPage() {
  const { settings } = useSiteData();
  const { orders } = useShop();
  const [q, setQ] = useState("");
  const [searched, setSearched] = useState(false);
  const [remote, setRemote] = useState<Order[]>([]);

  const clean = q.trim().toUpperCase().replace(/[\s-]/g, "");

  const doSearch = () => {
    setRemote([]); // event handler: sync reset is fine here
    setSearched(true);
  };

  // Exact order number: also check the shared server (other phone / PC).
  useEffect(() => {
    if (!backendEnabled || !searched || !/^[A-Z2-9]{8}$/.test(clean)) return;
    let alive = true;
    apiGetOrder(clean)
      .then((o) => {
        if (alive) setRemote(o ? [o] : []);
      })
      .catch(() => {
        if (alive) setRemote([]);
      });
    return () => {
      alive = false;
    };
  }, [searched, clean]);

  const localResults = searched
    ? orders.filter(
        (o) =>
          o.id.toUpperCase() === clean ||
          o.phone.replace(/[\s-]/g, "") === clean ||
          o.name.toUpperCase().includes(clean)
      )
    : [];
  const results = [
    ...remote.filter((r) => !localResults.some((o) => o.id === r.id)),
    ...localResults,
  ];

  return (
    <div className="pt-32 pb-10">
      <ZoomBg src={settings.backgrounds.store} />
      <section className="mx-auto max-w-2xl px-5 sm:px-8">
        <SectionHeading kicker="Mes achats" title="Suivi commande" arabic="تتبع طلبك" />
        <div className="glass mt-8 flex items-center gap-2 rounded-full border border-white/15 px-5 py-3.5">
          <Search size={18} className="shrink-0 text-cream/50" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSearched(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="N° commande (8 lettres), téléphone ou nom…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-cream/40"
          />
          <button
            onClick={doSearch}
            className="shrink-0 rounded-full bg-signal px-5 py-2 text-xs font-black uppercase"
          >
            Voir
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {searched && results.length === 0 && (
            <p className="rounded-3xl border border-white/12 bg-coal p-6 text-center text-sm text-cream/60">
              Aucune commande trouvée (ni sur cet appareil{backendEnabled ? ", ni en ligne" : ""}).
              <span className="font-arabic block">لم يتم العثور على طلب</span>
              <span className="mt-1 block text-xs">Astuce: tape le N° à 8 caractères du ticket de commande.</span>
            </p>
          )}
          {results.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
          {!searched && orders.length > 0 && (
            <button onClick={() => { setQ(""); setSearched(true); }} className="w-full text-center text-xs text-cream/50 underline">
              Voir mes achats sur cet appareil ({orders.length})
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
