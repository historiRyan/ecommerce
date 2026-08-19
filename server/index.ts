import jwt, { SignOptions } from "jsonwebtoken";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface Config {
  jwtSecret: string;
  jwtExpiresIn: SignOptions["expiresIn"];
  cookieName: string;
  clientUrl: string;
  cookieSecure: string;
  allowedOrigins: Set<string>;
}

interface CookieOpts {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none" | string;
  maxAge?: number;
}

interface Profile {
  id: string;
  username: string;
  password: string;
  role: string;
  requested_role: string;
  approved: boolean;
  full_name?: string | null;
  avatar_path?: string | null;
  bio?: string | null;
  created_at?: string | null;
}

interface TokenPayload {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
  requested_role: string;
  approved: boolean;
  avatar_path: string | null;
  bio: string | null;
  iat?: number;
  exp?: number;
}

let _config: Config | null = null;
let _supabase: SupabaseClient | null = null;

function initConfig(env: Record<string, string | undefined>): Config {
  if (_config) return _config;

  const src = env || process.env;

  const jwtSecret = src.JWT_SECRET || "fallback_secret_change_me";
  const jwtExpiresIn = (src.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
  const cookieName = src.COOKIE_NAME || "tokoryan_token";
  const clientUrl = src.CLIENT_URL || "http://localhost:5173";
  const cookieSecure = src.COOKIE_SECURE || "";

  const allowedOrigins = new Set<string>([clientUrl]);
  if (src.ALLOWED_ORIGINS) {
    src.ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => allowedOrigins.add(o));
  }

  try {
    const u = new URL(clientUrl);
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
      allowedOrigins.add(u.origin);
    } else if (u.hostname === "127.0.0.1") {
      u.hostname = "localhost";
      allowedOrigins.add(u.origin);
    }
  } catch {
    // fallback: origin tidak valid, pakai clientUrl saja
  }

  _config = {
    jwtSecret,
    jwtExpiresIn,
    cookieName,
    clientUrl,
    cookieSecure,
    allowedOrigins,
  };

  const supabaseUrl = src.SUPABASE_URL || "";
  const supabaseKey = src.SUPABASE_ANON_KEY || "";
  if (supabaseUrl && supabaseKey) {
    _supabase = createClient(supabaseUrl, supabaseKey);
  }

  return _config;
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((c) => {
    const i = c.indexOf("=");
    if (i > 0) {
      const name = c.slice(0, i).trim();
      const value = decodeURIComponent(c.slice(i + 1).trim());
      cookies[name] = value;
    }
  });
  return cookies;
}

function buildCookie(name: string, value: string, opts: CookieOpts): string {
  let s = `${name}=${value}`;
  s += `; Path=${opts.path || "/"}`;
  if (opts.httpOnly !== false) s += "; HttpOnly";
  if (opts.secure) s += "; Secure";
  s += `; SameSite=${opts.sameSite || "lax"}`;
  if (opts.maxAge) s += `; Max-Age=${Math.floor(opts.maxAge / 1000)}`;
  return s;
}

function cookieOptsForRequest(request: Request, config: Config): CookieOpts {
  const secure =
    config.cookieSecure === "true" ||
    (config.cookieSecure !== "false" &&
      request.headers.get("x-forwarded-proto") === "https");

  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  };
}

function corsHeaders(
  request: Request,
  origins: Set<string>
): Record<string, string> {
  const origin = request.headers.get("origin");
  if (origin && origins.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
    };
  }
  return {};
}

function jsonResponse(
  data: unknown,
  status: number | undefined,
  request: Request,
  origins: Set<string>,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request, origins),
      ...extraHeaders,
    },
  });
}

async function handleRequest(
  request: Request,
  env: Record<string, string | undefined>
): Promise<Response> {
  const config = initConfig(env);
  const supabase = _supabase;

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders(request, config.allowedOrigins),
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    if (!supabase) {
      return jsonResponse(
        { error: "Supabase client belum diinisialisasi." },
        500,
        request,
        config.allowedOrigins
      );
    }

    if (path === "/api/login" && method === "POST") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonResponse(
          { error: "Request body harus berupa JSON yang valid." },
          400,
          request,
          config.allowedOrigins
        );
      }
      const { username, password } = body as { username?: string; password?: string };

      if (!username || !password) {
        return jsonResponse(
          { error: "Username dan password wajib diisi." },
          400,
          request,
          config.allowedOrigins
        );
      }

      const { data: profile, error: supabaseError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

      if (supabaseError || !profile) {
        return jsonResponse(
          { error: "Username atau password salah." },
          401,
          request,
          config.allowedOrigins
        );
      }

      const typedProfile = profile as Profile;

      if (typedProfile.approved === false) {
        return jsonResponse(
          {
            error: "Akun Anda belum disetujui oleh admin. Silakan hubungi administrator.",
          },
          403,
          request,
          config.allowedOrigins
        );
      }

      const token = jwt.sign(
        {
          id: typedProfile.id,
          username: typedProfile.username,
          full_name: typedProfile.full_name ?? null,
          role: typedProfile.role,
          requested_role: typedProfile.requested_role,
          approved: typedProfile.approved,
          avatar_path: typedProfile.avatar_path ?? null,
          bio: typedProfile.bio ?? null,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      const opts = cookieOptsForRequest(request, config);
      opts.maxAge = 15 * 60 * 1000;

      return jsonResponse(
        {
          message: "Login berhasil.",
          user: {
            id: typedProfile.id,
            username: typedProfile.username,
            full_name: typedProfile.full_name ?? null,
            role: typedProfile.role,
            requested_role: typedProfile.requested_role,
            approved: typedProfile.approved,
            avatar_path: typedProfile.avatar_path ?? null,
            bio: typedProfile.bio ?? null,
            created_at: typedProfile.created_at ?? null,
          },
          token,
        },
        200,
        request,
        config.allowedOrigins,
        { "Set-Cookie": buildCookie(config.cookieName, token, opts) }
      );
    }

    if (path === "/api/logout" && method === "POST") {
      const opts = cookieOptsForRequest(request, config);
      opts.maxAge = 0;

      return jsonResponse(
        { message: "Logout berhasil." },
        200,
        request,
        config.allowedOrigins,
        { "Set-Cookie": buildCookie(config.cookieName, "", opts) }
      );
    }

    if (path === "/api/me" && method === "GET") {
      const cookies = parseCookies(request.headers.get("cookie"));
      const token = cookies[config.cookieName];

      if (!token) {
        return jsonResponse(
          { error: "Tidak terautentikasi." },
          401,
          request,
          config.allowedOrigins
        );
      }

      try {
        const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
        return jsonResponse({ user: payload }, 200, request, config.allowedOrigins);
      } catch {
        const opts = cookieOptsForRequest(request, config);
        opts.maxAge = 0;

        return jsonResponse(
          { error: "Token tidak valid atau kadaluarsa." },
          401,
          request,
          config.allowedOrigins,
          { "Set-Cookie": buildCookie(config.cookieName, "", opts) }
        );
      }
    }

    return jsonResponse({ error: "Not found" }, 404, request, config.allowedOrigins);
  } catch {
    return jsonResponse(
      { error: "Internal server error" },
      500,
      request,
      config.allowedOrigins
    );
  }
}

export { handleRequest };

export default {
  async fetch(
    request: Request,
    env: Record<string, string | undefined>
  ): Promise<Response> {
    return handleRequest(request, env);
  },
};
