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

export const fmtDA = (n: number) =>
  `${n.toLocaleString("fr-DZ").replace(/,/g, " ")} DA`;
