"use client";

import type { DeliveryType } from "./delivery";
import { fmtDA } from "./mock-data";

export type CartItem = {
  productId: string;
  name: string;
  size: string;
  price: number;
  image: string;
  qty: number;
  flocageLabel?: string; // e.g. "MBAPPÉ 9" or "MON NOM 10" — empty = none
  flocagePrice?: number;
};

export const unitPrice = (i: Pick<CartItem, "price" | "flocagePrice">) =>
  i.price + (i.flocagePrice ?? 0);

export type OrderStatus =
  | "pending" // en attente (local + serveur)
  | "validated" // validée (ancien statut local — mappé vers confirmed)
  | "confirmed" // confirmée (serveur)
  | "preparing" // en préparation (serveur)
  | "shipped" // expédiée (serveur)
  | "cancelled" // annulée
  | "delivered" // livrée
  | "returned"; // retournée (serveur)

export type Order = {
  id: string; // 8 caractères
  date: string;
  name: string;
  phone: string;
  wilaya: string;
  wilayaCode: number;
  commune: string;
  address: string;
  delivery: DeliveryType;
  notes: string;
  items: CartItem[];
  subtotal: number;
  fee: number;
  total: number;
  status: OrderStatus;
};

const ID_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genOrderId(): string {
  let s = "";
  const buf = new Uint32Array(8);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 8; i++) s += ID_CHARS[buf[i] % ID_CHARS.length];
  return s;
}

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export { readLS, writeLS };

export const STATUS_LABEL: Record<OrderStatus, { fr: string; ar: string }> = {
  pending: { fr: "En attente", ar: "قيد المراجعة" },
  validated: { fr: "Validée ✓", ar: "مقبولة ✓" },
  confirmed: { fr: "Confirmée ✓", ar: "مؤكدة ✓" },
  preparing: { fr: "En préparation", ar: "قيد التحضير" },
  shipped: { fr: "Expédiée", ar: "تم الشحن" },
  cancelled: { fr: "Annulée", ar: "ملغاة" },
  delivered: { fr: "Livrée", ar: "تم التوصيل" },
  returned: { fr: "Retournée", ar: "مرتجعة" },
};

export const orderUrl = (id: string) =>
  typeof window !== "undefined"
    ? `${window.location.origin}/suivi/${id}`
    : `/suivi/${id}`;

// Ticket encodé DANS le QR : n'importe quel scanner affiche nom, N°,
// téléphone, total et statut — plus le lien de suivi en direct.
export const orderQrText = (o: Order) =>
  [
    "BPR • Bon Prix Ruisseau Sports — Alger",
    `N° commande : ${o.id}`,
    `Nom : ${o.name}`,
    `Tél : ${o.phone}`,
    `Articles : ${o.items.reduce((n, i) => n + i.qty, 0)} — Total : ${fmtDA(o.total)}`,
    `Statut : ${STATUS_LABEL[o.status].fr}`,
    `Suivi en direct : ${orderUrl(o.id)}`,
  ].join("\n");
