"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/vetements", label: "Vêtements" },
  { href: "/a-propos", label: "À propos" },
  { href: "/magasin", label: "Magasin" },
];

export default function TopNav({ promo }: { promo: string }) {
  const path = usePathname();
  const router = useRouter();
  const taps = useRef(0);

  // Hidden admin: tap logo 5x fast
  const tapLogo = () => {
    taps.current += 1;
    if (taps.current >= 5) {
      taps.current = 0;
      router.push("/bpr-studio-2026");
    }
    setTimeout(() => (taps.current = 0), 1500);
  };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="flex items-center justify-center gap-2 bg-signal px-4 py-1.5 text-[11px] font-bold tracking-wide text-white uppercase">
        <Flame size={13} />
        <span className="truncate">{promo}</span>
      </div>
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-all sm:px-6 ${
          scrolled ? "py-2" : "py-3"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 border-b border-white/10 ${
            scrolled ? "glass" : "bg-gradient-to-b from-ink/70 to-transparent"
          }`}
        />
        <button
          onClick={tapLogo}
          className="relative flex items-center gap-2.5 text-left"
          aria-label="Bon Prix Ruisseau"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="Bon Prix Ruisseau Sports"
            className="h-10 w-auto rounded-lg border border-white/15 shadow-lg shadow-black/50 sm:h-11"
          />
        </button>
        <a
          href="https://wa.me/213550000000"
          target="_blank"
          className="relative rounded-full bg-signal px-4 py-2 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-signal/30 transition hover:scale-105 sm:px-5 sm:text-sm md:hidden"
        >
          Commander
        </a>
        <div className="relative hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                path === l.href
                  ? "bg-cream text-ink"
                  : "text-cream/80 hover:bg-white/10 hover:text-cream"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://wa.me/213550000000"
            target="_blank"
            className="ml-2 rounded-full bg-signal px-5 py-2 text-sm font-bold text-white shadow-lg shadow-signal/30 transition hover:scale-105"
          >
            Commander
          </a>
        </div>
      </nav>
    </header>
  );
}
