import { useState } from "react";
import { User, Lock, Eye, EyeOff, ShoppingBag, ArrowRight, CheckCircle2, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Tab } from "@/components/Navbar";

export function RegisterPage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<"customer" | "toko" | "courier">("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await register(username, password, requestedRole);
    if (error) {
      setErrorMsg(error);
    } else {
      setSuccessMsg(
        requestedRole === "customer"
          ? "Pendaftaran berhasil! Anda sudah masuk sebagai customer."
          : `Pendaftaran ${requestedRole === "toko" ? "toko" : "kurir"} berhasil! Akun Anda menunggu persetujuan dari admin.`
      );
      setTimeout(() => onTabChange(requestedRole === "customer" ? "home" : "login"), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
            <ShoppingBag size={26} />
          </span>
          <span className="text-3xl font-bold">
            Toko<span className="text-indigo-600">Ryan</span>.
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-center">
          Buat akun baru
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <button
            onClick={() => onTabChange("login")}
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Masuk
          </button>
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Nama pengguna
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan nama pengguna"
                required
                minLength={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Kata sandi
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Daftar sebagai
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="requestedRole"
                  value="customer"
                  checked={requestedRole === "customer"}
                  onChange={() => setRequestedRole("customer")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Customer (langsung aktif)</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="requestedRole"
                  value="toko"
                  checked={requestedRole === "toko"}
                  onChange={() => setRequestedRole("toko")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Toko (perlu persetujuan admin)</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="requestedRole"
                  value="courier"
                  checked={requestedRole === "courier"}
                  onChange={() => setRequestedRole("courier")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Kurir (perlu persetujuan admin)</span>
              </label>
            </div>
            {requestedRole === "toko" && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                <Truck size={14} className="mt-0.5 flex-shrink-0" />
                Akun toko akan ditinjau dan disetujui oleh admin sebelum dapat digunakan untuk login dan mengelola produk.
              </p>
            )}
            {requestedRole === "courier" && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                <Truck size={14} className="mt-0.5 flex-shrink-0" />
                Akun kurir akan ditinjau dan disetujui oleh admin sebelum dapat digunakan untuk login dan mengelola pengiriman.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Daftar"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
