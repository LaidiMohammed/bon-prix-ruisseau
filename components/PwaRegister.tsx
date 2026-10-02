"use client";

import { useEffect } from "react";

// Enregistre le Service Worker (1 fois). Sans SW, pas d'installation PWA.
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* navigateur sans SW : le site marche pareil, juste pas installable */
    });
  }, []);
  return null;
}
