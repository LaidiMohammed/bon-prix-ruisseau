"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ZoomBg({
  src,
  overlay = true,
}: {
  src: string;
  overlay?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1.0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  return (
    <div ref={ref} className="fixed inset-0 -z-10 overflow-hidden bg-ink">
      <motion.div style={{ scale, opacity }} className="h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
      </motion.div>
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/55 to-ink" />
      )}
    </div>
  );
}
