export type Product = {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  price: number;
  oldPrice?: number;
  sizes: string[];
  image: string;
  tag?: string;
  rating: number;
  description: string;
  descriptionAr: string;
  stock: number; // admin sees the number, clients only see En stock / Rupture
  players: string[]; // preset flocage names for this shirt
};

export const CATEGORIES = [
  "Tous",
  "Maillots",
  "Survêtements",
  "Chaussures",
  "Vestes",
  "Enfants",
  "Accessoires",
] as const;

export const SOCIALS = {
  tiktok: "https://www.tiktok.com/@bon_prix_ruisseau_sports",
  instagram: "https://www.instagram.com/bon_prix_ruisseau/",
  facebook: "https://www.facebook.com/bonprixruisseau/",
  whatsapp: "https://wa.me/213550000000",
  phone: "+213 550 00 00 00",
};

export const SHOP = {
  name: "Bon Prix Ruisseau Sports",
  nameAr: "بون بري روسو سبور",
  address: "Rue Abderahmane Boulouah, Mohamed Belouizdad, Alger 16009",
  addressAr: "شارع عبد الرحمان بولواه، محمد بلوزداد، الجزائر",
  plusCode: "P3VJ+9MQ Alger",
  hours: "Sam – Jeu : 09:00 → 20:00 • Ven : 14:00 → 20:00",
  hoursAr: "السبت – الخميس: 09:00 → 20:00 • الجمعة: 14:00 → 20:00",
  mapEmbed:
    "https://www.google.com/maps?q=Rue+Abderahmane+Boulouah+Mohamed+Belouizdad+Algiers&output=embed",
};

const img = (id: number, w = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const HERO = {
  // Ultras celebration: flares + chanting crowd, loops as background.
  // To use your own TikTok export instead: drop it as public/videos/hero.mp4
  // and paste "/videos/hero.mp4" in the hidden admin panel.
  videoUrl:
    "https://upload.wikimedia.org/wikipedia/commons/8/82/TFC_GF38_2021-09-18_4_fumi.webm",
  poster: img(31377598, 1600),
};

export const BACKGROUNDS = {
  home: img(31377598, 1600),
  about: img(33428832, 1600),
  shop: img(36068667, 1600),
  store: img(38546953, 1600),
};

export const PRODUCTS: Product[] = [
  {
    id: "liverpool-home-2627",
    name: "Maillot Liverpool Domicile 26/27",
    nameAr: "قميص ليفربول الأساسي 26/27",
    category: "Maillots",
    price: 3200,
    oldPrice: 3800,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: img(30314840),
    tag: "Best-seller",
    rating: 4.9,
    stock: 24,
    players: ["SALAH 11","VAN DIJK 4","WIRTZ 7"],
    description: "Maillot domicile Liverpool 26/27 — tissu respirant, écusson brodé, coupe supporters.",
    descriptionAr: "قميص ليفربول الأساسي 26/27 — قماش يتنفس، شعار مطرز.",
  },
  {
    id: "united-home-2627",
    name: "Maillot Man United Domicile 26/27",
    nameAr: "قميص مان يونايتد الأساسي 26/27",
    category: "Maillots",
    price: 3200,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: img(37702263),
    tag: "Nouveau",
    rating: 4.8,
    stock: 18,
    players: ["FERNANDES 8","CUNHA 10","DIALLO 16"],
    description: "Maillot domicile Man United 26/27 — rouge diable, matière premium anti-transpirante.",
    descriptionAr: "قميص مان يونايتد الأساسي 26/27 — أحمر الشياطين بجودة عالية.",
  },
  {
    id: "arsenal-home-2627",
    name: "Maillot Arsenal Domicile 26/27",
    nameAr: "قميص أرسنال الأساسي 26/27",
    category: "Maillots",
    price: 3200,
    oldPrice: 3700,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: img(15837447),
    rating: 4.8,
    stock: 15,
    players: ["SAKA 7","ODEGAARD 8","RICE 41"],
    description: "Maillot domicile Arsenal 26/27 — rouge & blanc canonniers, finition premium.",
    descriptionAr: "قميص أرسنال الأساسي 26/27 — أحمر وأبيض بلمسة فاخرة.",
  },
  {
    id: "city-home-2627",
    name: "Maillot Man City Domicile 26/27",
    nameAr: "قميص مان سيتي الأساسي 26/27",
    category: "Maillots",
    price: 3200,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: img(37331795),
    tag: "Nouveau",
    rating: 4.7,
    stock: 12,
    players: ["HAALAND 9","FODEN 47","RODRI 16"],
    description: "Maillot domicile Man City 26/27 — bleu ciel, technologie dry-fit, coupe moderne.",
    descriptionAr: "قميص مان سيتي الأساسي 26/27 — أزرق سماوي بقصّة عصرية.",
  },
  {
    id: "chelsea-home-2627",
    name: "Maillot Chelsea Domicile 26/27",
    nameAr: "قميص تشيلسي الأساسي 26/27",
    category: "Maillots",
    price: 3200,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: img(36068667),
    rating: 4.7,
    stock: 9,
    players: ["PALMER 20","CAICEDO 25","FERNANDEZ 8"],
    description: "Maillot domicile Chelsea 26/27 — bleu roi, tissu léger, style Stamford Bridge.",
    descriptionAr: "قميص تشيلسي الأساسي 26/27 — أزرق ملكي خفيف.",
  },
  {
    id: "spurs-home-2627",
    name: "Maillot Tottenham Domicile 26/27",
    nameAr: "قميص توتنهام الأساسي 26/27",
    category: "Maillots",
    price: 3200,
    oldPrice: 3600,
    sizes: ["S", "M", "L", "XL"],
    image: img(18256095),
    tag: "Limited",
    rating: 4.6,
    stock: 4,
    players: ["SOLANKE 19","MADDISON 10","KULUSEVSKI 21"],
    description: "Maillot domicile Tottenham 26/27 — blanc pur, édition limitée, coupe slim.",
    descriptionAr: "قميص توتنهام الأساسي 26/27 — أبيض، إصدار محدود.",
  },
  {
    id: "liverpool-away-2627",
    name: "Maillot Liverpool Extérieur 26/27",
    nameAr: "قميص ليفربول الاحتياطي 26/27",
    category: "Maillots",
    price: 2900,
    oldPrice: 3400,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: img(14984376),
    tag: "Promo",
    rating: 4.8,
    stock: 7,
    players: ["SALAH 11","VAN DIJK 4","WIRTZ 7"],
    description: "Maillot extérieur Liverpool 26/27 — coloris away exclusif, prix promo.",
    descriptionAr: "قميص ليفربول الاحتياطي 26/27 — بسعر التخفيض.",
  },
  {
    id: "pl-kids-2627",
    name: "Ensemble PL Enfant 26/27",
    nameAr: "طقم الدوري الإنجليزي للأطفال 26/27",
    category: "Enfants",
    price: 1900,
    sizes: ["6A", "8A", "10A", "12A", "14A"],
    image: img(8289408),
    tag: "Promo",
    rating: 4.9,
    stock: 20,
    players: ["SALAH 11","HAALAND 9","SAKA 7"],
    description: "Ensemble Premier League enfant 26/27 — maillot + short, tailles 6 à 14 ans.",
    descriptionAr: "طقم أطفال 26/27 — قميص + شورت، من 6 إلى 14 سنة.",
  },
];

export const TIKTOK_REELS = [
  {
    id: 1,
    image: img(30314840, 600),
    views: "128K",
    label: "Liverpool 26/27 🔥",
  },
  {
    id: 2,
    image: img(37702263, 600),
    views: "86K",
    label: "United 26/27 👹",
  },
  {
    id: 3,
    image: img(37331795, 600),
    views: "64K",
    label: "City 26/27 🩵",
  },
  {
    id: 4,
    image: img(33428832, 600),
    views: "41K",
    label: "Ambiance PL ❤️🖤",
  },
];

export const FLOCAGE_PRICES = { player: 500, custom: 800 };

export const STAR_FLOCK = ["MBAPPÉ 9", "VINI JR 7", "BELLINGHAM 5", "SALAH 11", "HAALAND 9"];

export const fmtDA = (n: number) =>
  `${n.toLocaleString("fr-DZ").replace(/,/g, " ")} DA`;
