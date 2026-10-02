"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BACKGROUNDS,
  HERO,
  PRODUCTS,
  SHOP,
  SOCIALS,
  type Product,
} from "./mock-data";
import { backendEnabled, supabase } from "./backend";

export type SiteSettings = {
  heroVideo: string;
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  backgrounds: typeof BACKGROUNDS;
  socials: typeof SOCIALS;
  shop: typeof SHOP;
  promo: string;
};

const DEFAULTS: SiteSettings = {
  heroVideo: HERO.videoUrl,
  heroTitle: "HABILLES-TOI COMME UN CHAMPION",
  heroTitleAr: "البس كي الأبطال",
  heroSubtitle:
    "Maillots Premier League 26/27 • Liverpool, United, Arsenal, City — qualité haute, prix ruisseau.",
  backgrounds: BACKGROUNDS,
  socials: SOCIALS,
  shop: SHOP,
  promo: "PROMO HIVER −20% sur les survêtements • Livraison 58 wilayas",
};

const SETTINGS_KEY = "bpr-settings-v2";
const PRODUCTS_KEY = "bpr-products-v2";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function readProducts(): Product[] {
  if (typeof window === "undefined") return PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* keep defaults */
  }
  return PRODUCTS;
}

// ---- Mapping Supabase (schéma pro) -> Product du site ---------------------
type DbVariant = {
  size: string;
  price_override: number | null;
  stock: number;
  is_active: boolean;
};

type DbImage = {
  url: string;
  position: number;
  is_primary: boolean;
};

type DbProduct = {
  slug: string;
  category_id: string | null;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  base_price: number;
  old_price: number | null;
  rating: number;
  tag: string | null;
  flocage_names: string[];
  is_featured: boolean;
  product_variants: DbVariant[];
  product_images: DbImage[];
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "6A", "8A", "10A", "12A", "14A"];

function toProduct(p: DbProduct, catName: Map<string, string>): Product {
  const variants = (p.product_variants ?? []).filter((v) => v.is_active);
  const sizes = [...new Set(variants.filter((v) => v.stock > 0).map((v) => v.size))].sort(
    (a, b) => {
      const ia = SIZE_ORDER.indexOf(a);
      const ib = SIZE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
  );
  const images = [...(p.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position
  );
  return {
    id: p.slug, // slug stable : le panier existant continue de marcher
    name: p.name_fr,
    nameAr: p.name_ar ?? "",
    category: (p.category_id && catName.get(p.category_id)) || "Maillots",
    price: p.base_price,
    oldPrice: p.old_price ?? undefined,
    sizes,
    image: images[0]?.url || "/logo.jpg",
    tag: p.tag ?? undefined,
    rating: Number(p.rating) || 5,
    description: p.description_fr ?? "",
    descriptionAr: p.description_ar ?? "",
    stock: variants.reduce((n, v) => n + Math.max(0, v.stock), 0),
    players: p.flocage_names ?? [],
  };
}

export function useSiteData() {
  const [settings, setSettings] = useState<SiteSettings>(() =>
    read(SETTINGS_KEY, DEFAULTS)
  );
  const [products, setProducts] = useState<Product[]>(readProducts);
  const ready = true;

  // Catalogue partagé : quand le backend est branché, les prix/stocks
  // viennent de Supabase (même stock pour tous les clients).
  // Sinon : catalogue local. Échec réseau => local, jamais bloqué.
  useEffect(() => {
    if (!backendEnabled) return;
    const client = supabase();
    if (!client) return;
    let alive = true;
    (async () => {
      try {
        const [cats, prods] = await Promise.all([
          client.from("categories").select("id,name_fr").eq("is_active", true),
          client
            .from("products")
            .select("*, product_variants(*), product_images(*)")
            .eq("is_active", true),
        ]);
        if (!alive || cats.error || prods.error) return;
        const catName = new Map(
          (cats.data as unknown as { id: string; name_fr: string }[]).map(
            (c) => [c.id, c.name_fr] as [string, string]
          )
        );
        const mapped = (prods.data as unknown as DbProduct[]).map((p) =>
          toProduct(p, catName)
        );
        if (mapped.length > 0) setProducts(mapped);
      } catch {
        /* offline / RLS : on garde le catalogue local */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const saveSettings = useCallback((next: SiteSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const saveProducts = useCallback((next: Product[]) => {
    setProducts(next);
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(PRODUCTS_KEY);
    } catch {
      /* ignore */
    }
    setSettings(DEFAULTS);
    setProducts(PRODUCTS);
  }, []);

  return { settings, products, saveSettings, saveProducts, resetAll, ready };
}
