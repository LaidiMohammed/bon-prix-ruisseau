"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BadgeCheck, MapPin, Play, Star, Truck } from "lucide-react";
import ArchCard from "@/components/ArchCard";
import HeroVideo from "@/components/HeroVideo";
import Marquee from "@/components/Marquee";
import QuickView from "@/components/QuickView";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { TIKTOK_REELS, type Product } from "@/lib/mock-data";
import { useSiteData } from "@/lib/store";

export default function HomePage() {
  const { settings, products } = useSiteData();
  const [quick, setQuick] = useState<Product | null>(null);
  const best = products.slice(0, 4);

  return (
    <div>
      {/* HERO — video background */}
      <section className="grain relative flex min-h-[100svh] items-end overflow-hidden">
        <HeroVideo videoUrl={settings.heroVideo} />
        <div className="relative mx-auto w-full max-w-6xl px-5 pt-36 pb-16 sm:px-8">
          <Reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Bon Prix Ruisseau Sports"
              className="h-20 w-auto rounded-2xl border border-white/20 shadow-2xl shadow-black/60 sm:h-24"
            />
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-black tracking-[0.25em] uppercase backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-signal" />
              Ruisseau • Alger • depuis le quartier
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-5 max-w-3xl font-display text-[2.75rem] leading-[0.95] tracking-wide uppercase sm:text-8xl">
              {settings.heroTitle.split(" ").slice(0, 2).join(" ")}
              <br />
              <span className="text-stroke">{settings.heroTitle.split(" ").slice(2).join(" ")}</span>
            </h1>
            <p className="font-arabic mt-3 text-3xl text-gold">{settings.heroTitleAr}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-5 max-w-xl text-lg text-cream/80">{settings.heroSubtitle}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-8 flex flex-wrap items-center gap-3 pb-10">
              <Link
                href="/vetements"
                className="group flex items-center gap-2 rounded-full bg-cream px-8 py-4 font-black tracking-widest text-ink uppercase transition hover:bg-signal hover:text-white"
              >
                Voir la collection
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <a
                href={settings.socials.tiktok}
                target="_blank"
                className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-4 font-black tracking-widest uppercase backdrop-blur transition hover:bg-white/20"
              >
                <Play size={17} /> TikTok live
              </a>
            </div>
          </Reveal>
          {/* trust pills */}
          <div className="grid grid-cols-3 gap-2.5 pb-24 md:pb-10">
            {[
              { icon: BadgeCheck, fr: "Qualité premium", ar: "جودة عالية" },
              { icon: Truck, fr: "Livraison 58 wilayas", ar: "توصيل سريع" },
              { icon: Star, fr: "4.9 — clients", ar: "تقييم ممتاز" },
            ].map((x) => (
              <div
                key={x.fr}
                className="glass-light flex items-center gap-3 rounded-3xl border border-white/12 px-4 py-3"
              >
                <x.icon size={22} className="shrink-0 text-gold" />
                <div className="leading-tight">
                  <p className="text-xs font-black sm:text-sm">{x.fr}</p>
                  <p className="font-arabic text-[11px] text-cream/60">{x.ar}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Marquee
        items={["Liverpool 26/27", "Man United 26/27", "Arsenal 26/27", "Man City 26/27", "Prix Ruisseau"]}
      />

      {/* BEST SELLERS — arch cards, not squares */}
      <section className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker="Les plus demandés"
            title="Best-sellers"
            arabic="الأكثر مبيعاً"
            center={false}
          />
          <Link
            href="/vetements"
            className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-bold hover:bg-white/10"
          >
            Tout voir →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {best.map((p, i) => (
            <ArchCard key={p.id} product={p} index={i} onQuickView={setQuick} />
          ))}
        </div>
      </section>

      {/* COLLECTION BANNER — image bg with zoom-out */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="relative overflow-hidden rounded-[2.5rem] border border-white/12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.backgrounds.shop}
              alt="Collection"
              className="h-[420px] w-full object-cover sm:h-[480px]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-14">
              <p className="text-xs font-black tracking-[0.35em] text-gold uppercase">
                Collection street 2026
              </p>
              <h3 className="mt-3 max-w-md font-display text-5xl leading-none uppercase sm:text-6xl">
                Le style du <span className="text-signal">quartier</span>
              </h3>
              <p className="font-arabic mt-2 text-xl text-cream/80">ستايل الحومة</p>
              <Link
                href="/vetements"
                className="mt-6 w-fit rounded-full bg-signal px-8 py-3.5 font-black tracking-widest uppercase shadow-xl shadow-signal/30 transition hover:scale-105"
              >
                Shopper maintenant
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TIKTOK STRIP — horizontal reels */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHeading kicker="@bon_prix_ruisseau_sports" title="Sur TikTok" arabic="شوفونا على تيك توك" />
        <div className="no-scrollbar mt-8 flex gap-4 overflow-x-auto pb-2">
          {TIKTOK_REELS.map((r) => (
            <a
              key={r.id}
              href={settings.socials.tiktok}
              target="_blank"
              className="group relative w-44 shrink-0 overflow-hidden rounded-[1.75rem] border border-white/12 sm:w-52"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image} alt={r.label} className="aspect-[9/14] w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/20" />
              <span className="absolute top-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-black backdrop-blur">
                ▶ {r.views}
              </span>
              <p className="absolute right-3 bottom-3 left-3 text-xs font-bold">{r.label}</p>
            </a>
          ))}
          <a
            href={settings.socials.tiktok}
            target="_blank"
            className="grid w-44 shrink-0 place-items-center rounded-[1.75rem] border border-dashed border-white/25 bg-white/5 p-6 text-center text-sm font-bold sm:w-52"
          >
            + Voir tout sur TikTok →
          </a>
        </div>
      </section>

      {/* SHOP CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-4 sm:px-8">
        <Reveal className="glass flex flex-col items-start gap-5 rounded-[2.5rem] border border-white/12 p-8 sm:flex-row sm:items-center sm:p-12">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-signal">
            <MapPin size={28} />
          </span>
          <div className="flex-1">
            <h3 className="font-display text-3xl uppercase sm:text-4xl">Passe au magasin</h3>
            <p className="mt-1 text-cream/70">{settings.shop.address}</p>
            <p className="font-arabic text-cream/60">{settings.shop.hoursAr}</p>
          </div>
          <Link
            href="/magasin"
            className="rounded-full bg-cream px-8 py-3.5 font-black tracking-widest text-ink uppercase transition hover:bg-signal hover:text-white"
          >
            Nous trouver
          </Link>
        </Reveal>
      </section>

      <QuickView product={quick} onClose={() => setQuick(null)} />
    </div>
  );
}
