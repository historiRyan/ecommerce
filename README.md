# 🛒 E-Commerce React App

Aplikasi e-commerce modern dengan **React JS (Vite)**, **Tailwind CSS**, dan **Supabase**.

🔗 **Live Demo:** [[https://pages.dev]](https://ecommerce-5w8.pages.dev/)

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

3. **Buat file `.env.local`** di root proyek dan salin isi berikut:
   ```env
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_JWT_AUTH_URL=http://localhost:4000
   ```

   > Ganti dengan nilai sebenarnya dari **Project Settings > API** pada [supabase.com](https://supabase.com).

4. **Jalankan development server:**
   ```bash
   npm run dev
   ```

   Buka `http://localhost:5173` di browser.

---

## 🔎 Tampilan Aplikasi

![Screenshot Home 1](./src/assets/github.png)
![Screenshot Home 2](./src/assets/github2.png)

---

## ⚠️ Keamanan

**Jangan pernah mengunggah file `.env.local` (atau file env apa pun yang berisi token asli) ke GitHub.**

<<<<<<< HEAD
Pastikan `.env*` (termasuk `.env.local`) ada di dalam `.gitignore`.
=======
Pastikan `.env*` (termemasuk `.env.local`) ada di dalam `.gitignore`.

---

## 🔐 JWT Auth (HttpOnly Cookie)

Backend **Node.js + Express** berada di folder `server/`. Sistem ini memakai **JWT** yang disimpan dalam **HttpOnly Cookie** sehingga tidak terpapar ke serangan XSS.

### Backend

1. Masuk ke folder `server` dan install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Salin `.env` dan sesuaikan `JWT_SECRET` (gunakan nilai acak yang panjang di produksi):
   ```bash
   cp .env .env.local   # atau edit .env langsung
   ```

3. Jalankan server (port default `4000`):
   ```bash
   npm run dev
   ```

#### API Endpoints

| Method | Endpoint       | Deskripsi                                                                 |
|--------|----------------|---------------------------------------------------------------------------|
| `POST` | `/api/login`   | Validasi kredensial, kirim JWT (`tokoryan_token`) sebagai HttpOnly cookie + token di body |
| `POST` | `/api/logout`  | Hapus HttpOnly cookie `tokoryan_token`                                   |
| `GET`  | `/api/me`      | Baca cookie, verifikasi JWT, kembalikan data user                         |

#### CORS

Server menggunakan `credentials: true`. Origin yang diizinkan adalah `CLIENT_URL` (default `http://localhost:5173`) **beserta cermin `localhost`↔`127.0.0.1`**-nya, sehingga cookie dapat dikirim lintas origin yang berbeda baik saat akses via `localhost` maupun `127.0.0.1` (contoh: banner Vite yang menampilkan `127.0.0.1`). Origin yang tidak dikenali akan ditolak.

#### Konfigurasi Cookie

| Properti    | Nilai      | Keterangan                          |
|-------------|------------|-------------------------------------|
| Name        | `tokoryan_token` | Di-config via env `COOKIE_NAME`   |
| `httpOnly`  | `true`     | Dilindungi dari akses JavaScript    |
| `secure`    | `false`    | Untuk development (localhost)         |
| `sameSite`  | `"lax"`    | Mengizinkan pengiriman cross-site     |
| `maxAge`    | `900000`   | 15 menit                            |
| `path`      | `"/"`      | Berlaku untuk seluruh path          |

#### Cleanup Local Storage

Profil pengguna yang dikembalikan oleh backend JWT disimpan di `localStorage` sebagai `tokorayn_session`. Saat login atau logout, session lama di `localStorage` otomatis ditimpa/dihapus bersamaan dengan cookie HttpOnly.

#### Akun demo

Akun di bawah di-seed pada migrasi `20260810000000_profiles.sql` (password disimpan plaintext di DB untuk demo ini).

| Username  | Password   | Role       | Keterangan                       |
|-----------|------------|------------|----------------------------------|
| `admin`   | `admin`    | admin      | Bisa akses panel admin           |
| `toko`    | `toko`     | toko       | Bisa upload & kelola produk      |
| `courier` | `courier`  | courier    | Bisa kelola pengiriman           |

### Frontend

- Logika otentikasi JWT ada di `src/context/AuthContext.tsx` — fungsi `login`/`logout` mengirimkan request ke backend dengan `credentials: "include"` agar cookie HttpOnly dikirim otomatis lintas origin.
- Form login website (`src/pages/LoginPage.tsx`) sudah terhubung langsung ke sistem JWT melalui `AuthContext`, sehingga login standar aplikasi memakai backend JWT.
- Pastikan variabel `VITE_JWT_AUTH_URL` ada di `.env.local` (default: `http://localhost:4000`).
- Tidak ada lagi halaman dashboard terpisah; token JWT tidak disimpan di `localStorage` melainkan hanya di **HttpOnly Cookie** yang dikelola browser.

#### Cara pakai dari dalam aplikasi

1. Pastikan backend JWT berjalan (`npm run dev` di folder `server`).
2. Buka aplikasi frontend (`npm run dev` di root).
3. Buka halaman login (`http://localhost:5173`) dan login dengan kredensial di bawah.
4. Setelah login berhasil, cek **Inspect → Application → Cookies** — cookie `tokoryan_token` (HttpOnly, SameSite=Lax) akan muncul.
5. Profil pengguna disimpan di `localStorage` sebagai `tokorayn_session` untuk keperluan tampilan navbar/akses rol.
>>>>>>> e0b1879 (fitur: integrasi penuh jwt httponly cookie dan sistem logout aman)

---

## 📖 Lisensi

Proyek ini dilisensikan di bawah lisensi MIT.
