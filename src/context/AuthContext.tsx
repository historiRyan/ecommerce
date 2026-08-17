import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, Role } from "@/data/profile";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

type AuthContextValue = {
  profile: Profile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error: string | null }>;
  register: (
    username: string,
    password: string,
    requestedRole?: Role
  ) => Promise<{ error: string | null }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "tokorayn_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Profile;
        setProfile(parsed);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error) {
      return { error: "Username atau password salah." };
    }

    const p = data as Profile;
    if (p.approved === false) {
      return {
        error: "Akun Anda belum disetujui oleh admin. Silakan hubungi administrator.",
      };
    }

    setProfile(p);
    localStorage.setItem(SESSION_KEY, JSON.stringify(p));
    return { error: null };
  }, []);

  const register = useCallback(
    async (username: string, password: string, requestedRole: Role = "customer") => {
      const { data: existing, error: checkError } = await db
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (checkError) {
        return { error: checkError.message };
      }

      if (existing) {
        return { error: "Username sudah digunakan." };
      }

      const isApproved = requestedRole === "customer";
      const finalRole = requestedRole === "customer" ? "customer" : "toko";

      const { data, error } = await db
        .from("profiles")
        .insert({
          username,
          password,
          role: finalRole,
          requested_role: requestedRole,
          approved: isApproved,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      const p = data as Profile;
      if (!isApproved) {
        return {
          error: "Pendaftaran toko berhasil! Akun Anda menunggu persetujuan dari admin.",
        };
      }

      setProfile(p);
      localStorage.setItem(SESSION_KEY, JSON.stringify(p));
      return { error: null };
    },
    []
  );

  const logout = useCallback(() => {
    setProfile(null);
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event("auth:logout"));
  }, []);

  const value = useMemo(
    () => ({ profile, loading, login, register, logout }),
    [profile, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
