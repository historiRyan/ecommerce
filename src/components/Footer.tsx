import { ShoppingBag, Twitter, Instagram, Github, Linkedin } from "lucide-react";
import type { Tab } from "@/components/Navbar";

export function Footer({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const cols: { title: string; links: { label: string; tab?: Tab }[] }[] = [
    {
      title: "Toko",
      links: [
        { label: "Semua produk", tab: "shop" },
        { label: "Audio", tab: "shop" },
        { label: "Jam", tab: "shop" },
        { label: "Sepatu", tab: "shop" },
      ],
    },
    {
      title: "Perusahaan",
      links: [{ label: "Tentang" }, { label: "Karir" }, { label: "Tekanan" }, { label: "Keberlanjutan" }],
    },
    {
      title: "Dukungan",
      links: [{ label: "Pusat bantuan" }, { label: "Pengiriman" }, { label: "Pengembalian" }, { label: "Garansi" }],
    },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                <ShoppingBag size={18} />
              </span>
              TokoRyan<span className="text-indigo-400">.</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Barang premium untuk gaya hidup modern. Dibuat oleh para pengrajin yang kami percayai,
              dikirimkan dengan layanan white-glove.
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Instagram, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:border-indigo-500 hover:text-indigo-400"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <button
                      onClick={() => l.tab && onTabChange(l.tab)}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">© 2026 TokoRyan. Seluruh hak dilindungi.</p>
          <div className="flex gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300">Kebijakan Privasi</a>
            <a href="#" className="hover:text-slate-300">Syarat &amp; Ketentuan</a>
            <a href="#" className="hover:text-slate-300">Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
