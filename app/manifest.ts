import type { MetadataRoute } from "next";

// Manifeste PWA : rend le site installable sur téléphone
// (Ajouter à l'écran d'accueil + mode standalone plein écran).
// Icônes = logo du magasin. Start sur la boutique.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bon Prix Ruisseau Sports — Boutique Alger",
    short_name: "BPR Sports",
    description:
      "Maillots, survêtements, sneakers au Ruisseau, Alger. Commande directement sur le site.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0e11",
    theme_color: "#e10600",
    lang: "fr",
    dir: "ltr",
    categories: ["shopping", "sports"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
