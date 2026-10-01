"use client";

import Link from "next/link";
import QRCode from "react-qr-code";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bike, Building2, CheckCircle2 } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import ZoomBg from "@/components/ZoomBg";
import { useShop } from "@/components/ShopProvider";
import { DELIVERY_LABEL, deliveryFee, type DeliveryType } from "@/lib/delivery";
import { fmtDA } from "@/lib/mock-data";
import { orderUrl, type Order } from "@/lib/orders";
import { loadWilayas, pad2, type Wilaya } from "@/lib/wilayas";
import { useSiteData } from "@/lib/store";

const inputCls =
  "w-full rounded-2xl border border-white/12 bg-ink px-4 py-3 text-sm outline-none focus:border-signal";

export default function CommandePage() {
  const { settings } = useSiteData();
  const { items, subtotal, clearCart } = useShop();
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaCode, setWilayaCode] = useState(16);
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState<DeliveryType>("home");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Order | null>(null);

  const { place } = useShop();

  useEffect(() => {
    loadWilayas().then(setWilayas).catch(() => setWilayas([]));
  }, []);

  const wilaya = useMemo(
    () => wilayas.find((w) => w.code === wilayaCode),
    [wilayas, wilayaCode]
  );
  const fee = deliveryFee(wilayaCode, delivery);

  const pickWilaya = (code: number) => {
    setWilayaCode(code);
    setCommune("");
  };

  if (done) {
    return (
      <div className="grid min-h-screen place-items-center px-5 pt-28 pb-16">
        <ZoomBg src={settings.backgrounds.shop} />
        <div className="w-full max-w-md rounded-[2rem] border border-white/12 bg-coal p-8 text-center">
          <CheckCircle2 size={56} className="mx-auto text-[#25D366]" />
          <h1 className="mt-4 font-display text-3xl uppercase">Commande reçue !</h1>
          <p className="font-arabic mt-1 text-gold">!طلبك وصلنا</p>
          <p className="mt-3 text-sm text-cream/60">
            On t&apos;appellera pour confirmer. Garde ton numéro de commande :
          </p>
          <p className="mx-auto mt-4 w-fit rounded-2xl bg-signal px-8 py-3 font-mono text-3xl font-black tracking-[0.2em]">
            {done.id}
          </p>
          <div className="mx-auto mt-5 w-fit rounded-3xl bg-white p-4">
            <QRCode value={orderUrl(done.id)} size={160} />
          </div>
          <p className="mt-3 text-xs text-cream/50">
            Scanne pour suivre ta commande • Total: <b className="text-cream">{fmtDA(done.total)}</b> ({DELIVERY_LABEL[done.delivery].fr})
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link href="/vetements" className="rounded-full bg-cream py-3 text-sm font-black text-ink uppercase">
              Continuer
            </Link>
            <Link href={`/suivi/${done.id}`} className="rounded-full border border-white/20 py-3 text-sm font-bold hover:bg-white/10">
              Suivre →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center px-5 pt-28">
        <ZoomBg src={settings.backgrounds.shop} />
        <div className="text-center">
          <p className="font-display text-4xl uppercase">Panier vide</p>
          <p className="font-arabic mt-2 text-cream/60">السلة فارغة</p>
          <Link href="/vetements" className="mt-6 inline-block rounded-full bg-signal px-8 py-3.5 font-black uppercase">
            Voir les maillots
          </Link>
        </div>
      </div>
    );
  }

  const submit = () => {
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (name.trim().length < 3) return setError("Écris ton nom complet / اكتب اسمك الكامل");
    if (!/^0(5|6|7)\d{8}$/.test(cleanPhone))
      return setError("Numéro invalide — ex: 0550123456 / رقم الهاتف غلط");
    if (!wilaya) return setError("Choisis ta wilaya / اختر ولايتك");
    if (!commune) return setError("Choisis ta commune / اختر بلديتك");
    if (delivery === "home" && address.trim().length < 4)
      return setError("Écris ton adresse pour la livraison à domicile");
    setError("");
    const order = place({
      name: name.trim(),
      phone: cleanPhone,
      wilaya: wilaya.name,
      wilayaCode,
      commune,
      address: address.trim(),
      delivery,
      notes: notes.trim(),
      items,
    });
    clearCart();
    setDone(order);
    window.scrollTo(0, 0);
  };

  return (
    <div className="pt-32 pb-10">
      <ZoomBg src={settings.backgrounds.shop} />
      <section className="mx-auto max-w-3xl px-5 sm:px-8">
        <Link href="/vetements" className="flex items-center gap-2 text-sm text-cream/60 hover:text-cream">
          <ArrowLeft size={16} /> Retour boutique
        </Link>
        <div className="mt-2">
          <SectionHeading kicker="Finaliser" title="Commander" arabic="تأكيد الطلب" center={false} />
        </div>

        <div className="mt-6 rounded-[2rem] border border-white/12 bg-coal/90 p-6 backdrop-blur sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-1">
              <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Nom complet • الاسم</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Mohamed Laidi" className={inputCls} />
            </label>
            <label className="block sm:col-span-1">
              <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Téléphone • الهاتف</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0550 00 00 00" inputMode="tel" className={inputCls} />
            </label>
            <label className="block sm:col-span-1">
              <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Wilaya • الولاية ({wilayas.length || "…"})</span>
              <select value={wilayaCode} onChange={(e) => pickWilaya(Number(e.target.value))} className={inputCls}>
                {wilayas.map((w) => (
                  <option key={w.code} value={w.code} className="bg-coal">
                    {pad2(w.code)} — {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-1">
              <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Commune • البلدية ({wilaya?.communes.length ?? "…"})</span>
              <select value={commune} onChange={(e) => setCommune(e.target.value)} className={inputCls}>
                <option value="" className="bg-coal">— Choisir —</option>
                {wilaya?.communes.map((c) => (
                  <option key={c} value={c} className="bg-coal">{c}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-6 mb-2 text-[11px] font-black tracking-widest text-cream/60 uppercase">Livraison • التوصيل</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(["home", "bureau"] as DeliveryType[]).map((t) => (
              <button
                key={t}
                onClick={() => setDelivery(t)}
                className={`flex items-center gap-3 rounded-3xl border p-4 text-left transition ${
                  delivery === t ? "border-signal bg-signal/10" : "border-white/12 bg-ink hover:border-white/30"
                }`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${delivery === t ? "bg-signal text-white" : "bg-white/10"}`}>
                  {t === "home" ? <Bike size={21} /> : <Building2 size={21} />}
                </span>
                <span>
                  <span className="block text-sm font-black">{DELIVERY_LABEL[t].fr}</span>
                  <span className="font-arabic block text-xs text-cream/60">{DELIVERY_LABEL[t].ar}</span>
                  <span className="mt-0.5 block text-sm font-black text-gold">{fmtDA(deliveryFee(wilayaCode, t))}</span>
                </span>
              </button>
            ))}
          </div>

          {delivery === "home" && (
            <label className="mt-4 block">
              <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Adresse exacte • العنوان</span>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rue, cité, point de repère…" className={inputCls} />
            </label>
          )}
          <label className="mt-4 block">
            <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Note (optionnel)</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Taille spéciale, appel avant livraison…" className={inputCls} />
          </label>

          <div className="mt-6 space-y-1.5 rounded-3xl bg-ink p-5 text-sm">
            <div className="flex justify-between text-cream/70"><span>Articles ({items.reduce((n, i) => n + i.qty, 0)})</span><span>{fmtDA(subtotal)}</span></div>
            <div className="flex justify-between text-cream/70"><span>Livraison {DELIVERY_LABEL[delivery].fr}</span><span>{fmtDA(fee)}</span></div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-black"><span>Total — المجموع</span><span className="text-gold">{fmtDA(subtotal + fee)}</span></div>
            <p className="text-xs text-cream/50">Paiement à la livraison (Cash on delivery)</p>
          </div>

          {error && <p className="mt-4 rounded-2xl bg-signal/15 px-4 py-3 text-center text-sm font-bold text-red-300">{error}</p>}

          <button onClick={submit} className="mt-5 w-full rounded-full bg-signal py-4 font-black tracking-widest uppercase shadow-xl shadow-signal/30 transition hover:scale-[1.01]">
            Confirmer la commande ✓
          </button>
        </div>
      </section>
    </div>
  );
}
