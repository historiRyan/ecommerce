import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, Role } from "@/data/profile";

const JWT_AUTH_BASE_URL = import.meta.env.VITE_JWT_AUTH_URL || "http://localhost:4000";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

interface JwtUser {
  id: string;
  username: string;
  role: string;
  requested_role: string;
  approved: boolean;
  full_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  created_at: string | null;
}

interface JwtLoginResponse {
  message: string;
  user: JwtUser;
  token: string;
}

interface JwtErrorResponse {
  error: string;
}

type AuthContextValue = {
  profile: Profile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error: string | null }>;
  register: (
    username: string,
    password: string,
    requestedRole?: Role
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "tokorayn_session";
const LEGACY_JWT_KEY = "jwt_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem(LEGACY_JWT_KEY);
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
    let res: Response;
    try {
      res = await fetch(`${JWT_AUTH_BASE_URL}/api/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      return { error: "Tidak dapat menghubungi server auth. Pastikan backend JWT berjalan." };
    }

    const data = await res.json();

    if (!res.ok) {
      return { error: (data as JwtErrorResponse).error ?? "Username atau password salah." };
    }

    const { user } = data as JwtLoginResponse;
    const p: Profile = {
      id: user.id,
      username: user.username,
      password: "",
      role: user.role as Role,
      requested_role: user.requested_role as Role,
      approved: user.approved,
      full_name: user.full_name ?? null,
      bio: user.bio ?? null,
      avatar_path: user.avatar_path ?? null,
      created_at: user.created_at ?? undefined,
    };

    localStorage.removeItem(LEGACY_JWT_KEY);
    localStorage.setItem(SESSION_KEY, JSON.stringify(p));
    setProfile(p);
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

      localStorage.setItem(SESSION_KEY, JSON.stringify(p));
      setProfile(p);
      return { error: null };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${JWT_AUTH_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // abaikan error jaringan, tetap clear state klien
    }
    setProfile(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_JWT_KEY);
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
