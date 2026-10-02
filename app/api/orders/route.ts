import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { deliveryFee, type DeliveryType } from "@/lib/delivery";
import type { CartItem, Order, OrderStatus } from "@/lib/orders";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// API vers le schéma pro (UUID, order_number BPR-, stock par variante).
// Env vide = 503, le site bascule en mode local (jamais bloqué).
// Écritures invité via clé anon : RLS "Passer commande" + RPCs (grants anon).
// ---------------------------------------------------------------------------

let sb: SupabaseClient | null = null;

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!sb) sb = createClient(url, key);
  return sb;
}

// Garde-fou anti-rafale par instance (les instances Vercel scalent déjà).
const hits = new Map<string, number[]>();

function limited(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
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
// Lignes DB
// ---------------------------------------------------------------------------

type DbProduct = {
  id: string;
  name_fr: string;
  name_ar: string;
  base_price: number;
};

type DbVariant = {
  id: string;
  size: string;
  color_name_fr: string;
  price_override: number | null;
  stock: number;
};

type DbOrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  guest_name: string;
  guest_phone: string;
  wilaya_code: number;
  wilaya_name: string;
  commune: string;
  address: string | null;
  delivery: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: string;
};

type DbItemRow = {
  product_id: string | null;
  variant_id: string | null;
  product_name_fr: string;
  product_name_ar: string;
  variant_label: string;
  image_url: string;
  flocage_label: string | null;
  flocage_price: number;
  unit_price: number;
  qty: number;
};

const toOrder = (
  r: DbOrderRow,
  items: DbItemRow[],
  delivery: DeliveryType
): Order => ({
  id: r.order_number, // n° public BPR- : affiché, QR, suivi
  date: r.created_at,
  name: r.guest_name,
  phone: r.guest_phone,
  wilaya: r.wilaya_name,
  wilayaCode: r.wilaya_code,
  commune: r.commune,
  address: r.address ?? "",
  delivery,
  notes: r.notes ?? "",
  items: items.map((i) => ({
    productId: i.product_id ?? i.variant_id ?? i.product_name_fr,
    name: i.product_name_fr,
    size: i.variant_label,
    price: Math.max(0, i.unit_price - (i.flocage_price ?? 0)),
    image: i.image_url || "/logo.jpg",
    qty: i.qty,
    flocageLabel: i.flocage_label ?? undefined,
    flocagePrice: i.flocage_price || undefined,
  })),
  subtotal: r.subtotal,
  fee: r.delivery_fee,
  total: r.total,
  status: r.status as OrderStatus,
});

// ---------------------------------------------------------------------------
// GET /api/orders?number=BPR-2026-001234&phone=0550... -> suivi invité
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const client = db();
  if (!client) return Response.json({ error: "backend_off" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const number = (searchParams.get("number") ?? "").trim().toUpperCase();
  const phone = (searchParams.get("phone") ?? "").replace(/[\s-]/g, "");

  if (!/^BPR-\d{4}-\d{4,}$/.test(number))
    return Response.json({ error: "bad_number" }, { status: 400 });
  if (!/^0(5|6|7)\d{8}$/.test(phone))
    return Response.json({ error: "bad_phone" }, { status: 400 });
  if (limited(`${ipOf(req)}:track`, 60))
    return Response.json({ error: "too_many" }, { status: 429 });

  // RPC vérifie le téléphone : mauvais n° => null (rien ne fuit).
  const { data, error } = await client.rpc("track_order", {
    p_number: number,
    p_phone: phone,
  });
  if (error || !data)
    return Response.json({ error: "not_found" }, { status: 404 });
  const payload = data as unknown as { order: DbOrderRow; items: DbItemRow[] };
  const delivery: DeliveryType =
    payload.order.delivery === "stopdesk" ? "bureau" : "home";
  return Response.json({ order: toOrder(payload.order, payload.items ?? [], delivery) });
}

// ---------------------------------------------------------------------------
// POST /api/orders -> commande invitée (prix + stock vérifiés serveur)
// ---------------------------------------------------------------------------

const PHONE_RE = /^0(5|6|7)\d{8}$/;
const s = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

type ReqItem = {
  productId: string;
  size: string;
  qty: number;
  flocageLabel?: string;
  flocagePrice?: number;
};

function validReqItem(i: unknown): i is ReqItem {
  if (typeof i !== "object" || i === null) return false;
  const o = i as Record<string, unknown>;
  return (
    typeof o.productId === "string" &&
    o.productId.length >= 1 &&
    o.productId.length <= 120 &&
    typeof o.size === "string" &&
    o.size.length >= 1 &&
    o.size.length <= 10 &&
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
  const delivery: DeliveryType | null =
    body.delivery === "bureau" ? "bureau" : body.delivery === "home" ? "home" : null;
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
  if (!items.every(validReqItem))
    return Response.json({ error: "bad_items" }, { status: 400 });

  // 1. Catalogue réel : produit par slug, variante par taille.
  const slugs = [...new Set(items.map((i) => (i as ReqItem).productId))];
  const { data: prodRows, error: prodErr } = await client
    .from("products")
    .select("id,slug,name_fr,name_ar,base_price")
    .in("slug", slugs)
    .eq("is_active", true);
  if (prodErr || !prodRows)
    return Response.json({ error: "db_error" }, { status: 500 });
  const bySlug = new Map(
    (prodRows as unknown as (DbProduct & { slug: string })[]).map((p) => [p.slug, p])
  );

  const missing = slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length > 0)
    return Response.json({ error: "bad_items" }, { status: 400 });

  const productIds = [...bySlug.values()].map((p) => p.id);
  const { data: varRows, error: varErr } = await client
    .from("product_variants")
    .select("id,product_id,size,color_name_fr,price_override,stock")
    .in("product_id", productIds)
    .eq("is_active", true);
  if (varErr || !varRows)
    return Response.json({ error: "db_error" }, { status: 500 });
  type DbVariantFull = DbVariant & { product_id: string };
  const variants = varRows as unknown as DbVariantFull[];

  // Vignettes pour le snapshot visuel.
  const { data: imgRows } = await client
    .from("product_images")
    .select("product_id,url")
    .in("product_id", productIds)
    .eq("is_primary", true);
  const primaryImg = new Map(
    ((imgRows as unknown as { product_id: string; url: string }[]) ?? []).map((r) => [
      r.product_id,
      r.url,
    ])
  );

  // 2. Résolution + vérif stock (409 si rupture).
  type Line = {
    req: ReqItem;
    product: DbProduct & { slug: string };
    variant: DbVariantFull;
    unit: number;
  };
  const lines: Line[] = [];
  const ruptures: string[] = [];
  for (const reqItem of items as ReqItem[]) {
    const product = bySlug.get(reqItem.productId) as DbProduct & { slug: string };
    const cands = variants.filter(
      (v) => v.product_id === product.id && v.size.toUpperCase() === reqItem.size.toUpperCase()
    );
    if (cands.length === 0)
      return Response.json({ error: "bad_items" }, { status: 400 });
    const variant = [...cands].sort((a, b) => b.stock - a.stock)[0];
    if (variant.stock < reqItem.qty) ruptures.push(product.name_fr);
    const flock = Math.min(Math.max(Number(reqItem.flocagePrice) || 0, 0), 10000);
    lines.push({
      req: reqItem,
      product,
      variant,
      unit: (variant.price_override ?? product.base_price) + flock,
    });
  }
  if (ruptures.length > 0)
    return Response.json(
      { error: "rupture", details: [...new Set(ruptures)] },
      { status: 409 }
    );

  // 3. Totaux serveur (le client ne peut pas truquer les prix).
  const subtotal = lines.reduce((n, l) => n + l.req.qty * l.unit, 0);
  const fee = deliveryFee(wilayaCode, delivery);

  // 4. Insert commande (n° BPR- auto via trigger).
  const { data: orderRow, error: orderErr } = await client
    .from("orders")
    .insert({
      customer_id: null,
      guest_name: name,
      guest_phone: phone,
      wilaya_code: wilayaCode,
      wilaya_name: wilaya,
      commune,
      address,
      delivery: delivery === "bureau" ? "stopdesk" : "home",
      payment_method: "cod",
      payment_status: "unpaid",
      status: "pending",
      subtotal,
      delivery_fee: fee,
      discount: 0,
      total: subtotal + fee,
      notes,
    })
    .select("*")
    .single();
  if (orderErr || !orderRow)
    return Response.json({ error: "db_error" }, { status: 500 });
  const order = orderRow as unknown as DbOrderRow;

  // 5. Lignes avec snapshot.
  const { error: itemsErr } = await client.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      variant_id: l.variant.id,
      product_name_fr: l.product.name_fr,
      product_name_ar: l.product.name_ar,
      variant_label:
        l.variant.size +
        (l.variant.color_name_fr ? ` / ${l.variant.color_name_fr}` : ""),
      image_url: (primaryImg.get(l.product.id) || "/logo.jpg").slice(0, 500),
      flocage_label: (l.req.flocageLabel || "").slice(0, 40) || null,
      flocage_price: Math.min(Math.max(Number(l.req.flocagePrice) || 0, 0), 10000),
      unit_price: l.unit,
      qty: l.req.qty,
    }))
  );
  if (itemsErr) {
    // Commande sans lignes : on la retire pour ne pas polluer l'admin.
    // (delete réservé admin via RLS : best-effort, sinon elle reste vide.)
    await client.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "db_error" }, { status: 500 });
  }

  // 6. Décrément atomique (best-effort, ne bloque jamais la commande).
  const qtyByVariant = new Map<string, number>();
  for (const l of lines)
    qtyByVariant.set(l.variant.id, (qtyByVariant.get(l.variant.id) ?? 0) + l.req.qty);
  await Promise.allSettled(
    [...qtyByVariant].map(([p_variant_id, p_qty]) =>
      client.rpc("decrease_stock", { p_variant_id, p_qty })
    )
  );

  const cartItems: CartItem[] = lines.map((l) => ({
    productId: l.req.productId,
    name: l.product.name_fr,
    size: l.req.size,
    price: l.unit - Math.min(Math.max(Number(l.req.flocagePrice) || 0, 0), 10000),
    image: primaryImg.get(l.product.id) || "/logo.jpg",
    qty: l.req.qty,
    flocageLabel: l.req.flocageLabel || undefined,
    flocagePrice:
      Math.min(Math.max(Number(l.req.flocagePrice) || 0, 0), 10000) || undefined,
  }));

  return Response.json(
    {
      order: {
        id: order.order_number,
        date: order.created_at,
        name,
        phone,
        wilaya,
        wilayaCode,
        commune,
        address,
        delivery,
        notes,
        items: cartItems,
        subtotal,
        fee,
        total: subtotal + fee,
        status: "pending",
      } satisfies Order,
    },
    { status: 201 }
  );
}
