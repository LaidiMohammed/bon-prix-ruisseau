import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { deliveryFee, type DeliveryType } from "@/lib/delivery";
import {
  genOrderId,
  unitPrice,
  type CartItem,
  type Order,
  type OrderStatus,
} from "@/lib/orders";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Shared server for all users (Supabase). Empty env = 503, site falls back
// to localStorage mode so nothing ever breaks.
// ---------------------------------------------------------------------------

let sb: SupabaseClient | null = null;

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!sb) sb = createClient(url, key);
  return sb;
}

// Tiny per-instance rate limiter (best-effort): slows bursts and bot floods.
// Vercel runs many instances, so this is a guardrail, not a hard wall.
const hits = new Map<string, number[]>();

function limited(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear(); // avoid unbounded growth
  return arr.length > max;
}

function ipOf(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// Row mapping (DB snake_case <-> client camelCase)
// ---------------------------------------------------------------------------

type OrderRow = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  wilaya_code: number;
  wilaya: string;
  commune: string;
  address: string | null;
  delivery: string;
  notes: string | null;
  items: CartItem[];
  subtotal: number;
  fee: number;
  total: number;
  status: string;
};

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  date: r.created_at,
  name: r.name,
  phone: r.phone,
  wilaya: r.wilaya,
  wilayaCode: r.wilaya_code,
  commune: r.commune,
  address: r.address ?? "",
  delivery: (r.delivery === "bureau" ? "bureau" : "home") as DeliveryType,
  notes: r.notes ?? "",
  items: Array.isArray(r.items) ? r.items : [],
  subtotal: r.subtotal,
  fee: r.fee,
  total: r.total,
  status: r.status as OrderStatus,
});

// ---------------------------------------------------------------------------
// GET /api/orders?id=XXXXXXXX -> one order (tracking)
// GET /api/orders            -> recent orders (admin)
// ---------------------------------------------------------------------------

const ID_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

export async function GET(req: Request) {
  const client = db();
  if (!client) return Response.json({ error: "backend_off" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") ?? "").trim().toUpperCase();

  if (id) {
    if (!ID_RE.test(id))
      return Response.json({ error: "bad_id" }, { status: 400 });
    if (limited(`${ipOf(req)}:get`, 300))
      return Response.json({ error: "too_many" }, { status: 429 });
    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data)
      return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ order: toOrder(data as OrderRow) });
  }

  if (limited(`${ipOf(req)}:list`, 300))
    return Response.json({ error: "too_many" }, { status: 429 });
  const { data, error } = await client
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return Response.json({ error: "db_error" }, { status: 500 });
  return Response.json({ orders: (data as OrderRow[]).map(toOrder) });
}

// ---------------------------------------------------------------------------
// POST /api/orders -> place an order (server validates + totals recomputed)
// ---------------------------------------------------------------------------

const PHONE_RE = /^0(5|6|7)\d{8}$/;
const s = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

function validItem(i: unknown): i is CartItem {
  if (typeof i !== "object" || i === null) return false;
  const o = i as Record<string, unknown>;
  return (
    typeof o.productId === "string" &&
    o.productId.length >= 1 &&
    o.productId.length <= 80 &&
    typeof o.name === "string" &&
    o.name.length >= 1 &&
    o.name.length <= 120 &&
    typeof o.size === "string" &&
    o.size.length >= 1 &&
    o.size.length <= 10 &&
    Number.isFinite(o.price) &&
    (o.price as number) >= 0 &&
    (o.price as number) <= 100000 &&
    Number.isInteger(o.qty) &&
    (o.qty as number) >= 1 &&
    (o.qty as number) <= 99 &&
    (o.flocageLabel === undefined ||
      (typeof o.flocageLabel === "string" && o.flocageLabel.length <= 40)) &&
    (o.flocagePrice === undefined ||
      (Number.isFinite(o.flocagePrice) &&
        (o.flocagePrice as number) >= 0 &&
        (o.flocagePrice as number) <= 10000))
  );
}

export async function POST(req: Request) {
  const client = db();
  if (!client) return Response.json({ error: "backend_off" }, { status: 503 });
  if (limited(`${ipOf(req)}:post`, 20))
    return Response.json({ error: "too_many" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }

  const name = s(body.name, 80);
  const phone = s(body.phone, 20).replace(/[\s-]/g, "");
  const wilaya = s(body.wilaya, 80);
  const wilayaCode = Number(body.wilayaCode);
  const commune = s(body.commune, 80);
  const address = s(body.address, 200);
  const notes = s(body.notes, 500);
  const delivery = body.delivery === "bureau" ? "bureau" : body.delivery === "home" ? "home" : null;
  const items = body.items;

  if (name.length < 3) return Response.json({ error: "bad_name" }, { status: 400 });
  if (!PHONE_RE.test(phone))
    return Response.json({ error: "bad_phone" }, { status: 400 });
  if (!Number.isInteger(wilayaCode) || wilayaCode < 1 || wilayaCode > 58)
    return Response.json({ error: "bad_wilaya" }, { status: 400 });
  if (!wilaya || !commune)
    return Response.json({ error: "bad_commune" }, { status: 400 });
  if (!delivery) return Response.json({ error: "bad_delivery" }, { status: 400 });
  if (delivery === "home" && address.length < 4)
    return Response.json({ error: "bad_address" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0 || items.length > 20)
    return Response.json({ error: "bad_items" }, { status: 400 });
  if (!items.every(validItem))
    return Response.json({ error: "bad_items" }, { status: 400 });

  // Totals are recomputed on the server — a modified client can't fake prices.
  const subtotal = items.reduce((n, i) => n + i.qty * unitPrice(i), 0);
  const fee = deliveryFee(wilayaCode, delivery as DeliveryType);

  const rawDate = s(body.date, 30);
  const stamp = rawDate && !Number.isNaN(Date.parse(rawDate)) ? rawDate : new Date().toISOString();
  const wanted = s(body.id, 8).toUpperCase();

  for (let attempt = 0; attempt < 3; attempt++) {
    const id = attempt === 0 && ID_RE.test(wanted) ? wanted : genOrderId();
    const { data, error } = await client
      .from("orders")
      .insert({
        id,
        created_at: stamp,
        name,
        phone,
        wilaya_code: wilayaCode,
        wilaya,
        commune,
        address,
        delivery,
        notes,
        items,
        subtotal,
        fee,
        total: subtotal + fee,
        status: "pending",
      })
      .select("*")
      .single();
    if (!error && data) {
      // Best-effort atomic stock decrement (never blocks the order itself).
      const qtyByProduct = new Map<string, number>();
      for (const i of items)
        qtyByProduct.set(i.productId, (qtyByProduct.get(i.productId) ?? 0) + i.qty);
      await Promise.allSettled(
        [...qtyByProduct].map(([p_id, p_qty]) =>
          client.rpc("decrement_stock", { p_id, p_qty })
        )
      );
      return Response.json({ order: toOrder(data as OrderRow) }, { status: 201 });
    }
    if (error?.code !== "23505") break; // real DB error (or empty), don't retry
  }
  return Response.json({ error: "db_error" }, { status: 500 });
}

// ---------------------------------------------------------------------------
// PATCH /api/orders { id, status } -> admin status change (via secure RPC)
// ---------------------------------------------------------------------------

const STATUSES = ["pending", "validated", "cancelled", "delivered"];

export async function PATCH(req: Request) {
  const client = db();
  if (!client) return Response.json({ error: "backend_off" }, { status: 503 });
  if (limited(`${ipOf(req)}:patch`, 120))
    return Response.json({ error: "too_many" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const p_id = s(body.id, 8).toUpperCase();
  const p_status = s(body.status, 20);
  if (!ID_RE.test(p_id) || !STATUSES.includes(p_status))
    return Response.json({ error: "bad_input" }, { status: 400 });

  const { error } = await client.rpc("set_order_status", { p_id, p_status });
  if (error) return Response.json({ error: "db_error" }, { status: 500 });
  return Response.json({ ok: true });
}
