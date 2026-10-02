"use client";

import QRCode from "react-qr-code";
import { PackageSearch } from "lucide-react";
import { DELIVERY_LABEL } from "@/lib/delivery";
import { fmtDA } from "@/lib/mock-data";
import { orderUrl, STATUS_LABEL, unitPrice, type Order } from "@/lib/orders";
import { pad2 } from "@/lib/wilayas";

export function statusColor(s: Order["status"]) {
  return s === "validated" || s === "confirmed"
    ? "bg-[#25D366]/15 text-[#25D366]"
    : s === "delivered"
      ? "bg-gold/15 text-gold"
      : s === "cancelled" || s === "returned"
        ? "bg-signal/15 text-red-300"
        : s === "preparing"
          ? "bg-sky-500/15 text-sky-300"
          : s === "shipped"
            ? "bg-violet-500/15 text-violet-300"
            : "bg-white/10 text-cream/70";
}

export function OrderCard({ order, showQr = true }: { order: Order; showQr?: boolean }) {
  return (
    <div className="rounded-[2rem] border border-white/12 bg-coal p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-black tracking-[0.15em]">{order.id}</p>
          <p className="mt-1 text-xs text-cream/50">
            {new Date(order.date).toLocaleString("fr-DZ")} • {order.name} • {order.phone}
          </p>
          <p className="text-xs text-cream/50">
            {pad2(order.wilayaCode)} {order.wilaya} — {order.commune}
            {order.delivery === "home" && order.address ? ` — ${order.address}` : ""} •{" "}
            {DELIVERY_LABEL[order.delivery].fr}
          </p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-xs font-black ${statusColor(order.status)}`}>
          {STATUS_LABEL[order.status].fr}
        </span>
      </div>
      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        {order.items.map((i) => (
          <div key={`${i.productId}-${i.size}`} className="flex items-center gap-3 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.image} alt="" className="h-12 w-10 rounded-xl object-cover" />
            <span className="flex-1 truncate">{i.name} <span className="text-cream/50">× {i.qty} ({i.size})</span>{i.flocageLabel ? <span className="block text-xs font-bold text-gold">✍ {i.flocageLabel}</span> : null}</span>
            <b>{fmtDA(i.qty * unitPrice(i))}</b>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-sm text-cream/70">
        <span>Livraison incluse</span>
        <span className="text-base font-black text-cream">Total: {fmtDA(order.total)}</span>
      </div>
      {showQr && (
        <div className="mt-4 flex items-center gap-4 rounded-3xl bg-ink p-4">
          <div className="rounded-2xl bg-white p-2.5">
            <QRCode value={orderUrl(order.id)} size={88} />
          </div>
          <p className="text-xs text-cream/60">
            <PackageSearch size={15} className="mb-1 text-gold" />
            Garde ce QR — montre-le au magasin pour récupérer ta commande plus vite.
            <span className="font-arabic block">احتفظ بهذا الرمز</span>
          </p>
        </div>
      )}
    </div>
  );
}
