"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, MapPin, Shirt } from "lucide-react";

const TABS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/vetements", label: "Shop", icon: Shirt },
  { href: "/magasin", label: "Magasin", icon: MapPin },
  { href: "/a-propos", label: "Nous", icon: Heart },
];

export default function BottomDock() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 md:hidden">
      <div className="glass flex items-center justify-around rounded-[1.75rem] border border-white/15 px-2 py-2 shadow-2xl shadow-black/60">
        {TABS.map((t) => {
          const active = path === t.href;
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold transition ${
                active ? "bg-cream text-ink" : "text-cream/70"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
