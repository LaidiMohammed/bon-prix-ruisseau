"use client";

import type { DeliveryType } from "./delivery";

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

export type OrderStatus = "pending" | "validated" | "cancelled" | "delivered";

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
  cancelled: { fr: "Annulée", ar: "ملغاة" },
  delivered: { fr: "Livrée", ar: "تم التوصيل" },
};

export const orderUrl = (id: string) =>
  typeof window !== "undefined"
    ? `${window.location.origin}/suivi/${id}`
    : `/suivi/${id}`;
