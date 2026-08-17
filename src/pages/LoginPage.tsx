import { useState } from "react";
import { Eye, EyeOff, User, Lock, ShoppingBag, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Tab } from "@/components/Navbar";

export function LoginPage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const { error } = await login(username, password);
    if (error) {
      setErrorMsg(error);
    } else {
      onTabChange("home");
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
          Masuk ke akun Anda
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <button
            onClick={() => onTabChange("register")}
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Daftar sekarang
          </button>
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                placeholder="Masukkan kata sandi"
                required
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
