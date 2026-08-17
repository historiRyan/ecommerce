export type Review = {
  id: number | string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
};

export type ProductReview = {
  id: string;
  product_id: string;
  customer_id: string;
  username: string;
  full_name: string | null;
  avatar_path: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug?: string;
  count?: number;
};

export type Product = {
  id: string | number;
  name: string;
  slug?: string;
  category: string;
  categoryId?: string | null;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  imagePaths?: string[];
  imageIds?: string[];
  shortDescription: string;
  description: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  features: string[];
  inStock: boolean;
  featured?: boolean;
  createdBy?: string | null;
  createdAt?: string;
  stockQuantity?: number;
  reviews: Review[];
};

export const categories = [
  { id: "audio", name: "Audio", image: "https://images.pexels.com/photos/8356854/pexels-photo-8356854.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", count: 3 },
  { id: "watches", name: "Jam", image: "https://images.pexels.com/photos/3766111/pexels-photo-3766111.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", count: 2 },
  { id: "footwear", name: "Sepatu", image: "https://images.pexels.com/photos/7916058/pexels-photo-7916058.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", count: 2 },
  { id: "eyewear", name: "Kacamata", image: "https://images.pexels.com/photos/34467082/pexels-photo-34467082.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", count: 1 },
  { id: "bags", name: "Tas", image: "https://images.pexels.com/photos/15246346/pexels-photo-15246346.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", count: 1 },
  { id: "home", name: "Rumah", image: "https://images.pexels.com/photos/13907998/pexels-photo-13907998.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", count: 1 },
  { id: "cameras", name: "Kamera", image: "https://images.pexels.com/photos/8539298/pexels-photo-8539298.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", count: 1 },
  { id: "fragrance", name: "Parfüm", image: "https://images.pexels.com/photos/37127787/pexels-photo-37127787.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", count: 1 },
];

const baseReviews = (offset: number): Review[] => [
  { id: offset + 1, author: "Marcus L.", rating: 5, date: "2 weeks ago", title: "Exceeded expectations", body: "Build quality is outstanding and it looks even better in person. Packaging felt premium and shipping was fast." },
  { id: offset + 2, author: "Priya S.", rating: 4, date: "1 month ago", title: "Great value", body: "Really happy with the purchase. Minor nitpick on the finish but overall a solid buy for the price point." },
  { id: offset + 3, author: "Daniel R.", rating: 5, date: "1 month ago", title: "My new daily", body: "I use this every single day. Comfortable, reliable, and the design turns heads. Would buy again." },
  { id: offset + 4, author: "Aisha K.", rating: 4, date: "2 months ago", title: "Solid, small learning curve", body: "Took a little getting used to but now I can't imagine going back. Customer support was helpful too." },
];

export const products: Product[] = [
  {
    id: 1,
    name: "Aurora Wireless Headphones",
    category: "audio",
    price: 5584000,
    originalPrice: 7184000,
    rating: 4.8,
    reviewCount: 1284,
    images: [
      "https://images.pexels.com/photos/8356854/pexels-photo-8356854.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/13650607/pexels-photo-13650607.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/8038326/pexels-photo-8038326.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Studio-grade noise cancelling with 40h battery life.",
    description: "The Aurora delivers reference-class audio with adaptive hybrid noise cancellation that reads your environment 50,000 times per second. Memory-foam ear cushions and a titanium headband keep them comfortable for all-day listening, while the 40-hour battery means you'll rarely reach for the charger.",
    colors: [
      { name: "Graphite", hex: "#334155" },
      { name: "Rose", hex: "#e2c9c9" },
      { name: "Silver", hex: "#cbd5e1" },
    ],
    sizes: ["Standard"],
    features: ["Adaptive ANC", "40h battery", "Bluetooth 5.3", "USB-C fast charge", "Multipoint pairing"],
    inStock: true,
    reviews: baseReviews(0),
  },
  {
    id: 2,
    name: "Pulse Studio Monitors",
    category: "audio",
    price: 9584000,
    originalPrice: 11664000,
    rating: 4.7,
    reviewCount: 642,
    images: [
      "https://images.pexels.com/photos/13650607/pexels-photo-13650607.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/8038326/pexels-photo-8038326.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/8356854/pexels-photo-8356854.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Reference monitoring for home studios.",
    description: "Pulse monitors reproduce every detail with a flat frequency response tuned for mixing. The rear bass port extends low-end without boominess, and the silk-dome tweeter stays smooth even at high SPL.",
    colors: [
      { name: "Black", hex: "#1e293b" },
      { name: "White", hex: "#f1f5f9" },
    ],
    sizes: ["Pair"],
    features: ["Flat response", "Rear bass port", "Silk-dome tweeter", "Balanced inputs"],
    inStock: true,
    reviews: baseReviews(4),
  },
  {
    id: 3,
    name: "Echo True Wireless Buds",
    category: "audio",
    price: 2864000,
    originalPrice: 3504000,
    rating: 4.6,
    reviewCount: 2104,
    images: [
      "https://images.pexels.com/photos/8038326/pexels-photo-8038326.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/8356854/pexels-photo-8356854.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/13650607/pexels-photo-13650607.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Pocketable buds with spatial audio.",
    description: "Echo buds pack head-tracking spatial audio into a featherweight shell. The charging case delivers three full charges and wireless Qi charging keeps things cable-free.",
    colors: [
      { name: "Graphite", hex: "#334155" },
      { name: "Cloud", hex: "#e2e8f0" },
    ],
    sizes: ["One Size"],
    features: ["Spatial audio", "Qi charging case", "IPX4 sweat resistance", "28h total battery"],
    inStock: true,
    reviews: baseReviews(8),
  },
  {
    id: 4,
    name: "Meridian Automatic Watch",
    category: "watches",
    price: 14384000,
    originalPrice: 17584000,
    rating: 4.9,
    reviewCount: 318,
    images: [
      "https://images.pexels.com/photos/3766111/pexels-photo-3766111.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/1697218/pexels-photo-1697218.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/33511755/pexels-photo-33511755.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Sapphire dial automatic, 100m water resistant.",
    description: "The Meridian houses a 28-jewel automatic movement visible through an exhibition caseback. A sapphire crystal guards the sunburst blue dial, and the brushed steel bracelet is finished by hand.",
    colors: [
      { name: "Sapphire", hex: "#1d4ed8" },
      { name: "Onyx", hex: "#0f172a" },
      { name: "Steel", hex: "#94a3b8" },
    ],
    sizes: ["40mm", "42mm"],
    features: ["28-jewel automatic", "Sapphire crystal", "100m WR", "Exhibition caseback"],
    inStock: true,
    reviews: baseReviews(12),
  },
  {
    id: 5,
    name: "Heritage Leather Watch",
    category: "watches",
    price: 6864000,
    rating: 4.7,
    reviewCount: 521,
    images: [
      "https://images.pexels.com/photos/1697218/pexels-photo-1697218.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/33511755/pexels-photo-33511755.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/3766111/pexels-photo-3766111.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Minimal dial on hand-stitched leather.",
    description: "Heritage pairs a clean enamel-white dial with a vegetable-tanned leather strap that patinas beautifully over time. The quartz movement keeps it slim enough to slide under a cuff.",
    colors: [
      { name: "Tan", hex: "#b45309" },
      { name: "Espresso", hex: "#451a03" },
    ],
    sizes: ["38mm", "40mm"],
    features: ["Swiss quartz", "Sapphire crystal", "Italian leather", "50m WR"],
    inStock: true,
    reviews: baseReviews(16),
  },
  {
    id: 6,
    name: "Trail Runner Sneakers",
    category: "footwear",
    price: 2544000,
    originalPrice: 3184000,
    rating: 4.6,
    reviewCount: 876,
    images: [
      "https://images.pexels.com/photos/7916058/pexels-photo-7916058.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/2547007/pexels-photo-2547007.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/1456733/pexels-photo-1456733.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "All-terrain grip with energy-return foam.",
    description: "Trail Runner combines a rugged lugged outsole with a responsive energy-return midsole. A breathable engineered mesh upper keeps feet cool on long days.",
    colors: [
      { name: "Slate", hex: "#475569" },
      { name: "Sand", hex: "#d6c3a5" },
      { name: "Black", hex: "#0f172a" },
    ],
    sizes: ["7", "8", "9", "10", "11", "12"],
    features: ["Energy-return foam", "Lugged outsole", "Engineered mesh", "Rock plate"],
    inStock: true,
    reviews: baseReviews(20),
  },
  {
    id: 7,
    name: "Court Classic Sneakers",
    category: "footwear",
    price: 2064000,
    originalPrice: 2544000,
    rating: 4.5,
    reviewCount: 1432,
    images: [
      "https://images.pexels.com/photos/2547007/pexels-photo-2547007.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/1456733/pexels-photo-1456733.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/7916058/pexels-photo-7916058.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Timeless court silhouette, everyday comfort.",
    description: "Court Classic takes the tennis-shoe silhouette and adds a memory-foam insole for all-day wear. Full-grain leather upper ages gracefully with every wear.",
    colors: [
      { name: "White", hex: "#f8fafc" },
      { name: "Bone", hex: "#e7e5e4" },
      { name: "Olive", hex: "#3f6212" },
    ],
    sizes: ["7", "8", "9", "10", "11", "12", "13"],
    features: ["Full-grain leather", "Memory-foam insole", "Rubber cupsole", "Padded collar"],
    inStock: true,
    reviews: baseReviews(24),
  },
  {
    id: 8,
    name: "Horizon Sunglasses",
    category: "eyewear",
    price: 3504000,
    originalPrice: 4304000,
    rating: 4.8,
    reviewCount: 402,
    images: [
      "https://images.pexels.com/photos/34467082/pexels-photo-34467082.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/34978681/pexels-photo-34978681.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/5202046/pexels-photo-5202046.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Polarized lenses, Italian acetate frame.",
    description: "Horizon is cut from Italian Mazzucchelli acetate and fitted with polarized lenses that cut 99% of glare. The keyhole bridge and riveted hinges nod to classic mid-century eyewear.",
    colors: [
      { name: "Tortoise", hex: "#78350f" },
      { name: "Crystal", hex: "#e2e8f0" },
      { name: "Onyx", hex: "#0f172a" },
    ],
    sizes: ["One Size"],
    features: ["Polarized lenses", "Italian acetate", "UV400", "Riveted hinges"],
    inStock: true,
    reviews: baseReviews(28),
  },
  {
    id: 9,
    name: "Voyage Leather Backpack",
    category: "bags",
    price: 5264000,
    originalPrice: 6384000,
    rating: 4.9,
    reviewCount: 287,
    images: [
      "https://images.pexels.com/photos/15246346/pexels-photo-15246346.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/8266907/pexels-photo-8266907.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/13870707/pexels-photo-13870707.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Full-grain leather, fits a 16\" laptop.",
    description: "Voyage is built from vegetable-tanned full-grain leather with a padded sleeve that fits a 16-inch laptop. Solid brass hardware and a structured base keep its shape for years.",
    colors: [
      { name: "Cognac", hex: "#92400e" },
      { name: "Black", hex: "#0f172a" },
    ],
    sizes: ["Standard"],
    features: ["Full-grain leather", "16\" laptop sleeve", "Brass hardware", "Structured base"],
    inStock: true,
    reviews: baseReviews(32),
  },
  {
    id: 10,
    name: "Lumen Arc Lamp",
    category: "home",
    price: 3984000,
    rating: 4.7,
    reviewCount: 164,
    images: [
      "https://images.pexels.com/photos/19328773/pexels-photo-19328773.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/7107482/pexels-photo-7107482.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/12968980/pexels-photo-12968980.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Warm dimmable arc floor lamp.",
    description: "Lumen arcs a warm 2700K beam over your reading chair with a touch-dimmable base. The powder-coated steel stem and cast-iron foot keep it planted.",
    colors: [
      { name: "Brass", hex: "#a16207" },
      { name: "Matte Black", hex: "#0f172a" },
    ],
    sizes: ["Standard"],
    features: ["Touch dimming", "2700K warm light", "Cast-iron base", "LED included"],
    inStock: true,
    reviews: baseReviews(36),
  },
  {
    id: 11,
    name: "Aperture Mirrorless Camera",
    category: "cameras",
    price: 20784000,
    originalPrice: 23984000,
    rating: 4.9,
    reviewCount: 503,
    images: [
      "https://images.pexels.com/photos/8539298/pexels-photo-8539298.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/29228298/pexels-photo-29228298.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/32885755/pexels-photo-32885755.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "33MP full-frame sensor, 8K video.",
    description: "Aperture pairs a 33MP back-illuminated full-frame sensor with in-body 5-axis stabilization. 8K30 and 4K120 recording plus a 759-point phase-detect AF system track subjects with precision.",
    colors: [
      { name: "Black", hex: "#0f172a" },
      { name: "Silver", hex: "#cbd5e1" },
    ],
    sizes: ["Body Only", "Kit"],
    features: ["33MP full-frame", "5-axis IBIS", "8K30 video", "759-point AF"],
    inStock: true,
    reviews: baseReviews(40),
  },
  {
    id: 12,
    name: "Noir Eau de Parfum",
    category: "fragrance",
    price: 3024000,
    originalPrice: 3664000,
    rating: 4.8,
    reviewCount: 738,
    images: [
      "https://images.pexels.com/photos/37127787/pexels-photo-37127787.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/15096784/pexels-photo-15096784.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "https://images.pexels.com/photos/7703038/pexels-photo-7703038.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    ],
    shortDescription: "Amber, oud, and smoked vanilla.",
    description: "Noir opens with bergamot and pink pepper before settling into amber, oud, and smoked vanilla. The refillable flacon is weighted glass with a magnetic cap.",
    colors: [
      { name: "Amber", hex: "#b45309" },
    ],
    sizes: ["50ml", "100ml"],
    features: ["Refillable flacon", "Amber & oud", "Magnetic cap", "Long-lasting sillage"],
    inStock: true,
    reviews: baseReviews(44),
  },
];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
