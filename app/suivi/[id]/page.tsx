"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { OrderCard } from "@/components/OrderCard";
import ZoomBg from "@/components/ZoomBg";
import { useShop } from "@/components/ShopProvider";
import { apiGetOrder, backendEnabled } from "@/lib/backend";
import type { Order } from "@/lib/orders";
import { useSiteData } from "@/lib/store";

export default function SuiviIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { settings } = useSiteData();
  const { orders } = useShop();
  const local = orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
  // undefined = server not checked yet, null = checked, nothing there.
  const [remote, setRemote] = useState<Order | null | undefined>(undefined);

  // Cross-device tracking: if not on this phone, ask the shared server.
  useEffect(() => {
    if (local || !backendEnabled || remote !== undefined) return;
    let alive = true;
    apiGetOrder(id.toUpperCase())
      .then((o) => {
        if (alive) setRemote(o);
      })
      .catch(() => {
        if (alive) setRemote(null);
      });
    return () => {
      alive = false;
    };
  }, [id, local, remote]);

  const order = local ?? remote ?? undefined;
  const checking = backendEnabled && !local && remote === undefined;

  return (
    <div className="pt-32 pb-10">
      <ZoomBg src={settings.backgrounds.store} />
      <section className="mx-auto max-w-2xl px-5 sm:px-8">
        {order ? (
          <OrderCard order={order} />
        ) : (
          <div className="rounded-[2rem] border border-white/12 bg-coal p-8 text-center">
            <p className="font-mono text-2xl font-black tracking-[0.15em]">{id.toUpperCase()}</p>
            <p className="mt-3 text-sm text-cream/60">
              {checking
                ? "Recherche en ligne… / جاري البحث"
                : "Commande introuvable — vérifie le N° (8 caractères) ou passe au magasin."}
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
