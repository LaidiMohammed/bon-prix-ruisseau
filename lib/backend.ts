"use client";

import type { Order, OrderStatus } from "./orders";

// Backend = shared server for all users (Supabase via /api/orders).
// Enabled only when env keys exist — otherwise the site keeps working
// 100% in localStorage mode (frontend-only, per-device).
export const backendEnabled =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `http_${res.status}`);
  return data;
}

export type PlaceDraft = Pick<
  Order,
  | "name"
  | "phone"
  | "wilaya"
  | "wilayaCode"
  | "commune"
  | "address"
  | "delivery"
  | "notes"
  | "items"
>;

export async function apiPlaceOrder(draft: PlaceDraft): Promise<Order> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  const data = await parse<{ order: Order }>(res);
  return data.order;
}

export async function apiGetOrder(id: string): Promise<Order | null> {
  const res = await fetch(`/api/orders?id=${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  const data = await parse<{ order: Order }>(res);
  return data.order;
}

export async function apiListOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  const data = await parse<{ orders: Order[] }>(res);
  return data.orders;
}

export async function apiSetStatus(id: string, status: OrderStatus): Promise<void> {
  const res = await fetch("/api/orders", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  await parse<{ ok: boolean }>(res);
}
