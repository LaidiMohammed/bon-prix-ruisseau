"use client";

import { useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  fallback?: string;
};

// Image qui ne casse jamais : lien mort/expiré (ex. Facebook) => logo.
// Utilisée pour TOUTES les images distantes (produits, fonds, reels).
export default function SafeImg({ src, alt, fallback = "/logo.jpg", ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed || !src ? fallback : src}
      alt={alt}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
