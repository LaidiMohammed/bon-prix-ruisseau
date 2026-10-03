"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { HERO } from "@/lib/mock-data";
import SafeImg from "./SafeImg";

export default function HeroVideo({ videoUrl }: { videoUrl: string }) {
  const [videoOk, setVideoOk] = useState(true);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Ken-burns poster always present */}
      <SafeImg
        src={HERO.poster}
        alt="Bon Prix Ruisseau"
        className="animate-kenburns h-full w-full object-cover"
      />
      {videoOk && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl || HERO.videoUrl}
          poster={HERO.poster}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink" />
      <AnimatePresence>
        {!videoOk && null}
      </AnimatePresence>
    </div>
  );
}
