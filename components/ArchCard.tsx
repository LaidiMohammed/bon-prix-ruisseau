"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { fmtDA, type Product } from "@/lib/mock-data";

export default function ArchCard({
  product,
  index = 0,
  onQuickView,
}: {
  product: Product;
  index?: number;
  onQuickView: (p: Product) => void;
}) {
  const stock = product.stock ?? 10;
  const inStock = stock > 0;
  const lowStock = stock > 0 && stock <= 5;
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08 }}
      className="group relative"
    >
      <button
        onClick={() => onQuickView(product)}
        className="arch relative block w-full overflow-hidden border border-white/12 bg-coal text-left shadow-2xl shadow-black/50 transition duration-300 group-hover:-translate-y-2"
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-110 ${
              inStock ? "" : "opacity-70 grayscale-[0.5]"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          {product.tag && (
            <span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-signal px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-lg">
              {product.tag}
            </span>
          )}
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-bold text-gold backdrop-blur">
            <Star size={12} fill="currentColor" /> {product.rating}
          </span>
          <span
            className={`absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase backdrop-blur ${
              inStock
                ? lowStock
                  ? "bg-gold/90 text-ink"
                  : "bg-[#25D366]/85 text-ink"
                : "bg-signal/90 text-white"
            }`}
          >
            {inStock ? (lowStock ? "Stock limité" : "● En stock") : "Rupture"}
          </span>
        </div>
        <div className="p-4 pb-5 text-center">
          <p className="text-[10px] font-black tracking-[0.25em] text-signal uppercase">
            {product.category}
          </p>
          <h3 className="mt-1 font-display text-lg leading-tight tracking-wide">
            {product.name}
          </h3>
          <p className="font-arabic text-sm text-cream/60">{product.nameAr}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-lg font-black text-cream">
              {fmtDA(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-cream/40 line-through">
                {fmtDA(product.oldPrice)}
              </span>
            )}
          </div>
          <span
            className={`mt-3 block rounded-full py-2 text-xs font-black tracking-widest uppercase transition ${
              inStock
                ? "bg-cream text-ink group-hover:bg-signal group-hover:text-white"
                : "bg-white/10 text-cream/50"
            }`}
          >
            {inStock ? "Voir + Commander" : "Voir • Rupture"}
          </span>
        </div>
      </button>
    </motion.article>
  );
}
