"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, ShoppingBag, Star, X } from "lucide-react";
import { useState } from "react";
import { fmtDA, FLOCAGE_PRICES, STAR_FLOCK, type Product } from "@/lib/mock-data";
import { useShop } from "./ShopProvider";

type FlockMode = "none" | "player" | "custom";

export default function QuickView({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [flock, setFlock] = useState<FlockMode>("none");
  const [flockPlayer, setFlockPlayer] = useState("");
  const [flockName, setFlockName] = useState("");
  const [flockNumber, setFlockNumber] = useState("");
  const { add } = useShop();

  // reset when another product opens
  const pid = product?.id;
  const [lastPid, setLastPid] = useState(pid);
  if (pid !== lastPid) {
    setLastPid(pid);
    setSize(null);
    setAdded(false);
    setFlock("none");
    setFlockPlayer("");
    setFlockName("");
    setFlockNumber("");
  }

  const inStock = (product?.stock ?? 10) > 0;
  const flockInfo = !product
    ? { label: undefined as string | undefined, price: 0, ok: true }
    : flock === "none"
      ? { label: undefined as string | undefined, price: 0, ok: true }
      : flock === "player"
        ? { label: flockPlayer || undefined, price: FLOCAGE_PRICES.player, ok: flockPlayer !== "" }
        : {
            label:
              flockName.trim() !== "" || flockNumber.trim() !== ""
                ? `${flockName.trim().toUpperCase() || "MON NOM"}${flockNumber.trim() !== "" ? ` ${flockNumber.trim()}` : ""}`.trim()
                : undefined,
            price: FLOCAGE_PRICES.custom,
            ok: flockName.trim() !== "" || flockNumber.trim() !== "",
          };
  const canAdd = !!product && !!size && inStock && flockInfo.ok;

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
              {product.description ? (
                <p className="mt-3 rounded-2xl bg-white/5 p-3.5 text-sm leading-relaxed text-cream/80">
                  {product.description}
                  {product.descriptionAr ? (
                    <span className="font-arabic mt-1 block text-cream/60">{product.descriptionAr}</span>
                  ) : null}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-black">{fmtDA(product.price)}</span>
                {product.oldPrice && (
                  <span className="text-cream/40 line-through">
                    {fmtDA(product.oldPrice)}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black tracking-widest uppercase ${
                    inStock ? "bg-[#25D366]/15 text-[#25D366]" : "bg-signal/15 text-red-300"
                  }`}
                >
                  {inStock ? "● En stock" : "Rupture"}
                </span>
              </div>
              <p className="mt-4 text-sm font-bold tracking-widest text-cream/60 uppercase">
                Flocage — الطباعة <span className="text-gold normal-case">+{fmtDA(FLOCAGE_PRICES.player)} / +{fmtDA(FLOCAGE_PRICES.custom)}</span>
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    { v: "none", l: "Sans" },
                    { v: "player", l: "Joueur ⭐" },
                    { v: "custom", l: "Mon nom ✍" },
                  ] as { v: FlockMode; l: string }[]
                ).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setFlock(o.v)}
                    className={`rounded-2xl px-2 py-2.5 text-xs font-black transition ${
                      flock === o.v ? "bg-gold text-ink" : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              {flock === "player" && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...(product.players ?? []), ...STAR_FLOCK.filter((s) => !(product.players ?? []).includes(s))].map((pl) => (
                    <button
                      key={pl}
                      onClick={() => setFlockPlayer(pl)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                        flockPlayer === pl ? "bg-signal text-white" : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      {pl}
                    </button>
                  ))}
                </div>
              )}
              {flock === "custom" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    value={flockName}
                    onChange={(e) => setFlockName(e.target.value.slice(0, 14))}
                    placeholder="Ton nom — اسمك"
                    className="rounded-2xl border border-white/12 bg-ink px-4 py-2.5 text-sm outline-none focus:border-gold"
                  />
                  <input
                    value={flockNumber}
                    onChange={(e) => setFlockNumber(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    placeholder="N° — 7"
                    inputMode="numeric"
                    className="rounded-2xl border border-white/12 bg-ink px-4 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </div>
              )}
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
              <button
                onClick={() => {
                  if (!product || !canAdd) return;
                  add({
                    productId: product.id,
                    name: product.name,
                    size: size as string,
                    price: product.price,
                    image: product.image,
                    flocageLabel: flockInfo.label,
                    flocagePrice: flockInfo.price || undefined,
                  });
                  setAdded(true);
                  setTimeout(onClose, 600);
                }}
                disabled={!canAdd}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-black transition ${
                  canAdd
                    ? "bg-signal text-white shadow-xl shadow-signal/30 hover:scale-[1.02]"
                    : "cursor-not-allowed bg-white/10 text-cream/40"
                }`}
              >
                <ShoppingBag size={19} />
                {!inStock
                  ? "Rupture de stock"
                  : added
                    ? "Ajouté ✓ — أضيف"
                    : !size
                      ? "Choisis ta taille d'abord"
                      : flock !== "none" && !flockInfo.ok
                        ? "Choisis ton flocage"
                        : `Ajouter au panier${flockInfo.price ? ` + ${fmtDA(flockInfo.price)}` : ""}`}
              </button>
              <a
                href={`https://wa.me/213550000000?text=${encodeURIComponent(
                  `Salam BPR, je veux: ${product.name} (${size ?? "taille à confirmer"})${flockInfo.label ? ` + flocage ${flockInfo.label}` : ""} — ${fmtDA(product.price + flockInfo.price)}`
                )}`}
                target="_blank"
                className="mt-2.5 flex items-center justify-center gap-2 rounded-full border border-[#25D366]/50 py-3 text-sm font-bold text-[#25D366] transition hover:bg-[#25D366]/10"
              >
                <MessageCircle size={17} /> ou WhatsApp direct
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
