# HafalTrack

Sistem Kartu Kontrol Hafalan — Monorepo (Backend + Frontend).

## Struktur Folder

```
kartu/
├── README.md
├── .gitignore
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── kartu-kontrol.controller.ts
│   │   │   └── master.controller.ts
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── kartu-kontrol.service.ts
│   │   ├── utils/
│   │   │   ├── prisma.ts
│   │   │   ├── jwt.ts
│   │   │   ├── api-error.ts
│   │   │   └── async-handler.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.ts
    │   ├── components/
    │   │   ├── InputSetoranForm.vue
    │   │   ├── KartuKontrolCard.vue
    │   │   └── PilihAnakCard.vue
    │   ├── pages/
    │   │   ├── LoginPage.vue
    │   │   ├── admin/
    │   │   │   └── AdminDashboardPage.vue (placeholder)
    │   │   ├── pengajar/
    │   │   │   ├── DashboardPengajar.vue
    │   │   │   └── RiwayatKelasPage.vue
    │   │   └── orangtua/
    │   │       ├── DashboardAnak.vue
    │   │       ├── FeedHafalanPage.vue
    │   │       └── GrafikPerkembanganPage.vue
    │   ├── router/
    │   │   └── index.ts (guard by role)
    │   ├── stores/
    │   │   ├── index.ts
    │   │   ├── auth.ts
    │   │   └── hafalan.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── theme/
    │   │   └── tailwind.css
    │   ├── App.vue
    │   └── main.ts
    ├── capacitor.config.ts
    ├── ionic.config.json
    ├── tailwind.config.js
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json
```

## Tech Stack

| Layer | Teknologi |
|---|---|
| Mobile | Ionic (v8) + Vue 3 (Composition API), Pinia, Vue Router, Tailwind CSS |
| API | Node.js, Express.js, TypeScript |
| DB & ORM | PostgreSQL, Prisma |
| Auth | JWT + RBAC (ADMIN, PENGAJAR, ORANG_TUA) |

## Cara Menjalankan

### Prasyarat
- Node.js 18+
- PostgreSQL berjalan lokal

### 1. Backend (port 3000)

```bash
cd backend
cp .env.example .env          # sesuaikan DATABASE_URL
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### 2. Frontend (port 5173)

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev
```

Buka `http://localhost:5173`. Untuk build mobile:
```bash
npx cap add android / ios
npx cap sync
```

## Akun Demo (hasil seed)

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@hafaltrack.id` | `password123` |
| PENGAJAR | `ustadz@hafaltrack.id` | `password123` |
| ORANG_TUA (2 anak) | `supriyadi@hafaltrack.id` | `password123` |
| ORANG_TUA (1 anak) | `srirahayu@hafaltrack.id` | `password123` |

## Aturan Bisnis `sumberInput`

- Token role `PENGAJAR` → `sumberInput = SEKOLAH`, `isVerifiedByPengajar = true`
- Token role `ORANG_TUA` → `sumberInput = RUMAH`, `isVerifiedByPengajar = false`, jenis setoran dipaksa `MUROJAAH`
- Badge visual frontend: **Hijau = Sekolah**, **Biru = Rumah**
- Scoping akses: Orang tua hanya akses data santri miliknya; Pengajar hanya santri di kelas yang diampu.

## Endpoint Utama

| Method | Path | Akses |
|---|---|---|
| POST | `/api/auth/login` | publik |
| GET | `/api/auth/me` | semua |
| GET | `/api/materi`, `/api/kelas`, `/api/santri` | semua (data di-scope per role) |
| POST | `/api/kartu-kontrol` | PENGAJAR, ORANG_TUA |
| GET | `/api/kartu-kontrol` | semua (filter `santriId`, `sumberInput`, `jenisSetoran`, pagination) |
| PATCH | `/api/kartu-kontrol/:id` | PENGAJAR, ADMIN |
| PATCH | `/api/kartu-kontrol/:id/verify` | PENGAJAR |
| DELETE | `/api/kartu-kontrol/:id` | ADMIN |