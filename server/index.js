import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const COOKIE_NAME = process.env.COOKIE_NAME || "tokoryan_token";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const allowedOrigins = new Set([CLIENT_URL]);

// Origin tambahan untuk deployment online (pisahkan dengan koma).
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .forEach((o) => allowedOrigins.add(o));
}

try {
  const u = new URL(CLIENT_URL);
  if (u.hostname === "localhost") {
    u.hostname = "127.0.0.1";
    allowedOrigins.add(u.origin);
  } else if (u.hostname === "127.0.0.1") {
    u.hostname = "localhost";
    allowedOrigins.add(u.origin);
  }
} catch {
  // fallback: origin tidak valid, pakai CLIENT_URL saja
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

/**
 * Deteksi koneksi HTTPS secara dinamis agar cookie JWT tidak ditolak browser
 * saat online (HTTPS) maupun di laptop (HTTP / localhost).
 * - COOKIE_SECURE=true|false memaksa nilai secara eksplisit.
 * - Di balik reverse proxy / Cloudflare, header x-forwarded-proto === "https".
 * - Di localhost HTTP tidak ada header tersebut (atau req.secure false) → secure=false.
 */
function isSecureRequest(req) {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return req.headers["x-forwarded-proto"] === "https" || req.secure;
}

function cookieOptions(req) {
  return {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "lax",
    path: "/",
  };
}

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi." });
  }

  const { data: profile, error: supabaseError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (supabaseError || !profile) {
    return res.status(401).json({ error: "Username atau password salah." });
  }

  if (profile.approved === false) {
    return res.status(403).json({
      error: "Akun Anda belum disetujui oleh admin. Silakan hubungi administrator.",
    });
  }

  const token = jwt.sign(
    {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name ?? null,
      role: profile.role,
      requested_role: profile.requested_role,
      approved: profile.approved,
      avatar_path: profile.avatar_path ?? null,
      bio: profile.bio ?? null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions(req),
    maxAge: 15 * 60 * 1000,
  });

  res.json({
    message: "Login berhasil.",
    user: {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name ?? null,
      role: profile.role,
      requested_role: profile.requested_role,
      approved: profile.approved,
      avatar_path: profile.avatar_path ?? null,
      bio: profile.bio ?? null,
      created_at: profile.created_at ?? null,
    },
    token,
  });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions(req));

  res.json({ message: "Logout berhasil." });
});

app.get("/api/me", (req, res) => {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Tidak terautentikasi." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: payload });
  } catch {
    res.clearCookie(COOKIE_NAME, cookieOptions(req));
    res.status(401).json({ error: "Token tidak valid atau kadaluarsa." });
  }
});

app.listen(PORT, () => {
  console.log(`Server JWT auth berjalan di http://localhost:${PORT}`);
});
