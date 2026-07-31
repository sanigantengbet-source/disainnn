# Vibe Extractor

Bertindaklah sebagai Senior Full-Stack Engineer, AI Prompt Architect, dan UI/UX Systems Expert yang sangat ahli dalam melakukan "vibe coding" dan pembuatan automated design extraction tools.



Saya ingin membangun aplikasi full-stack menggunakan **Next.js App Router**, **Tailwind CSS**, dan **React**. Aplikasi ini berfungsi sebagai tool untuk mengekstrak desain sistem, warna, tipografi, screenshot, dan struktur multi-halaman dari sebuah URL website secara programmatis (tanpa menggunakan AI, murni berbasis DOM Scraping dan computed styles nyata dari website target).



---



### 🎯 Tujuan Utama (Core Objective):

1. **Ekstraksi Nyata (Real Extraction):** Data warna (primary & neutral), tipografi scale (font-family, size, weight, line-height), dan elemen frontend yang ditampilkan **harus 100% akurat menyesuaikan data asli dari website target** yang di-input user. Tidak boleh menggunakan dummy data atau hardcoded style buatan AI.

2. **Vibe Coding Ready:** Hasil ekstraksi dari tool ini nantinya akan dijadikan pedoman *vibe coding* (gaya, skema warna, struktur UI) untuk mereplikasi atau merombak project web development selanjutnya.

3. **Multi-page Support Fungsional:** Terdapat toggle switch multi-page pada form input. Jika diaktifkan, backend harus mendeteksi link internal dari domain yang sama dan menyediakannya dalam bentuk navigasi tab interaktif yang berfungsi dengan normal.



---



### 🛠️ Tech Stack & Konfigurasi Teknis:

- **Framework:** Next.js (App Router / direktori `app/`).

- **Styling:** Tailwind CSS + custom dark mode theme (nuansa gelap modern ala Vercel/Design.md, border tipis, card minimalis).

- **Backend Route Handler:** `app/api/extract/route.js` yang memanfaatkan `puppeteer-core` dan `@sparticuz/chromium` agar siap di-deploy ke Vercel tanpa kendala serverless timeout/binary error.



---



### 📂 Struktur & Spesifikasi Komponen yang Harus Dibuat:



1. **Halaman Utama (`app/page.js`):**

   - Form input URL bersih dengan placeholder modern.

   - Tombol toggle fungsional untuk **Multi-page support**.

   - State management untuk proses loading, error handling, dan render hasil ekstraksi secara interaktif.



2. **Backend Scraper (`app/api/extract/route.js`):**

   - Menerima request `POST` berupa `{ url, multiPage }`.

   - Meluncurkan headless browser, mengambil screenshot *above the fold*.

   - Mengekstrak computed styles (`window.getComputedStyle`) dari elemen DOM website target untuk mengumpulkan warna unik (dikonversi otomatis ke format HEX code) serta skala tipografi (`h1`, `h2`, `h3`, `p`, `span`, `button`, `a`).

   - Melakukan crawling link internal jika opsi `multiPage` bernilai `true`.

   - Mengembalikan data terstruktur berupa JSON ke frontend.



3. **Result View & Vibe Coding Panel:**

   - Tab navigasi format tampilan (`DESIGN.md`, `HTML Preview`).

   - Panel **Multi-page Tabs** interaktif untuk berpindah halaman hasil ekstraksi.

   - Grid kotak warna (Primary & Neutral) dengan kode HEX aslinya.

   - Tabel **Typography Scale** terstruktur yang menampilkan elemen, ukuran (*size*), ketebalan (*weight*), dan tinggi baris (*height*) sesuai website asli.



Tolong berikan kode lengkap, bersih, modular, dan bebas error untuk setiap file yang dibutuhkan agar aplikasi ini bisa langsung di-set

up, dijalankan, dan di-deploy ke Vercel.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/42b7873d-59ed-484e-a190-0603414647a1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
