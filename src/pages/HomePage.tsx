import { ArrowRight, Sparkles, Truck, ShieldCheck, RotateCcw, Star } from "lucide-react";
import { useProducts } from "@/context/ProductsContext";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import type { Tab } from "@/components/Navbar";

const categoryImages: Record<string, string> = {
  audio: "https://images.pexels.com/photos/8356854/pexels-photo-8356854.jpeg",
  watches: "https://images.pexels.com/photos/3766111/pexels-photo-3766111.jpeg",
  footwear: "https://images.pexels.com/photos/7916058/pexels-photo-7916058.jpeg",
  eyewear: "https://images.pexels.com/photos/34467082/pexels-photo-34467082.jpeg",
  bags: "https://images.pexels.com/photos/15246346/pexels-photo-15246346.jpeg",
  home: "https://images.pexels.com/photos/13907998/pexels-photo-13907998.jpeg",
  cameras: "https://images.pexels.com/photos/8539298/pexels-photo-8539298.jpeg",
  fragrance: "https://images.pexels.com/photos/37127787/pexels-photo-37127787.jpeg",
};

function categoryImage(slug: string): string {
  const base = categoryImages[slug];
  if (base) return `${base}?auto=compress&cs=tinysrgb&h=650&w=940`;
  return `https://images.pexels.com/photos/8356854/pexels-photo-8356854.jpeg?auto=compress&cs=tinysrgb&h=650&w=940`;
}

export function HomePage({
  onTabChange,
  onOpenProduct,
}: {
  onTabChange: (tab: Tab) => void;
  onOpenProduct: (p: Product) => void;
}) {
  const { addItem } = useCart();
  const { products, categories, featuredProducts } = useProducts();
  const bestSellers = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(139,92,246,0.3), transparent 40%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28 lg:px-8">
          <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-md">
                <Sparkles size={14} /> Koleksi musim baru 2026
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Barang premium untuk{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  gaya hidup modern
                </span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
                Audio, jam, dan benda lifestyle yang kami pilih — untuk pembuat
                yang kami percaya dan dikirim dengan layanan white-glove.
              </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onTabChange("shop")}
                className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40"
              >
                Belanja koleksi
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onTabChange("shop")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                Jelajahi kategori
              </button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                <span className="font-semibold text-white">4.9</span> rata-rata rating
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div><span className="font-semibold text-white">12k+</span> pelanggan puas</div>
              <div className="h-4 w-px bg-white/20" />
              <div><span className="font-semibold text-white">200+</span> pengrajin</div>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 blur-2xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <img
                src="https://images.pexels.com/photos/8356854/pexels-photo-8356854.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Headphones"
                className="mt-8 aspect-[3/4] w-full rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
              />
              <img
                src="https://images.pexels.com/photos/3766111/pexels-photo-3766111.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Watch"
                className="aspect-[3/4] w-full rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Truck, title: "Gratis ongkir", desc: "Untuk pesanan di atas Rp150.000" },
            { icon: ShieldCheck, title: "Garansi 2 tahun", desc: "Untuk setiap produk" },
            { icon: RotateCcw, title: "Pengembalian 30 hari", desc: "Tanpa pertanyaan" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <f.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Produk unggulan
              </h2>
              <p className="mt-1 text-sm text-slate-500">Pilihan kami yang direkomendasikan.</p>
            </div>
            <button
              onClick={() => onTabChange("shop")}
              className="hidden items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 sm:flex"
            >
              Lihat semua <ArrowRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpen={() => onOpenProduct(p)}
                onQuickAdd={() => addItem(p, 1, p.colors[0]?.name ?? "Default", p.sizes[0] ?? "One Size")}
              />
            ))}
          </div>
        </section>
      )}

      {/* Bento category grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Belanja per kategori
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {categories.length} kategori yang kami pilih.
            </p>
          </div>
          <button
            onClick={() => onTabChange("shop")}
            className="hidden items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 sm:flex"
          >
            Semua kategori <ArrowRight size={15} />
          </button>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada kategori.</p>
        ) : (
          <div className="grid auto-rows-[180px] grid-cols-2 gap-4 sm:grid-cols-4 sm:auto-rows-[200px]">
            {categories.map((c, i) => {
              const isFeatured = i === 0;
              const image = categoryImage(c.slug ?? c.id);
              return (
                <button
                  key={c.slug}
                  onClick={() => onTabChange("shop")}
                  className={`group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md transition-all hover:brightness-110 ${
                    isFeatured ? "col-span-2 row-span-2" : ""
                  }`}
                >
                  <img
                    src={image}
                    alt={c.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-0 p-4 text-left">
                    <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">{c.count ?? 0} barang</p>
                    <h3 className={`font-bold text-white ${isFeatured ? "text-2xl" : "text-lg"}`}>{c.name}</h3>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Best sellers */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Produk terlaris
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Produk yang paling disukai komunitas kami.
            </p>
            </div>
            <button
              onClick={() => onTabChange("shop")}
              className="hidden items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 sm:flex"
            >
              Lihat semua <ArrowRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpen={() => onOpenProduct(p)}
                onQuickAdd={() => addItem(p, 1, p.colors[0]?.name ?? "Default", p.sizes[0] ?? "One Size")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-12 sm:px-12 sm:py-16">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-medium text-indigo-100">Waktu terbatas</p>
              <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Diskon hingga 30% audio minggu ini
              </h2>
              <p className="mt-3 max-w-md text-indigo-100">
                Headphone dan monitor referensi dengan harga terendah musim ini.
              </p>
            </div>
            <button
              onClick={() => onTabChange("shop")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-transform hover:scale-105"
            >
              Belanja diskon <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
