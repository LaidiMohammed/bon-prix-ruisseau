"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Star, X } from "lucide-react";
import { useState } from "react";
import { fmtDA, type Product } from "@/lib/mock-data";

export default function QuickView({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [size, setSize] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="arch-sm grid max-h-[90svh] w-full max-w-3xl overflow-y-auto border border-white/15 bg-coal no-scrollbar md:grid-cols-2"
          >
            <div className="relative min-h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent md:bg-gradient-to-r" />
            </div>
            <div className="relative p-6 sm:p-8">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-signal"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
              <p className="text-[11px] font-black tracking-[0.25em] text-signal uppercase">
                {product.category} • <span className="font-arabic">{product.nameAr}</span>
              </p>
              <h3 className="mt-2 font-display text-3xl tracking-wide">
                {product.name}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-gold">
                <Star size={14} fill="currentColor" /> {product.rating} — avis clients vérifiés
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-black">{fmtDA(product.price)}</span>
                {product.oldPrice && (
                  <span className="text-cream/40 line-through">
                    {fmtDA(product.oldPrice)}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm font-bold tracking-widest text-cream/60 uppercase">
                Taille — اختر المقاس
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      size === s
                        ? "bg-signal text-white"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <a
                href={`https://wa.me/213550000000?text=${encodeURIComponent(
                  `Salam BPR, je veux: ${product.name} (${size ?? "taille à confirmer"}) — ${fmtDA(product.price)}`
                )}`}
                target="_blank"
                className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 font-black text-ink transition hover:scale-[1.02]"
              >
                <MessageCircle size={19} /> Commander sur WhatsApp
              </a>
              <p className="mt-3 text-center text-xs text-cream/50">
                Paiement à la livraison • Échange sous 7 jours au magasin Ruisseau
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
