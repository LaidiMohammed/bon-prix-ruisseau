"use client";

import { supabase } from "./backend";
import type { Product } from "./mock-data";

// Écriture catalogue directe Supabase (session admin, RLS is_admin).
// Le site lit ce catalogue : tout ce qui est sauvé ici apparaît en ligne.

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return base || "produit";
}

const rand4 = () =>
  Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 4).padEnd(4, "x");

async function dataUrlToBlob(dataUrl: string): Promise<{ blob: Blob; ext: string }> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const mime = blob.type || "image/jpeg";
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return { blob, ext };
}

type DbCategory = { id: string; name_fr: string };

async function resolveCategoryId(
  client: NonNullable<ReturnType<typeof supabase>>,
  label: string
): Promise<string | null> {
  const { data, error } = await client.from("categories").select("id,name_fr");
  if (error || !data) throw new Error("Lecture catégories impossible");
  const cats = data as unknown as DbCategory[];
  const found = cats.find(
    (c) => c.name_fr.toLowerCase().trim() === label.toLowerCase().trim()
  );
  return found ? found.id : (cats[0]?.id ?? null);
}

async function uniqueSlug(
  client: NonNullable<ReturnType<typeof supabase>>,
  base: string,
  ignoreId?: string
): Promise<string> {
  for (let n = 0; n < 20; n++) {
    const slug = n === 0 ? base : `${base}-${n + 1}`;
    const { data } = await client.from("products").select("id").eq("slug", slug).limit(1);
    const rows = (data ?? []) as unknown as { id: string }[];
    if (rows.length === 0 || (ignoreId && rows[0].id === ignoreId)) return slug;
  }
  return `${base}-${rand4()}`;
}

async function uploadPhoto(
  client: NonNullable<ReturnType<typeof supabase>>,
  slug: string,
  image: string
): Promise<string> {
  if (!image) return "";
  if (!image.startsWith("data:")) return image.slice(0, 500);
  // Photo appareil : envoi vers le bucket (SQL section 26b requis).
  const { blob, ext } = await dataUrlToBlob(image);
  const path = `${slug}/${Date.now()}.${ext}`;
  const { error } = await client.storage
    .from("product-images")
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("bucket") && msg.includes("not found"))
      throw new Error(
        "Stockage photos absent — lance le SQL « Stockage photos » (section 26b) dans Supabase, puis réessaie."
      );
    if (msg.includes("row-level") || msg.includes("policy") || msg.includes("unauthorized"))
      throw new Error("Non autorisé — reconnecte-toi en admin puis réessaie.");
    throw new Error(`Envoi photo impossible (${error.message || "réseau ?"}) — réessaie.`);
  }
  const { data } = client.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

function splitStock(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(Math.max(0, total) / n);
  const rest = Math.max(0, total) - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rest ? 1 : 0));
}

async function writeVariants(
  client: NonNullable<ReturnType<typeof supabase>>,
  productId: string,
  slug: string,
  sizes: string[],
  stock: number
): Promise<void> {
  // Remplace les déclinaisons (les vieilles commandes gardent leur snapshot).
  const { error: delErr } = await client
    .from("product_variants")
    .delete()
    .eq("product_id", productId);
  if (delErr) throw new Error("Remplacement du stock impossible");
  // Normalise : MAJUSCULES + dédoublonne ("XL, xl" => une seule variante).
  const cleanSizes = [...new Set(sizes.map((s) => s.toUpperCase().trim()).filter(Boolean))];
  if (cleanSizes.length === 0) return;
  const prefix = slug.split("-").slice(0, 3).join("-").toUpperCase() || "BPR";
  const per = splitStock(stock, cleanSizes.length);
  const { error: insErr } = await client.from("product_variants").insert(
    cleanSizes.map((rawSize, i) => ({
      product_id: productId,
      size: rawSize.toUpperCase(), // normalisé : jamais de "xxl" minuscule
      color_name_fr: "",
      color_name_ar: "",
      color_hex: "",
      sku: `${prefix}-${rawSize.toUpperCase()}-${rand4()}`.slice(0, 60),
      price_override: null,
      stock: per[i],
      is_active: true,
    }))
  );
  if (insErr) throw new Error("Création des tailles impossible");
}

async function writePrimaryImage(
  client: NonNullable<ReturnType<typeof supabase>>,
  productId: string,
  slug: string,
  name: string,
  image: string
): Promise<void> {
  await client
    .from("product_images")
    .delete()
    .eq("product_id", productId)
    .is("variant_id", null);
  const url = await uploadPhoto(client, slug, image);
  if (!url) return;
  const { error } = await client.from("product_images").insert({
    product_id: productId,
    variant_id: null,
    url,
    alt_fr: name.slice(0, 120),
    position: 0,
    is_primary: true,
  });
  if (error) throw new Error("Enregistrement photo impossible");
}

export async function remoteCreateProduct(p: Product): Promise<string> {
  const client = supabase();
  if (!client) throw new Error("Backend coupé");
  const slug = await uniqueSlug(client, slugify(p.name));
  const category_id = await resolveCategoryId(client, p.category);
  const { data, error } = await client
    .from("products")
    .insert({
      category_id,
      slug,
      name_fr: p.name,
      name_ar: p.nameAr || "",
      description_fr: p.description || "",
      description_ar: p.descriptionAr || "",
      base_price: p.price,
      old_price: p.oldPrice ?? null,
      tag: p.tag || null,
      flocage_names: p.players ?? [],
      is_featured: false,
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !data)
    throw new Error("Création produit refusée — reconnecte-toi en admin");
  const id = (data as unknown as { id: string }).id;
  await writeVariants(client, id, slug, p.sizes, p.stock ?? 0);
  await writePrimaryImage(client, id, slug, p.name, p.image);
  return slug;
}

export async function remoteUpdateProduct(slug: string, p: Product): Promise<void> {
  const client = supabase();
  if (!client) throw new Error("Backend coupé");
  const { data, error } = await client
    .from("products")
    .select("id")
    .eq("slug", slug)
    .limit(1);
  const row = ((data ?? []) as unknown as { id: string }[])[0];
  if (error || !row) throw new Error("Produit introuvable sur le serveur");
  const category_id = await resolveCategoryId(client, p.category);
  const { error: updErr } = await client
    .from("products")
    .update({
      category_id,
      name_fr: p.name,
      name_ar: p.nameAr || "",
      description_fr: p.description || "",
      description_ar: p.descriptionAr || "",
      base_price: p.price,
      old_price: p.oldPrice ?? null,
      tag: p.tag || null,
      flocage_names: p.players ?? [],
    })
    .eq("id", row.id);
  if (updErr) throw new Error("Modification refusée — reconnecte-toi en admin");
  await writeVariants(client, row.id, slug, p.sizes, p.stock ?? 0);
  // Photo : on ne touche à rien si l'URL est inchangée (évite un ré-upload).
  const { data: imgs } = await client
    .from("product_images")
    .select("url")
    .eq("product_id", row.id)
    .is("variant_id", null)
    .order("position", { ascending: true })
    .limit(1);
  const current = ((imgs ?? []) as unknown as { url: string }[])[0]?.url ?? "";
  if ((p.image || "") !== current) {
    await writePrimaryImage(client, row.id, slug, p.name, p.image);
  }
}

export async function remoteDeleteProduct(slug: string): Promise<void> {
  const client = supabase();
  if (!client) throw new Error("Backend coupé");
  // Supprime produit + variantes + images (les vieilles commandes gardent tout).
  const { error } = await client.from("products").delete().eq("slug", slug);
  if (error) throw new Error("Suppression refusée — reconnecte-toi en admin");
}
