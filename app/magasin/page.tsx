"use client";

import { Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import ZoomBg from "@/components/ZoomBg";
import { useSiteData } from "@/lib/store";

export default function MagasinPage() {
  const { settings } = useSiteData();
  const shop = settings.shop;

  return (
    <div className="pt-32">
      <ZoomBg src={settings.backgrounds.store} />
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading kicker="Nous trouver" title="Mon magasin" arabic="محلنا" />

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal className="glass overflow-hidden rounded-[2.5rem] border border-white/12">
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-signal">
                  <MapPin size={26} />
                </span>
                <div>
                  <p className="font-display text-2xl uppercase">{shop.name}</p>
                  <p className="font-arabic text-gold">{shop.nameAr}</p>
                </div>
              </div>
              <p className="mt-6 text-lg">{shop.address}</p>
              <p className="font-arabic text-cream/70">{shop.addressAr}</p>
              <p className="mt-2 text-sm font-bold text-gold">{shop.plusCode}</p>
              <div className="mt-5 flex items-start gap-2 rounded-2xl bg-white/5 p-4 text-sm">
                <Clock size={18} className="mt-0.5 shrink-0 text-signal" />
                <div>
                  <p>{shop.hours}</p>
                  <p className="font-arabic text-cream/60">{shop.hoursAr}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 rounded-full bg-cream py-3 text-sm font-black text-ink uppercase transition hover:bg-signal hover:text-white"
                >
                  <Navigation size={16} /> Itinéraire
                </a>
                <a
                  href={settings.socials.whatsapp}
                  target="_blank"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-black text-ink uppercase"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
              <a
                href={`tel:${settings.socials.phone}`}
                className="mt-2.5 flex items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm font-bold hover:bg-white/10"
              >
                <Phone size={16} /> {settings.socials.phone}
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="overflow-hidden rounded-[2.5rem] border border-white/12">
            <iframe
              title="Carte magasin"
              src={shop.mapEmbed}
              className="h-full min-h-[420px] w-full grayscale invert-[0.9]"
              loading="lazy"
            />
          </Reveal>
        </div>
        <div className="h-10" />
      </section>
    </div>
  );
}
