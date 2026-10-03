"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useShop } from "./ShopProvider";
import { fmtDA } from "@/lib/mock-data";
import { unitPrice } from "@/lib/orders";

export function CartFab() {
  const { count, setCartOpen } = useShop();
  return (
    <button
      onClick={() => setCartOpen(true)}
      aria-label="Panier"
      className="fixed right-4 bottom-24 z-50 grid h-14 w-14 place-items-center rounded-full bg-signal text-white shadow-2xl shadow-signal/40 transition hover:scale-110 md:right-6 md:bottom-8"
    >
      <ShoppingBag size={24} />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 grid h-6 min-w-6 place-items-center rounded-full bg-cream px-1 text-xs font-black text-ink"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function CartDrawer() {
  const { items, setQty, cartOpen, setCartOpen, subtotal } = useShop();
  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[61] flex w-full max-w-md flex-col bg-coal"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <p className="font-display text-2xl uppercase">
                Panier <span className="font-arabic text-base text-gold">السلة</span>
              </p>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Fermer"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-signal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <ShoppingBag size={48} className="mx-auto text-cream/20" />
                    <p className="mt-4 font-bold">Panier vide</p>
                    <p className="font-arabic text-sm text-cream/50">السلة فارغة</p>
                    <Link
                      href="/vetements"
                      onClick={() => setCartOpen(false)}
                      className="mt-5 inline-block rounded-full bg-cream px-7 py-3 text-sm font-black text-ink uppercase"
                    >
                      Voir les maillots
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((i) => (
                    <div
                      key={`${i.productId}-${i.size}-${i.flocageLabel ?? "plain"}`}
                      className="flex gap-3 rounded-3xl border border-white/10 bg-ink p-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={i.image}
                        alt=""
                        onError={(e) => {
                          const t = e.currentTarget;
                          if (!t.src.endsWith("/logo.jpg")) t.src = "/logo.jpg";
                        }}
                        className="h-20 w-16 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{i.name}</p>
                        <p className="text-xs text-cream/50">Taille: {i.size}</p>
                        {i.flocageLabel ? (
                          <p className="mt-0.5 truncate text-xs font-bold text-gold">
                            ✍ {i.flocageLabel} <span className="font-normal text-cream/50">(+{fmtDA(i.flocagePrice ?? 0)})</span>
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-sm font-black text-cream">{fmtDA(unitPrice(i))}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => setQty(i.productId, i.size, i.flocageLabel, i.qty - 1)}
                            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 hover:bg-signal"
                            aria-label="Moins"
                          >
                            {i.qty === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                          </button>
                          <span className="w-6 text-center text-sm font-black">{i.qty}</span>
                          <button
                            onClick={() => setQty(i.productId, i.size, i.flocageLabel, i.qty + 1)}
                            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 hover:bg-signal"
                            aria-label="Plus"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-white/10 p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-cream/60">Sous-total</span>
                  <span className="font-black">{fmtDA(subtotal)}</span>
                </div>
                <p className="mt-1 text-xs text-cream/50">+ livraison selon wilaya (calculée à l&apos;étape suivante)</p>
                <Link
                  href="/commande"
                  onClick={() => setCartOpen(false)}
                  className="mt-4 block rounded-full bg-signal py-4 text-center font-black tracking-widest uppercase shadow-xl shadow-signal/30"
                >
                  Commander →
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
