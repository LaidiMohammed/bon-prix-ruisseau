"use client";

import { usePathname } from "next/navigation";
import BottomDock from "./BottomDock";
import Footer from "./Footer";
import TopNav from "./TopNav";
import { useSiteData } from "@/lib/store";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteData();
  const path = usePathname();
  const isAdmin = path.startsWith("/bpr-studio-2026");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <TopNav promo={settings.promo} />
      {children}
      <Footer settings={settings} />
      <BottomDock />
    </>
  );
}
