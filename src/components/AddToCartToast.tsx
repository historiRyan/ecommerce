import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function AddToCartToast() {
  const { lastAdded, clearLastAdded } = useCart();

  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(() => clearLastAdded(), 2500);
    return () => clearTimeout(t);
  }, [lastAdded, clearLastAdded]);

  if (!lastAdded) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 animate-[slideUp_0.25s_ease-out]">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg shadow-slate-900/10">
        <CheckCircle2 size={20} className="text-emerald-600" />
        <div className="text-sm">
          <p className="font-semibold text-slate-900">Ditambahkan ke keranjang</p>
          <p className="text-slate-500">{lastAdded.name}</p>
        </div>
        <button
          onClick={clearLastAdded}
          className="ml-2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
