"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Order, OrderStatus } from "./orders";

// Backend = serveur partagé (Supabase). Actif seulement si les clés existent.
// Sinon le site reste 100% en mode local (localStorage, par appareil).
export const backendEnabled =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Client navigateur (clé anon publique — RLS appliquée côté Supabase).
// Null quand le backend est coupé : tous les appels doivent tester avant.
let sb: SupabaseClient | null | undefined;
export function supabase(): SupabaseClient | null {
  if (!backendEnabled) return null;
  if (sb === undefined) {
    sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }
  return sb;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type ErrorBody = { error?: string; details?: string[] };

async function parse<T>(res: Response): Promise<T> {
  let body: T & ErrorBody;
  try {
    body = (await res.json()) as T & ErrorBody;
  } catch {
    throw new ApiError("bad_json", "Réponse serveur illisible", res.status);
  }
  if (!res.ok) {
    const code = body.error || `http_${res.status}`;
    const message =
      code === "rupture" && body.details?.length
        ? `Rupture / خلص : ${body.details.join(", ")}`
        : code === "too_many"
          ? "Trop de tentatives — réessaie dans une minute"
          : code === "too_big"
            ? "Commande trop grosse — réessaie"
            : `Erreur serveur (${code})`;
    throw new ApiError(code, message, res.status);
  }
  return body;
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

// Commande invitée (COD) : totaux recalculés côté serveur, stock vérifié.
export async function apiPlaceOrder(draft: PlaceDraft): Promise<Order> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  const data = await parse<{ order: Order }>(res);
  return data.order;
}

// Suivi invité : n° BPR- + téléphone (rien ne fuit si le n° est faux).
export async function apiTrackOrder(
  number: string,
  phone: string
): Promise<Order | null> {
  const res = await fetch(
    `/api/orders?number=${encodeURIComponent(number)}&phone=${encodeURIComponent(phone)}`
  );
  if (res.status === 404) return null;
  const data = await parse<{ order: Order }>(res);
  return data.order;
}

export type { OrderStatus };
