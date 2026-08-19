import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

let _config = null;
let _supabase = null;

function initConfig(env) {
  if (_config) return _config;

  const src = env || process.env;

  const jwtSecret = src.JWT_SECRET || "fallback_secret_change_me";
  const jwtExpiresIn = src.JWT_EXPIRES_IN || "15m";
  const cookieName = src.COOKIE_NAME || "tokoryan_token";
  const clientUrl = src.CLIENT_URL || "http://localhost:5173";
  const cookieSecure = src.COOKIE_SECURE || "";

  const allowedOrigins = new Set([clientUrl]);
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

function parseCookies(cookieHeader) {
  const cookies = {};
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

function buildCookie(name, value, opts) {
  let s = `${name}=${value}`;
  s += `; Path=${opts.path || "/"}`;
  if (opts.httpOnly !== false) s += "; HttpOnly";
  if (opts.secure) s += "; Secure";
  s += `; SameSite=${opts.sameSite || "lax"}`;
  if (opts.maxAge) s += `; Max-Age=${Math.floor(opts.maxAge / 1000)}`;
  return s;
}

function cookieOptsForRequest(request, config) {
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

function corsHeaders(request, origins) {
  const origin = request.headers.get("origin");
  if (origin && origins.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
    };
  }
  return {};
}

function jsonResponse(data, status, request, origins, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request, origins),
      ...extraHeaders,
    },
  });
}

async function handleRequest(request, env) {
  const config = initConfig(env);
  const supabase = _supabase;

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, config.allowedOrigins) });
  }

  try {
    if (path === "/api/login" && method === "POST") {
      let body;
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
      const { username, password } = body;

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

      if (profile.approved === false) {
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
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name ?? null,
          role: profile.role,
          requested_role: profile.requested_role,
          approved: profile.approved,
          avatar_path: profile.avatar_path ?? null,
          bio: profile.bio ?? null,
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
        const payload = jwt.verify(token, config.jwtSecret);
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
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
