"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ArchCard from "@/components/ArchCard";
import QuickView from "@/components/QuickView";
import SectionHeading from "@/components/SectionHeading";
import ZoomBg from "@/components/ZoomBg";
import { CATEGORIES, type Product } from "@/lib/mock-data";
import { useSiteData } from "@/lib/store";

export default function VetementsPage() {
  const { settings, products } = useSiteData();
  const [cat, setCat] = useState<string>("Tous");
  const [q, setQ] = useState("");
  const [quick, setQuick] = useState<Product | null>(null);

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "Tous" || p.category === cat) &&
          (q.trim() === "" ||
            `${p.name} ${p.nameAr} ${p.category}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [products, cat, q]
  );

  return (
    <div className="pt-32">
      <ZoomBg src={settings.backgrounds.shop} />
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading kicker="Boutique" title="Vêtements" arabic="الملابس" />
        <p className="mx-auto mt-3 max-w-xl text-center text-cream/70">
          Maillots, survêtements, sneakers — clique sur un modèle pour voir et commander sur WhatsApp.
        </p>

        {/* search */}
        <div className="glass mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/15 px-5 py-3">
          <Search size={18} className="text-cream/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher… maillot, survêtement, sneakers / ابحث…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-cream/40"
          />
        </div>

        {/* filters — pills, not squares */}
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                cat === c ? "bg-signal text-white shadow-lg shadow-signal/30" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs tracking-widest text-cream/50 uppercase">
          {list.length} modèle{list.length > 1 ? "s" : ""} — {cat}
        </p>

        {list.length === 0 ? (
          <p className="mt-10 text-center text-cream/60">
            Aucun modèle trouvé. <span className="font-arabic">جرب كلمة أخرى</span> — ou demande sur WhatsApp, on a du nouveau chaque semaine.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {list.map((p, i) => (
              <ArchCard key={p.id} product={p} index={i} onQuickView={setQuick} />
            ))}
          </div>
        )}
        <div className="h-10" />
      </section>
      <QuickView product={quick} onClose={() => setQuick(null)} />
    </div>
  );
}
