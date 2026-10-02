"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import SectionHeading from "@/components/SectionHeading";
import ZoomBg from "@/components/ZoomBg";
import { useShop } from "@/components/ShopProvider";
import { backendEnabled } from "@/lib/backend";
import { useSiteData } from "@/lib/store";

export default function SuiviPage() {
  const { settings } = useSiteData();
  const { orders } = useShop();
  const [q, setQ] = useState("");
  const [searched, setSearched] = useState(false);

  const clean = q.trim().toUpperCase().replace(/[\s-]/g, "");
  // N° serveur BPR- : suivi en ligne (vérifié par téléphone sur la page suivante).
  const isBpr =
    backendEnabled && searched && /^BPR-?[0-9-]+$/i.test(q.trim());

  const results = searched
    ? orders.filter(
        (o) =>
          o.id.toUpperCase() === clean ||
          o.phone.replace(/[\s-]/g, "") === clean ||
          o.name.toUpperCase().includes(clean)
      )
    : [];

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
            onKeyDown={(e) => e.key === "Enter" && setSearched(true)}
            placeholder="N° commande (BPR-… ou 8 lettres), téléphone ou nom…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-cream/40"
          />
          <button
            onClick={() => setSearched(true)}
            className="shrink-0 rounded-full bg-signal px-5 py-2 text-xs font-black uppercase"
          >
            Voir
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {isBpr && (
            <Link
              href={`/suivi/${encodeURIComponent(q.trim().toUpperCase())}`}
              className="flex items-center justify-between gap-3 rounded-3xl border border-[#25D366]/40 bg-[#25D366]/10 p-5 text-sm font-bold"
            >
              <span>
                Suivi en ligne : <span className="font-mono">{q.trim().toUpperCase()}</span>
                <span className="font-arabic block text-xs font-normal text-cream/60">
                  تتبع طلبك أونلاين
                </span>
              </span>
              <ArrowRight size={18} className="shrink-0 text-[#25D366]" />
            </Link>
          )}
          {searched && results.length === 0 && !isBpr && (
            <p className="rounded-3xl border border-white/12 bg-coal p-6 text-center text-sm text-cream/60">
              Aucune commande trouvée sur cet appareil.
              <span className="font-arabic block">لم يتم العثور على طلب</span>
              <span className="mt-1 block text-xs">Astuce: pour un N° BPR-, utilise le suivi en ligne ci-dessus.</span>
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
