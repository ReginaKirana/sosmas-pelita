# 👶 PELITA Cibelok - Sistem Digitalisasi Posyandu

Sistem Informasi Pencatatan Data Balita Posyandu (PELITA) Desa Cibelok. Aplikasi ini dibangun untuk mendigitalisasi pencatatan data pertumbuhan balita (Berat Badan, Tinggi Badan, Lingkar Kepala) yang sebelumnya dilakukan secara manual oleh para kader Posyandu.

Aplikasi ini mencakup dua sisi pengguna:
1. **Portal Orang Tua (Publik)**: Orang tua dapat melihat grafik pertumbuhan anaknya secara *real-time* dan mencetak laporan tumbuh kembang.
2. **Dasbor Kader (Admin)**: Kader dapat mencatat, mengedit, dan mengimpor ratusan data balita sekaligus menggunakan Microsoft Excel dengan pintar.

---

## ✨ Fitur Utama

- **Import Excel Pintar**: Kader dapat mengimpor data dari Excel. Sistem akan otomatis mendeteksi jika data di bulan tersebut sudah ada, lalu melakukan *Update* tanpa membuat data ganda (*Duplicate*).
- **Kalkulasi Status Otomatis**: Menghitung secara otomatis status Berat Badan Balita (Naik, Turun, Tetap, Baru) secara berurutan dan kronologis.
- **Portal & Grafik Real-time**: Orang tua tidak perlu *login*. Cukup masukkan ID Balita, maka Grafik Garis (Berat & Tinggi) akan langsung tampil secara interaktif.
- **Generate Laporan Cetak (PDF)**: Mencetak laporan pertumbuhan dengan Kop Surat resmi, dilengkapi dengan kesimpulan yang di- *generate* otomatis oleh sistem.
- **Dasbor Statistik**: Tampilan memukau (*glassmorphism*) yang menyajikan statistik jumlah balita, status stunting, dan grafik *pie-chart* per wilayah Dusun.

## 🛠️ Teknologi yang Digunakan
- **Frontend**: React.js + Vite
- **Styling**: TailwindCSS (Full Custom UI, Non-Component Library)
- **Charts**: Recharts (Interactive Line & Pie Charts)
- **Backend / Database**: Supabase (PostgreSQL + REST API)
- **Deployment**: Vercel

## 🚀 Cara Menjalankan Secara Lokal

1. Pastikan Anda memiliki **Node.js** terinstal.
2. *Clone repository* ini:
   ```bash
   git clone https://github.com/ReginaKirana/sosmas-pelita.git
   cd sosmas-pelita
   ```
3. Instal dependencies:
   ```bash
   npm install
   ```
4. Buat file `.env` di *root folder* (jangan di-commit ke Git!) dan isi dengan konfigurasi Supabase Anda:
   ```env
   VITE_SUPABASE_URL=URL_SUPABASE_ANDA
   VITE_SUPABASE_ANON_KEY=ANON_KEY_SUPABASE_ANDA
   ```
5. Jalankan server lokal:
   ```bash
   npm run dev
   ```
6. Buka `http://localhost:5173` di *browser* Anda.

> **Petunjuk Login Admin Lokal:** Gunakan `admin@posyandu.com` / `admin123`.

## 📄 Struktur Database Pokok (Supabase)

- **Table `toddlers`**: Menyimpan biodata balita (ID, nama, tanggal lahir, nama ibu, jenis kelamin, dusun).
- **Table `measurements`**: Menyimpan rekam medis/ukur bulanan per balita (ID, *toddler_id*, *measurement_date*, berat, tinggi, lingkar kepala, dan status).

## 🔒 Keamanan
*File* `.env` telah dikecualikan menggunakan `.gitignore` untuk mencegah kebocoran *keys* API database ke publik. Pastikan **Row Level Security (RLS)** pada Supabase Anda telah dihidupkan untuk pengamanan tingkat Production.
