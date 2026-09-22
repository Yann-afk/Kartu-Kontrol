-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PENGAJAR', 'ORANG_TUA');

-- CreateEnum
CREATE TYPE "SumberInput" AS ENUM ('SEKOLAH', 'RUMAH');

-- CreateEnum
CREATE TYPE "JenisSetoran" AS ENUM ('ZIYADAH', 'MUROJAAH');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengajar" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "nip" VARCHAR(30),
    "noHp" VARCHAR(20),

    CONSTRAINT "Pengajar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrangTua" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "noHp" VARCHAR(20),
    "alamat" TEXT,

    CONSTRAINT "OrangTua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" UUID NOT NULL,
    "namaKelas" TEXT NOT NULL,
    "pengajarId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Santri" (
    "id" UUID NOT NULL,
    "nis" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "orangTuaId" UUID NOT NULL,
    "kelasId" UUID NOT NULL,

    CONSTRAINT "Santri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materi" (
    "id" UUID NOT NULL,
    "namaSurah" TEXT NOT NULL,
    "juz" INTEGER NOT NULL,
    "totalAyat" INTEGER NOT NULL,

    CONSTRAINT "Materi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KartuKontrol" (
    "id" UUID NOT NULL,
    "santriId" UUID NOT NULL,
    "disimakOlehUserId" UUID NOT NULL,
    "materiId" UUID NOT NULL,
    "sumberInput" "SumberInput" NOT NULL,
    "jenisSetoran" "JenisSetoran" NOT NULL,
    "ayatMulai" INTEGER NOT NULL,
    "ayatSelesai" INTEGER NOT NULL,
    "nilai" VARCHAR(20),
    "catatan" TEXT,
    "tanggalSetoran" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerifiedByPengajar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KartuKontrol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pengajar_userId_key" ON "Pengajar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrangTua_userId_key" ON "OrangTua"("userId");

-- CreateIndex
CREATE INDEX "Kelas_pengajarId_idx" ON "Kelas"("pengajarId");

-- CreateIndex
CREATE UNIQUE INDEX "Santri_nis_key" ON "Santri"("nis");

-- CreateIndex
CREATE INDEX "Santri_orangTuaId_idx" ON "Santri"("orangTuaId");

-- CreateIndex
CREATE INDEX "Santri_kelasId_idx" ON "Santri"("kelasId");

-- CreateIndex
CREATE INDEX "KartuKontrol_santriId_tanggalSetoran_idx" ON "KartuKontrol"("santriId", "tanggalSetoran");

-- CreateIndex
CREATE INDEX "KartuKontrol_disimakOlehUserId_idx" ON "KartuKontrol"("disimakOlehUserId");

-- CreateIndex
CREATE INDEX "KartuKontrol_materiId_idx" ON "KartuKontrol"("materiId");

-- CreateIndex
CREATE INDEX "KartuKontrol_sumberInput_idx" ON "KartuKontrol"("sumberInput");

-- AddForeignKey
ALTER TABLE "Pengajar" ADD CONSTRAINT "Pengajar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrangTua" ADD CONSTRAINT "OrangTua_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_pengajarId_fkey" FOREIGN KEY ("pengajarId") REFERENCES "Pengajar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Santri" ADD CONSTRAINT "Santri_orangTuaId_fkey" FOREIGN KEY ("orangTuaId") REFERENCES "OrangTua"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Santri" ADD CONSTRAINT "Santri_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartuKontrol" ADD CONSTRAINT "KartuKontrol_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartuKontrol" ADD CONSTRAINT "KartuKontrol_disimakOlehUserId_fkey" FOREIGN KEY ("disimakOlehUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KartuKontrol" ADD CONSTRAINT "KartuKontrol_materiId_fkey" FOREIGN KEY ("materiId") REFERENCES "Materi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
