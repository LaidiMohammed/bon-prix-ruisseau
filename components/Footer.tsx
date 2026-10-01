import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/store";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./SocialIcons";

export default function Footer({ settings }: { settings: SiteSettings }) {
  const s = settings.socials;
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-ink/85 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Bon Prix Ruisseau Sports"
              className="h-14 w-auto rounded-xl border border-white/15"
            />
          </div>
          <p className="mt-4 max-w-xs text-sm text-cream/60">
            Boutique sport & street au cœur du Ruisseau, Alger. Qualité haute,
            prix imbattables. <span className="font-arabic">مرحبا بيكم ولاد الحمرة ❤️🖤</span>
          </p>
          <div className="mt-5 flex gap-2.5">
            {[
              { href: s.tiktok, icon: TikTokIcon, label: "TikTok" },
              { href: s.instagram, icon: InstagramIcon, label: "Instagram" },
              { href: s.facebook, icon: FacebookIcon, label: "Facebook" },
            ].map((x) => (
              <a
                key={x.label}
                href={x.href}
                target="_blank"
                aria-label={x.label}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 transition hover:scale-110 hover:bg-signal"
              >
                <x.icon size={19} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="font-display text-lg tracking-widest uppercase">Navigation</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {[
              { href: "/", label: "Accueil" },
              { href: "/vetements", label: "Vêtements" },
              { href: "/a-propos", label: "À propos" },
              { href: "/magasin", label: "Magasin" },
              { href: "/suivi", label: "Suivi commande" },
              { href: "/commande", label: "Commander" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-cream/70 hover:text-cream">
                {l.label}
              </Link>
            ))}
          </div>
          <p className="mt-6 flex items-start gap-2 text-sm text-cream/60">
            <MapPin size={16} className="mt-0.5 shrink-0 text-signal" />
            {settings.shop.address}
          </p>
        </div>
        <div>
          <p className="font-display text-lg tracking-widest uppercase">Contact direct</p>
          <a
            href={`tel:${settings.socials.phone}`}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10"
          >
            <Phone size={17} className="text-signal" /> {settings.socials.phone}
          </a>
          <a
            href={settings.socials.whatsapp}
            target="_blank"
            className="mt-2 block rounded-2xl bg-[#25D366] px-4 py-3 text-center text-sm font-black text-ink"
          >
            WhatsApp — Commande rapide
          </a>
          <p className="font-arabic mt-3 text-sm text-cream/60">{settings.shop.hoursAr}</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Bon Prix Ruisseau Sports — Alger • Tous droits réservés
      </div>
      <div className="h-20 md:hidden" />
    </footer>
  );
}
