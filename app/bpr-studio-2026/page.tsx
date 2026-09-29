"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Lock, Plus, RotateCcw, Save, Trash2, Unlock } from "lucide-react";
import { CATEGORIES, fmtDA, type Product } from "@/lib/mock-data";
import { useSiteData, type SiteSettings } from "@/lib/store";

const PASS = "bpr2026";

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/12 bg-ink px-4 py-2.5 text-sm outline-none focus:border-signal"
      />
    </label>
  );
}

export default function AdminPage() {
  const { settings, products, saveSettings, saveProducts, resetAll, ready } = useSiteData();
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [tab, setTab] = useState<"site" | "products">("site");
  const [saved, setSaved] = useState(false);

  if (!ready) return <p className="p-10 text-center">Chargement…</p>;
  const s = draft ?? settings;
  const set = (patch: Partial<SiteSettings>) => setDraft({ ...s, ...patch });

  if (!unlocked) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-5">
        <div className="w-full max-w-sm rounded-[2rem] border border-white/12 bg-coal p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-signal/15 text-signal">
            <Lock size={24} />
          </span>
          <h1 className="mt-4 font-display text-3xl uppercase">Studio caché</h1>
          <p className="mt-1 text-sm text-cream/60">
            Panneau réservé au gérant. Code d&apos;accès requis.
          </p>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && code === PASS && setUnlocked(true)}
            placeholder="Code…"
            className="mt-5 w-full rounded-2xl border border-white/12 bg-ink px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-signal"
          />
          <button
            onClick={() => code === PASS && setUnlocked(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-signal py-3 font-black uppercase"
          >
            <Unlock size={17} /> Déverrouiller
          </button>
          <p className="mt-3 text-[11px] text-cream/40">Indice: demande au développeur (bpr2026)</p>
          <Link href="/" className="mt-4 inline-block text-xs text-cream/50 underline">
            ← Retour au site
          </Link>
        </div>
      </div>
    );
  }

  const save = () => {
    if (draft) saveSettings(draft);
    setDraft(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addProduct = () => {
    const p: Product = {
      id: `p-${Date.now()}`,
      name: "Nouveau modèle",
      nameAr: "موديل جديد",
      category: "Maillots",
      price: 2900,
      sizes: ["S", "M", "L", "XL"],
      image: settings.backgrounds.shop,
      rating: 5,
    };
    saveProducts([p, ...products]);
  };

  const delProduct = (id: string) => saveProducts(products.filter((p) => p.id !== id));

  return (
    <div className="min-h-screen bg-ink px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm text-cream/60 hover:text-cream">
            <ArrowLeft size={16} /> Voir le site
          </Link>
          <h1 className="font-display text-3xl uppercase sm:text-4xl">
            BPR <span className="text-signal">Studio</span>
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetAll();
                setDraft(null);
              }}
              className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-bold hover:bg-white/10"
            >
              <RotateCcw size={14} /> Réinitialiser
            </button>
            <button
              onClick={save}
              className="flex items-center gap-1.5 rounded-full bg-signal px-5 py-2 text-xs font-black uppercase"
            >
              <Save size={14} /> {saved ? "Enregistré ✓" : "Enregistrer"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {(["site", "products"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-6 py-2.5 text-sm font-bold ${tab === t ? "bg-cream text-ink" : "bg-white/10"}`}
            >
              {t === "site" ? "Site & contenus" : `Produits (${products.length})`}
            </button>
          ))}
        </div>

        {tab === "site" ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/12 bg-coal p-6">
              <p className="font-display text-xl uppercase">Hero — vidéo d&apos;accueil</p>
              <div className="mt-4 space-y-3">
                <Field label="URL vidéo (mp4) — mets ton lien TikTok exporté ou /videos/hero.mp4" value={s.heroVideo} onChange={(v) => set({ heroVideo: v })} />
                <Field label="Titre hero" value={s.heroTitle} onChange={(v) => set({ heroTitle: v })} />
                <Field label="Titre arabe" value={s.heroTitleAr} onChange={(v) => set({ heroTitleAr: v })} />
                <Field label="Sous-titre" value={s.heroSubtitle} onChange={(v) => set({ heroSubtitle: v })} />
                <Field label="Bandeau promo" value={s.promo} onChange={(v) => set({ promo: v })} />
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-white/12 bg-coal p-6">
              <p className="font-display text-xl uppercase">Réseaux & fonds</p>
              <div className="mt-4 space-y-3">
                <Field label="TikTok" value={s.socials.tiktok} onChange={(v) => set({ socials: { ...s.socials, tiktok: v } })} />
                <Field label="Instagram" value={s.socials.instagram} onChange={(v) => set({ socials: { ...s.socials, instagram: v } })} />
                <Field label="Facebook" value={s.socials.facebook} onChange={(v) => set({ socials: { ...s.socials, facebook: v } })} />
                <Field label="WhatsApp" value={s.socials.whatsapp} onChange={(v) => set({ socials: { ...s.socials, whatsapp: v } })} />
                <Field label="Fond boutique" value={s.backgrounds.shop} onChange={(v) => set({ backgrounds: { ...s.backgrounds, shop: v } })} />
                <Field label="Fond à-propos" value={s.backgrounds.about} onChange={(v) => set({ backgrounds: { ...s.backgrounds, about: v } })} />
                <Field label="Fond magasin" value={s.backgrounds.store} onChange={(v) => set({ backgrounds: { ...s.backgrounds, store: v } })} />
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-white/12 bg-coal p-6 md:col-span-2">
              <p className="font-display text-xl uppercase">Magasin</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Adresse" value={s.shop.address} onChange={(v) => set({ shop: { ...s.shop, address: v } })} />
                <Field label="Adresse AR" value={s.shop.addressAr} onChange={(v) => set({ shop: { ...s.shop, addressAr: v } })} />
                <Field label="Horaires" value={s.shop.hours} onChange={(v) => set({ shop: { ...s.shop, hours: v } })} />
                <Field label="Horaires AR" value={s.shop.hoursAr} onChange={(v) => set({ shop: { ...s.shop, hoursAr: v } })} />
              </div>
              <p className="mt-4 text-xs text-cream/50">
                Tout est sauvegardé dans ce navigateur (localStorage). Backend Supabase prêt pour plus tard — voir supabase/schema.sql.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <button onClick={addProduct} className="flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-black text-ink">
              <Plus size={16} /> Ajouter un modèle
            </button>
            <div className="mt-4 grid gap-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-3xl border border-white/12 bg-coal p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="text-xs text-cream/50">
                      {p.category} • {fmtDA(p.price)} • {p.sizes.join("/")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CATEGORIES.filter((c) => c !== "Tous").map((c) => (
                        <button
                          key={c}
                          onClick={() => saveProducts(products.map((x) => (x.id === p.id ? { ...x, category: c } : x)))}
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${p.category === c ? "bg-signal text-white" : "bg-white/10"}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => delProduct(p.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-signal hover:bg-signal hover:text-white" aria-label="Supprimer">
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
