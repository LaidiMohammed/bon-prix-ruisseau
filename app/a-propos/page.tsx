"use client";

import { Award, Heart, ShieldCheck, Users } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import ZoomBg from "@/components/ZoomBg";
import { useSiteData } from "@/lib/store";

const VALUES = [
  { icon: Award, fr: "Qualité d'abord", ar: "الجودة أولاً", txt: "On sélectionne chaque pièce comme si c'était pour nous. Pas de faux-semblants." },
  { icon: Heart, fr: "Esprit quartier", ar: "روح الحومة", txt: "Né au Ruisseau, porté par ouled el hamra ❤️🖤. On habille nos frères." },
  { icon: ShieldCheck, fr: "Prix justes", ar: "أسعار معقولة", txt: "Bon prix, vraiment. Le meilleur rapport qualité-prix du marché." },
  { icon: Users, fr: "Communauté", ar: "العائلة", txt: "19K+ abonnés TikTok, des lives, des promos pour la famille." },
];

export default function AboutPage() {
  const { settings } = useSiteData();
  return (
    <div className="pt-32">
      <ZoomBg src={settings.backgrounds.about} />
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading kicker="Notre histoire" title="À propos" arabic="حكايتنا" />
        <Reveal className="mx-auto mt-6 max-w-3xl text-center">
          <p className="text-2xl leading-snug font-medium sm:text-3xl">
            Une boutique née au <span className="text-signal">Ruisseau</span>, qui habille
            Alger avec fierté — <span className="font-arabic text-gold">من الحومة، للحومة</span>
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Reveal className="glass overflow-hidden rounded-[2rem] border border-white/12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.backgrounds.home} alt="Magasin" className="h-64 w-full object-cover" />
            <div className="p-7">
              <p className="font-display text-2xl uppercase">Le magasin</p>
              <p className="mt-2 text-cream/70">
                {settings.shop.address}. Viens toucher la qualité, essayer, repartir stylé le jour même.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="glass overflow-hidden rounded-[2rem] border border-white/12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.backgrounds.shop} alt="Collection" className="h-64 w-full object-cover" />
            <div className="p-7">
              <p className="font-display text-2xl uppercase">La sélection</p>
              <p className="mt-2 text-cream/70">
                Maillots 2027, survêtements, sneakers, enfants — S au XXL, nouveautés chaque semaine sur TikTok.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-3 text-center">
          {[
            { n: "5+", l: "ans au Ruisseau", a: "سنوات خبرة" },
            { n: "19K+", l: "abonnés TikTok", a: "متابع" },
            { n: "4.9★", l: "satisfaction", a: "رضا الزبائن" },
          ].map((s) => (
            <Reveal key={s.l} className="glass rounded-[2rem] border border-white/12 px-4 py-8">
              <p className="font-display text-4xl text-gold sm:text-5xl">{s.n}</p>
              <p className="mt-1 text-sm font-bold">{s.l}</p>
              <p className="font-arabic text-xs text-cream/50">{s.a}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-14">
          <SectionHeading kicker="Nos valeurs" title="Pourquoi nous" arabic="علاش حنا" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.fr} delay={i * 0.07} className="glass rounded-[2rem] border border-white/12 p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-signal/15 text-signal">
                  <v.icon size={22} />
                </span>
                <p className="mt-4 font-display text-xl uppercase">{v.fr}</p>
                <p className="font-arabic text-gold">{v.ar}</p>
                <p className="mt-2 text-sm text-cream/65">{v.txt}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="h-10" />
      </section>
    </div>
  );
}
