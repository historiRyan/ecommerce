import { useState, useEffect } from "react";
import { Search, ShoppingBag, Menu, X, Heart, LogIn, LogOut, Shield, Store, Truck, Clock, MessageCircle, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { chatsApi } from "@/data/productsApi";
import { getAvatarOrDefaultUrl } from "@/lib/supabase";

export type Tab =
  | "home"
  | "shop"
  | "product"
  | "cart"
  | "login"
  | "register"
  | "admin"
  | "toko"
  | "courier"
  | "my-orders"
  | "chat"
  | "profile";

const navItems: { id: Tab; label: string }[] = [
  { id: "home", label: "Beranda" },
  { id: "shop", label: "Toko" },
];

export function Navbar({
  active,
  onTabChange,
}: {
  active: Tab;
  onTabChange: (tab: Tab) => void;
}) {
   const [mobileOpen, setMobileOpen] = useState(false);
  const { count } = useCart();
  const { profile, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const fetch = async () => {
      try {
        const c = await chatsApi.unreadCountAll(profile.id);
        if (!cancelled) setUnreadCount(c);
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    };
    fetch();
    const timer = setInterval(fetch, 10000);
    const handler = () => fetch();
    window.addEventListener("chat:refresh", handler);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("chat:refresh", handler);
    };
  }, [profile]);

  const roleNavItems: { id: Tab; label: string; icon: React.ElementType }[] = [];
  if (profile?.role === "admin") {
    roleNavItems.push({ id: "admin", label: "Admin", icon: Shield });
  }
  if (profile?.role === "toko") {
    roleNavItems.push({ id: "toko", label: "Panel Toko", icon: Store });
  }
  if (profile?.role === "courier") {
    roleNavItems.push({ id: "courier", label: "Panel Kurir", icon: Truck });
  }
  if (profile && profile.approved) {
    roleNavItems.push({ id: "my-orders", label: "Pesanan Saya", icon: Clock });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <button
            onClick={() => onTabChange("home")}
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <ShoppingBag size={18} />
            </span>
            <span>
              Toko<span className="text-indigo-600">Ryan</span>.
            </span>
          </button>
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active === item.id
                    ? "text-indigo-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
                {active === item.id && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-indigo-600" />
                )}
              </button>
            ))}
            {roleNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active === item.id
                    ? "text-indigo-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <item.icon size={14} />
                {item.label}
                {active === item.id && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden flex-1 max-w-xs items-center lg:flex">
          <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-indigo-400 focus-within:bg-white">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Cari produk..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:block">
            <Heart size={20} />
          </button>
          {profile && (
            <>
              <button
                onClick={() => onTabChange("chat")}
                className="relative hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 sm:flex"
                title="Obrolan"
              >
                <MessageCircle size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onTabChange("profile")}
                className={`relative hidden rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 sm:flex ${profile.approved ? "" : "opacity-50"}`}
                title="Profil"
              >
                {profile.avatar_path ? (
                  <img
                    src={getAvatarOrDefaultUrl(profile.avatar_path)}
                    alt="Avatar"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <User size={20} />
                )}
              </button>
            </>
          )}
          {profile ? (
            <button
              onClick={() => logout()}
              className="hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:flex sm:items-center sm:gap-1"
              title="Keluar"
            >
              <LogOut size={18} />
              <span className="hidden text-sm sm:inline">Keluar</span>
              <span className="hidden sm:inline text-xs text-slate-500">({profile.username})</span>
            </button>
          ) : (
            <button
              onClick={() => onTabChange("login")}
              className="hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:flex sm:items-center sm:gap-1"
              title="Masuk"
            >
              <LogIn size={18} />
              <span className="hidden text-sm sm:inline">Masuk</span>
            </button>
          )}
          <button
            onClick={() => onTabChange("cart")}
            className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                active === item.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
          {roleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                active === item.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <item.icon size={14} className="inline mr-1" />
              {item.label}
            </button>
          ))}
          {profile ? (
            <button
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Keluar
            </button>
          ) : (
            <button
              onClick={() => {
                onTabChange("login");
                setMobileOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Masuk / Daftar
            </button>
          )}
        </div>
      )}
    </header>
  );
}
