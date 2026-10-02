"use client";

import { usePathname } from "next/navigation";
import BottomDock from "./BottomDock";
import Footer from "./Footer";
import TopNav from "./TopNav";
import { CartDrawer, CartFab } from "./Cart";
import { ShopProvider, useShop } from "./ShopProvider";
import { useSiteData } from "@/lib/store";

function Shell({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteData();
  const path = usePathname();
  const isAdmin = path.startsWith("/bpr-x9f3k72dz");

  if (isAdmin) return <ShopProvider>{children}</ShopProvider>;

  return (
    <ShopProvider>
      <TopNav promo={settings.promo} />
      {children}
      <Footer settings={settings} />
      <CartFab />
      <CartDrawer />
      <BottomDock />
    </ShopProvider>
  );
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}

// Re-export for pages
export { useShop };
