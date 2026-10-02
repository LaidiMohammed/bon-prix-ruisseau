"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Lock, LogOut, Pencil, Plus, RotateCcw, Save, Trash2, Unlock } from "lucide-react";
import { fmtDA, type Product } from "@/lib/mock-data";
import { useSiteData, type SiteSettings } from "@/lib/store";
import { apiLogAdminAttempt, backendEnabled, supabase } from "@/lib/backend";
import {
  remoteCreateProduct,
  remoteDeleteProduct,
  remoteUpdateProduct,
} from "@/lib/catalog-admin";
import OrdersAdmin from "@/components/OrdersAdmin";
import AdminSecurity from "@/components/AdminSecurity";
import ProductForm from "@/components/ProductForm";

const PASS = "bpr2026"; // mode local uniquement (sans backend)

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
  const { settings, products, saveSettings, saveProducts, resetAll, ready, reloadCatalog } = useSiteData();
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [tab, setTab] = useState<"site" | "products" | "orders" | "securite">("orders");
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  // Sauvegarde produit : serveur direct en mode backend (visible en ligne),
  // local sinon. Le stock saisi est réparti sur les tailles.
  const saveProduct = async (p: Product) => {
    if (!backendEnabled) {
      if (editing) saveProducts(products.map((x) => (x.id === editing.id ? p : x)));
      else saveProducts([p, ...products]);
      setShowForm(false);
      setEditing(null);
      return;
    }
    setSaving(true);
    setCatalogError("");
    try {
      if (editing) await remoteUpdateProduct(editing.id, p);
      else await remoteCreateProduct(p);
      setShowForm(false);
      setEditing(null);
      reloadCatalog(); // recharge la liste depuis le serveur
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  const delProduct = async (id: string) => {
    if (!backendEnabled) {
      saveProducts(products.filter((p) => p.id !== id));
      return;
    }
    setCatalogError("");
    try {
      await remoteDeleteProduct(id);
      reloadCatalog();
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : "Suppression impossible");
    }
  };

  if (!ready) return <p className="p-10 text-center">Chargement…</p>;
  const s = draft ?? settings;
  const set = (patch: Partial<SiteSettings>) => setDraft({ ...s, ...patch });

  if (!unlocked) {
    // Backend branché : vrai login admin (rôle vérifié en base). Sinon : code local.
    const login = async () => {
      const client = supabase();
      if (!client) return;
      setBusy(true);
      setAuthError("");
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error || !data.user) throw new Error("Email ou mot de passe invalide");
        const { data: row, error: rerr } = await client
          .from("users")
          .select("role,is_active")
          .eq("id", data.user.id)
          .maybeSingle();
        const r = row as unknown as { role: string; is_active: boolean } | null;
        if (rerr || !r || r.role !== "admin" || !r.is_active) {
          await client.auth.signOut();
          await apiLogAdminAttempt(email.trim(), false); // intrus ou non-admin
          throw new Error("Compte non admin — accès refusé");
        }
        await apiLogAdminAttempt(email.trim(), true); // connexion gérant OK
        setUnlocked(true);
      } catch (e) {
        // Mauvais mot de passe / compte inexistant : on log aussi ( Ips suspects ).
        if (e instanceof Error && e.message !== "Compte non admin — accès refusé") {
          await apiLogAdminAttempt(email.trim(), false);
        }
        setAuthError(e instanceof Error ? e.message : "Connexion impossible");
      } finally {
        setBusy(false);
      }
    };
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-5">
        <div className="w-full max-w-sm rounded-[2rem] border border-white/12 bg-coal p-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="BPR" className="mx-auto h-16 w-auto rounded-2xl border border-white/15" />
          <span className="mx-auto mt-4 grid h-14 w-14 place-items-center rounded-full bg-signal/15 text-signal">
            <Lock size={24} />
          </span>
          <h1 className="mt-4 font-display text-3xl uppercase">Studio caché</h1>
          <p className="mt-1 text-sm text-cream/60">
            Panneau réservé au gérant. {backendEnabled ? "Connecte-toi." : "Code d'accès requis."}
          </p>
          {backendEnabled ? (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email gérant"
                className="mt-5 w-full rounded-2xl border border-white/12 bg-ink px-4 py-3 text-center outline-none focus:border-signal"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                placeholder="Mot de passe"
                className="mt-2.5 w-full rounded-2xl border border-white/12 bg-ink px-4 py-3 text-center outline-none focus:border-signal"
              />
              {authError && (
                <p className="mt-3 rounded-2xl bg-signal/15 px-4 py-2.5 text-sm font-bold text-red-300">
                  {authError}
                </p>
              )}
              <button
                onClick={login}
                disabled={busy}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-signal py-3 font-black uppercase disabled:opacity-50"
              >
                <Unlock size={17} /> {busy ? "Vérification…" : "Se connecter"}
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
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
            {backendEnabled && (
              <button
                onClick={() => {
                  supabase()?.auth.signOut();
                  setUnlocked(false);
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-bold hover:bg-white/10"
              >
                <LogOut size={14} /> Sortir
              </button>
            )}
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

        <div className="mt-6 flex flex-wrap gap-2">
          {(["orders", "site", "products", "securite"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-6 py-2.5 text-sm font-bold ${tab === t ? "bg-cream text-ink" : "bg-white/10"}`}
            >
              {t === "site"
                ? "Site & contenus"
                : t === "orders"
                  ? "Commandes"
                  : t === "securite"
                    ? "🛡 Sécurité"
                    : `Produits (${products.length})`}
            </button>
          ))}
        </div>

        {tab === "orders" ? (
          <OrdersAdmin />
        ) : tab === "site" ? (
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
                {backendEnabled
                  ? "Commandes : serveur partagé Supabase (tous les clients). Textes du site : ce navigateur pour l'instant."
                  : "Tout est sauvegardé dans ce navigateur (localStorage). Backend Supabase prêt — voir supabase/schema-pro.sql."}
              </p>
            </div>
          </div>
        ) : tab === "products" ? (
          <div className="mt-6">
            {backendEnabled && (
              <p className="mb-4 rounded-3xl border border-[#25D366]/40 bg-[#25D366]/10 p-5 text-sm text-cream/80">
                Catalogue partagé actif : tout ce que tu ajoutes ici apparaît <b>directement sur le site</b>.
                Le stock saisi est réparti sur les tailles.
              </p>
            )}
            {catalogError && (
              <p className="mb-4 rounded-2xl bg-signal/15 px-4 py-2.5 text-center text-sm font-bold text-red-300">
                {catalogError}
              </p>
            )}
            {!showForm && (
              <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-black text-ink">
                <Plus size={16} /> Ajouter un modèle
              </button>
            )}
            {showForm && (
              <div className="mb-4">
                <ProductForm
                  initial={editing ?? undefined}
                  onSave={(p) => {
                    void saveProduct(p);
                  }}
                  onCancel={() => { setShowForm(false); setEditing(null); }}
                />
                {saving && (
                  <p className="mt-3 text-center text-sm font-bold text-gold">
                    Enregistrement sur le serveur… / جاري الحفظ
                  </p>
                )}
              </div>
            )}
            <div className="mt-4 grid gap-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-3xl border border-white/12 bg-coal p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="text-xs text-cream/50">
                      {p.category} • {fmtDA(p.price)} • {p.sizes.join("/")} •{" "}
                      <span className={`font-black ${(p.stock ?? 10) > 5 ? "text-[#25D366]" : (p.stock ?? 10) > 0 ? "text-gold" : "text-red-300"}`}>
                        Stock: {p.stock ?? 10}
                      </span>
                    </p>
                    {p.description ? (
                      <p className="mt-0.5 truncate text-xs text-cream/40">{p.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => { setEditing(p); setShowForm(true); }} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-ink" aria-label="Modifier">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => delProduct(p.id)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-signal hover:bg-signal hover:text-white" aria-label="Supprimer">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <AdminSecurity />
        )}
      </div>
    </div>
  );
}
