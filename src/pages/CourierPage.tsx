import { useEffect, useState } from "react";
import { Truck, Package, MapPin } from "lucide-react";
import { shipmentsApi, ordersApi } from "@/data/productsApi";
import { useAuth } from "@/context/AuthContext";
import type { Tab } from "@/components/Navbar";

type ShipmentRow = {
  id: string;
  order_id: string;
  courier_id: string | null;
  toko_id: string | null;
  status: "pending_toko_approve" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled";
  tracking_notes: string | null;
  assigned_at: string | null;
  picked_at: string | null;
  delivered_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type OrderRow = {
  id: string;
  customer_id: string | null;
  toko_id: string | null;
  total_amount: number;
  status: string;
  shipping_address: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const statusLabel: Record<ShipmentRow["status"], string> = {
  pending_toko_approve: "Menunggu Approval Toko",
  assigned: "Di-assign",
  picked_up: "Diambil",
  in_transit: "Dalam Perjalanan",
  delivered: "Sampai",
  cancelled: "Dibatalkan",
};

export function CourierPage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { profile, logout } = useAuth();
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [ordersMap, setOrdersMap] = useState<Map<string, OrderRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [shipData, orderData] = await Promise.all([
        shipmentsApi.listAll(),
        ordersApi.listAll(),
      ]);
      setShipments((shipData ?? []) as ShipmentRow[]);
      const oMap = new Map<string, OrderRow>((orderData ?? []).map((o) => [o.id, o]));
      setOrdersMap(oMap);
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
    setLoading(false);
  };

  const myShipments = shipments.filter((s) => s.courier_id === profile?.id);

  const handleStatusUpdate = async (shipmentId: string, status: ShipmentRow["status"]) => {
    setActionId(shipmentId);
    setErrorMsg(null);
    try {
      const notes = notesInput[shipmentId] ?? "";
      await shipmentsApi.updateStatus(shipmentId, status, notes || undefined);
      setNotesInput((prev) => ({ ...prev, [shipmentId]: "" }));
      await fetchData();
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
    setActionId(null);
  };

  if (profile?.role !== "courier") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <Truck size={48} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Akses ditolak</h1>
        <p className="mt-2 text-slate-600">Halaman ini hanya tersedia untuk kurir.</p>
        <button
          onClick={() => onTabChange("home")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Kembali ke beranda
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel Kurir</h1>
            <p className="mt-1 text-sm text-slate-500">
              Selamat datang, <strong>{profile?.username}</strong>. Kelola pengiriman Anda.
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Keluar
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Pengiriman Saya ({myShipments.length})
        </h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Memuat pengiriman...</p>
      ) : myShipments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <Truck size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Belum ada pengiriman yang di-assign ke Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myShipments.map((s) => {
            const order = ordersMap.get(s.order_id);
            return (
              <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100">
                      <Package size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Order #{s.order_id.slice(0, 8)}...
                      </h3>
                      {order && (
                        <p className="mt-1 text-sm text-slate-600">
                          Total:{" "}
                          <span className="font-medium">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            }).format(Number(order.total_amount))}
                          </span>
                        </p>
                      )}
                      {order?.shipping_address && (
                        <div className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                          <span>{order.shipping_address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.status === "delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : s.status === "in_transit"
                        ? "bg-blue-100 text-blue-800"
                        : s.status === "picked_up"
                        ? "bg-indigo-100 text-indigo-800"
                        : s.status === "assigned"
                        ? "bg-purple-100 text-purple-800"
                        : s.status === "cancelled"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {statusLabel[s.status]}
                  </span>
                </div>

                {s.tracking_notes && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">
                    <strong>Catatan:</strong> {s.tracking_notes}
                  </div>
                )}

                <div className="mt-4 flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={notesInput[s.id] ?? ""}
                      onChange={(e) =>
                        setNotesInput((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      placeholder="Tambah catatan (opsional)"
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.status !== "picked_up" && s.status !== "delivered" && s.status !== "cancelled" && (
                      <button
                        onClick={() => handleStatusUpdate(s.id, "picked_up")}
                        disabled={actionId === s.id}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                      >
                        Diambil
                      </button>
                    )}
                    {s.status === "picked_up" && (
                      <button
                        onClick={() => handleStatusUpdate(s.id, "in_transit")}
                        disabled={actionId === s.id}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                      >
                        Dalam Perjalanan
                      </button>
                    )}
                    {(s.status === "in_transit" || s.status === "picked_up") && (
                      <button
                        onClick={() => handleStatusUpdate(s.id, "delivered")}
                        disabled={actionId === s.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        Sampai
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
