# 🛒 TokoRyan — E-Commerce Premium

Aplikasi e-commerce modern dengan **React (Vite) + TypeScript**, **Tailwind CSS**, dan **Supabase** sebagai backend. Mendukung multi-peran (admin, toko, kurir, customer), keranjang persisten, wishlist, checkout, hingga panel manajemen produk.

🔗 **Live Demo:** https://ecommerce-5w8.pages.dev/

---

## 🚀 Panduan Instalasi

1. **Clone repo:**
   ```bash
   git clone https://github.com/historiRyan/ecommerce.git
   cd ecommerce
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Buat file `.env.local`** di root proyek:
   ```env
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_JWT_AUTH_URL=http://localhost:4000
   ```
   Isi `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` dari **Project Settings → API** di [supabase.com](https://supabase.com).

4. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173` di browser.

---

## 🔐 JWT Auth (HttpOnly Cookie)

Backend berada di folder `server/` dan di-deploy sebagai **Cloudflare Worker** (native Worker, tanpa Express). Sistem memakai **JWT** yang disimpan dalam **HttpOnly Cookie** sehingga aman dari XSS.

### Endpoint
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/login` | Validasi kredensial, kirim JWT (`tokoryan_token`) sebagai HttpOnly cookie |
| `POST` | `/api/logout` | Hapus cookie |
| `GET` | `/api/me` | Verifikasi JWT, kembalikan data user |

**Production URL:** `https://ecommerce-jwt-auth-server.ryantrikurniawan16.workers.dev`

### Akun demo
Di-seed lewat migrasi `20260810000000_profiles.sql` (password plaintext, khusus demo).

| Username | Password | Role | Keterangan |
|----------|----------|------|------------|
| `admin` | `admin` | admin | Panel admin |
| `toko` | `toko` | toko | Upload & kelola produk |
| `courier` | `courier` | courier | Kelola pengiriman |

---

## 🚀 Deployment

Frontend: Cloudflare Pages (Git-connected ke `main`).
Backend: `cd server && npx wrangler deploy` (set `JWT_SECRET` sebagai secret).

---

## 📖 Lisensi
MIT.
