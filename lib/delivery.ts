// Delivery fees in DA — editable here / later in admin.
// home = à domicile, bureau = stopdesk (paiement à la livraison).

export type DeliveryType = "home" | "bureau";

const EXPLICIT: Record<number, { home: number; bureau: number }> = {
  16: { home: 500, bureau: 300 },
  9: { home: 550, bureau: 350 },
  35: { home: 550, bureau: 350 },
  42: { home: 550, bureau: 350 },
  31: { home: 600, bureau: 350 },
  10: { home: 600, bureau: 350 },
  26: { home: 650, bureau: 400 },
  44: { home: 650, bureau: 400 },
  2: { home: 650, bureau: 400 },
  6: { home: 650, bureau: 400 },
  15: { home: 650, bureau: 400 },
  19: { home: 650, bureau: 400 },
  25: { home: 650, bureau: 400 },
  34: { home: 700, bureau: 400 },
  18: { home: 700, bureau: 400 },
  21: { home: 700, bureau: 400 },
  23: { home: 700, bureau: 400 },
  27: { home: 700, bureau: 400 },
  29: { home: 700, bureau: 400 },
  48: { home: 700, bureau: 400 },
  24: { home: 750, bureau: 450 },
  28: { home: 750, bureau: 450 },
  4: { home: 750, bureau: 450 },
  5: { home: 750, bureau: 450 },
  13: { home: 750, bureau: 450 },
  22: { home: 750, bureau: 450 },
  46: { home: 750, bureau: 450 },
  43: { home: 750, bureau: 450 },
  14: { home: 750, bureau: 450 },
  38: { home: 750, bureau: 450 },
  7: { home: 800, bureau: 500 },
  12: { home: 800, bureau: 500 },
  20: { home: 800, bureau: 500 },
  17: { home: 800, bureau: 500 },
  40: { home: 800, bureau: 500 },
  41: { home: 800, bureau: 500 },
  36: { home: 800, bureau: 500 },
  3: { home: 850, bureau: 550 },
  51: { home: 850, bureau: 550 },
  30: { home: 900, bureau: 550 },
  39: { home: 900, bureau: 550 },
  32: { home: 900, bureau: 550 },
  47: { home: 900, bureau: 550 },
  55: { home: 900, bureau: 550 },
  57: { home: 900, bureau: 550 },
  8: { home: 1000, bureau: 650 },
  58: { home: 1000, bureau: 650 },
  45: { home: 950, bureau: 600 },
  52: { home: 1100, bureau: 700 },
  1: { home: 1200, bureau: 750 },
  49: { home: 1250, bureau: 800 },
  53: { home: 1300, bureau: 850 },
  33: { home: 1300, bureau: 800 },
  11: { home: 1400, bureau: 900 },
  37: { home: 1400, bureau: 900 },
  56: { home: 1400, bureau: 900 },
  50: { home: 1500, bureau: 1000 },
  54: { home: 1500, bureau: 1000 },
};

const DEFAULT_FEE = { home: 900, bureau: 550 };

export const deliveryFee = (wilayaCode: number, type: DeliveryType): number =>
  (EXPLICIT[wilayaCode] ?? DEFAULT_FEE)[type];

export const DELIVERY_LABEL: Record<DeliveryType, { fr: string; ar: string }> =
  {
    home: { fr: "À domicile", ar: "للمنزل" },
    bureau: { fr: "Bureau (Stopdesk)", ar: "مكتب التوصيل" },
  };
