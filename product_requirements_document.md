# Product Requirements Document (PRD)
**Nama Produk:** HafalTrack (Sistem Kartu Kontrol Hafalan Mobile)
**Versi:** 1.0.0
**Platform:** Mobile (Android & iOS)

## 1. Ringkasan Eksekutif
HafalTrack adalah aplikasi mobile lintas platform (Android & iOS) yang berfungsi sebagai digitalisasi buku/kartu kontrol hafalan (Al-Qur'an atau materi akademik lainnya). Aplikasi ini menghubungkan Pengajar dan Orang Tua secara kolaboratif untuk memantau, mencatat, dan mengevaluasi perkembangan hafalan santri/siswa. Fitur utama aplikasi ini adalah memungkinkan input dua arah, baik dari Pengajar di sekolah maupun Orang Tua di rumah.

## 2. Target Teknologi (Tech Stack)
Mengingat kebutuhan aplikasi mobile lintas platform dengan keahlian Vue.js, berikut adalah stack yang direkomendasikan:
*   **Frontend Mobile:** Vue.js 3 (Composition API) + Ionic Framework / Quasar Framework.
*   **State Management:** Pinia.
*   **Backend / API:** Node.js (NestJS atau Express.js) / Laravel.
*   **Database:** PostgreSQL.
*   **Authentication:** JWT (JSON Web Token) dengan Role-Based Access Control (RBAC).

## 3. Aktor & Hak Akses (User Roles)
Sistem ini menggunakan 3 peran utama dengan tingkat akses yang berbeda:
1.  **Admin:** Administrator sistem/sekolah yang mengelola master data dan operasional akun.
2.  **Pengajar (Ustadz/Guru):** Pihak sekolah yang membina kelas, menyimak hafalan (Ziyadah/Muroja'ah), dan memberikan evaluasi resmi.
3.  **Orang Tua (Wali Santri):** Pihak keluarga yang memantau hafalan anak dan dapat menyimak hafalan (Muroja'ah) saat anak berada di rumah.

## 4. Fitur Utama (Berdasarkan Role)

### 4.1. Role: Admin (Akses via Web Dashboard / Mobile Terbatas)
*   **Manajemen User (CRUD):** Mengelola akun Pengajar dan Orang Tua.
*   **Manajemen Master Data:**
    *   Data Santri / Siswa (mengatur relasi anak dan orang tua).
    *   Data Kelas / Halaqoh (mengatur relasi pengajar, kelas, dan santri).
    *   Katalog Materi (Daftar Surah, Juz, dan jumlah ayat).
*   **Laporan Global:** Melihat statistik progres hafalan seluruh sekolah.

### 4.2. Role: Pengajar (Akses via Mobile)
*   **Dashboard Pengajar:** Menampilkan jadwal hari ini, daftar kelas (halaqoh) yang diampu, dan daftar santri di dalamnya.
*   **Input Setoran Hafalan (Sekolah):**
    *   Memilih santri dari daftar kelas.
    *   Input jenis setoran: *Ziyadah* (Hafalan Baru) atau *Muroja'ah* (Pengulangan).
    *   Input batas hafalan: Pilihan Surah & rentang Ayat (Mulai - Selesai).
    *   Input Penilaian: Nilai (A/B/C/D) dan Catatan/Feedback.
*   **Review Setoran Rumah:** Melihat daftar inputan hafalan yang dilakukan oleh Orang Tua, dengan opsi untuk melakukan "Verifikasi/Approve" (opsional) atau sekadar *read-only*.
*   **Riwayat Kelas:** Melihat histori setoran hafalan seluruh santri binaannya.

### 4.3. Role: Orang Tua (Akses via Mobile)
*   **Dashboard Anak:** Menampilkan profil anak. Mendukung *Multiple Children* (jika memiliki lebih dari 1 anak di sekolah yang sama, orang tua bisa *switch* profil anak).
*   **Input Setoran Hafalan Mandiri (Rumah):**
    *   Fitur bagi orang tua untuk menjadi "penyimak" saat anak mengulang hafalan di rumah.
    *   Input jenis setoran (Dibatasi hanya *Muroja'ah*).
    *   Input batas hafalan (Surah dan rentang Ayat).
    *   Input catatan subjektif orang tua terkait kelancaran anak.
*   **Log Kartu Kontrol Terpadu:** Melihat histori setoran secara kronologis (Feed). Terdapat *badge* atau warna khusus untuk membedakan setoran di Sekolah (oleh Pengajar) vs setoran di Rumah (oleh Orang Tua).
*   **Push Notification:** Mendapatkan notifikasi real-time jika Pengajar baru saja menginput setoran/nilai anak di sekolah.
*   **Grafik Perkembangan:** Visualisasi sederhana progres hafalan anak (misal: persentase juz yang diselesaikan).

## 5. Alur Kerja (User Flow) Utama
1.  **Inisialisasi:** Admin mendaftarkan akun Orang Tua, Pengajar, dan menempatkan Santri ke dalam Kelas yang diampu oleh Pengajar tertentu.
2.  **Sesi Sekolah (Pengajar):** Pengajar membuka aplikasi, masuk ke menu Kelas, memilih nama Santri "A". Pengajar menginput setoran Ziyadah (contoh: Al-Baqarah ayat 1-10) dengan nilai A. Sistem menyimpan ke database.
3.  **Notifikasi:** Orang tua Santri "A" menerima Push Notification bahwa anaknya telah menyetorkan hafalan di sekolah.
4.  **Sesi Rumah (Orang Tua):** Malam harinya, Santri "A" mengulang hafalan di depan orang tuanya. Orang tua membuka aplikasi, menekan tombol "Tambah Setoran Rumah", menginput Muroja'ah (Al-Baqarah ayat 1-10), dan menyimpan.
5.  **Sinkronisasi:** Keesokan harinya, Pengajar dapat melihat di profil Santri "A" bahwa anak tersebut telah melakukan Muroja'ah di rumah semalam.