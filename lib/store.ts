"use client";

import { useCallback, useState } from "react";
import {
  BACKGROUNDS,
  HERO,
  PRODUCTS,
  SHOP,
  SOCIALS,
  type Product,
} from "./mock-data";

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

export function useSiteData() {
  const [settings, setSettings] = useState<SiteSettings>(() =>
    read(SETTINGS_KEY, DEFAULTS)
  );
  const [products, setProducts] = useState<Product[]>(readProducts);
  const ready = true;

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
