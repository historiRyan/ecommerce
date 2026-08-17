import { useState, useEffect, useRef } from "react";
import { User, Save, Upload, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/data/productsApi";
import { getAvatarOrDefaultUrl } from "@/lib/supabase";
import type { Tab } from "@/components/Navbar";

export function ProfilePage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { profile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setAvatarUrl(getAvatarOrDefaultUrl(profile.avatar_path ?? null));
      setFullName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <User size={48} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Silakan masuk dulu</h1>
        <button
          onClick={() => onTabChange("login")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Masuk
        </button>
      </div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const result = await profileApi.uploadAvatar(profile.id, file);
      if (result) {
        setAvatarUrl(result.publicUrl);
        window.dispatchEvent(new CustomEvent("profile:updated"));
      }
    } catch (e) {
      console.error("Upload avatar gagal:", (e as Error).message);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    if (!profile.avatar_path) return;
    if (!window.confirm("Hapus foto profil ini?")) return;
    setUploading(true);
    try {
      await profileApi.removeAvatar(profile.id, profile.avatar_path);
      setAvatarUrl("");
      window.dispatchEvent(new CustomEvent("profile:updated"));
    } catch (e) {
      console.error("Hapus avatar gagal:", (e as Error).message);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile(profile.id, {
        full_name: fullName || null,
        bio: bio || null,
      });
      window.dispatchEvent(new CustomEvent("profile:updated"));
    } catch (e) {
      console.error("Simpan profil gagal:", (e as Error).message);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => onTabChange("home")}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          title="Kembali ke beranda"
        >
          <X size={18} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Profil Saya
        </h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar profil"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-slate-100 text-slate-400 ring-2 ring-white shadow">
                <User size={32} />
              </div>
            )}
            <label
              className={`absolute bottom-0 right-0 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-indigo-600 text-white shadow transition-colors hover:bg-indigo-500 ${uploading ? "cursor-wait opacity-60" : ""}`}
              title="Ganti foto profil"
            >
              <Upload size={15} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            {profile.avatar_path && !uploading && (
              <button
                onClick={handleRemoveAvatar}
                title="Hapus foto profil"
                className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-rose-600 text-white shadow hover:bg-rose-500"
              >
                <X size={10} />
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Nama pengguna
              </label>
              <p className="mt-1 text-sm font-medium text-slate-900">{profile.username}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Nama lengkap</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan tentang diri Anda"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Peran:{" "}
                <span className="font-medium text-slate-700">
                  {profile.role === "admin" ? "Admin" : profile.role === "toko" ? "Toko" : profile.role === "courier" ? "Kurir" : "Customer"}
                </span>
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${profile.approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {profile.approved ? "Disetujui" : "Menunggu persetujuan"}
              </span>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : <><Save size={16} /> Simpan profil</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
