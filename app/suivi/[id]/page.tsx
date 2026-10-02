"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Phone } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import ZoomBg from "@/components/ZoomBg";
import { useShop } from "@/components/ShopProvider";
import { apiTrackOrder, ApiError, backendEnabled } from "@/lib/backend";
import type { Order } from "@/lib/orders";
import { useSiteData } from "@/lib/store";

const isBpr = (id: string) => /^BPR-/i.test(id.trim());

export default function SuiviIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const number = id.trim().toUpperCase();
  const { settings } = useSiteData();
  const { orders } = useShop();
  const local = orders.find((o) => o.id.toUpperCase() === number);

  // Suivi serveur (n° BPR-) : le téléphone protège la commande.
  const [phone, setPhone] = useState("");
  const [remote, setRemote] = useState<Order | null>(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState("");

  const track = async () => {
    const clean = phone.replace(/[\s-]/g, "");
    if (!/^0(5|6|7)\d{8}$/.test(clean)) {
      setError("Numéro invalide — ex: 0550123456 / رقم الهاتف غلط");
      return;
    }
    setError("");
    setLooking(true);
    try {
      const o = await apiTrackOrder(number, clean);
      if (!o) setError("Introuvable — vérifie le N° et le téléphone / تحقق من الرقم");
      setRemote(o);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Serveur injoignable — réessaie");
      setRemote(null);
    } finally {
      setLooking(false);
    }
  };

  const order = local ?? remote;
  const showGate = !order && isBpr(number) && backendEnabled;

  return (
    <div className="pt-32 pb-10">
      <ZoomBg src={settings.backgrounds.store} />
      <section className="mx-auto max-w-2xl px-5 sm:px-8">
        {order ? (
          <OrderCard order={order} />
        ) : showGate ? (
          <div className="rounded-[2rem] border border-white/12 bg-coal p-8 text-center">
            <p className="font-mono text-xl font-black tracking-[0.12em] break-all sm:text-2xl">
              {number}
            </p>
            <p className="mt-3 text-sm text-cream/60">
              Entre le téléphone de la commande pour la voir (n’importe quel appareil).
              <span className="font-arabic block">أدخل هاتف الطلب لرؤيته</span>
            </p>
            <div className="mx-auto mt-5 flex max-w-sm items-center gap-2 rounded-full border border-white/15 bg-ink px-5 py-3">
              <Phone size={17} className="shrink-0 text-cream/50" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && track()}
                placeholder="0550 00 00 00"
                inputMode="tel"
                className="w-full bg-transparent text-sm outline-none placeholder:text-cream/40"
              />
            </div>
            {error && (
              <p className="mx-auto mt-3 max-w-sm rounded-2xl bg-signal/15 px-4 py-2.5 text-sm font-bold text-red-300">
                {error}
              </p>
            )}
            <button
              onClick={track}
              disabled={looking}
              className="mt-4 rounded-full bg-signal px-8 py-3 text-sm font-black uppercase disabled:opacity-50"
            >
              {looking ? "Recherche…" : "Voir ma commande"}
            </button>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/12 bg-coal p-8 text-center">
            <p className="font-mono text-2xl font-black tracking-[0.15em]">{number}</p>
            <p className="mt-3 text-sm text-cream/60">
              Commande introuvable — vérifie le N° ou passe au magasin.
            </p>
            <Link href="/suivi" className="mt-5 inline-block rounded-full bg-cream px-7 py-3 text-sm font-black text-ink uppercase">
              Rechercher
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
