"use client";

import { useEffect, useState } from "react";
import { Share, Smartphone } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
};

// Bouton "Installer l'app" : visible seulement quand le téléphone le permet.
// Android/Chrome : popup d'installation native.
// iPhone : marche à suivre (Partager → Écran d'accueil).
export default function InstallAppButton() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  // Calculé une fois au montage (pas de setState dans l'effect).
  const [iosHint] = useState(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    return isIOS && !standalone;
  });

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (deferred) {
    return (
      <button
        onClick={() => {
          deferred.prompt();
          setDeferred(null);
        }}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-cream px-4 py-3 text-sm font-black text-ink"
      >
        <Smartphone size={17} /> Installer l&apos;app BPR 📲
      </button>
    );
  }

  if (iosHint) {
    return (
      <p className="mt-2 flex items-start gap-1.5 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-xs text-cream/70">
        <Share size={15} className="mt-0.5 shrink-0 text-gold" />
        <span>
          Sur iPhone : touche <b>Partager</b> puis <b>« Sur l’écran d’accueil »</b> pour installer BPR.
        </span>
      </p>
    );
  }

  return null;
}
