import { PrismaClient, Role, SumberInput, JenisSetoran } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD_DEFAULT = "password123";

const MATERI_SEED = [
  { namaSurah: "Al-Fatihah", juz: 1, totalAyat: 7 },
  { namaSurah: "Al-Baqarah", juz: 1, totalAyat: 286 },
  { namaSurah: "Ali 'Imran", juz: 3, totalAyat: 200 },
  { namaSurah: "An-Nisa'", juz: 4, totalAyat: 176 },
  { namaSurah: "Al-Ma'idah", juz: 6, totalAyat: 120 },
  { namaSurah: "Al-An'am", juz: 7, totalAyat: 165 },
  { namaSurah: "Al-A'raf", juz: 8, totalAyat: 206 },
  { namaSurah: "Al-Anfal", juz: 9, totalAyat: 75 },
  { namaSurah: "At-Taubah", juz: 10, totalAyat: 129 },
  { namaSurah: "Yunus", juz: 11, totalAyat: 109 },
  { namaSurah: "Hud", juz: 11, totalAyat: 123 },
  { namaSurah: "Yusuf", juz: 12, totalAyat: 111 },
  { namaSurah: "Ar-Ra'd", juz: 13, totalAyat: 43 },
  { namaSurah: "Ibrahim", juz: 13, totalAyat: 52 },
  { namaSurah: "Al-Hijr", juz: 14, totalAyat: 99 },
  { namaSurah: "An-Nahl", juz: 14, totalAyat: 128 },
  { namaSurah: "Al-Isra'", juz: 15, totalAyat: 111 },
  { namaSurah: "Al-Kahf", juz: 15, totalAyat: 110 },
  { namaSurah: "Maryam", juz: 16, totalAyat: 98 },
  { namaSurah: "Ta-Ha", juz: 16, totalAyat: 135 },
  { namaSurah: "Al-Anbiya'", juz: 17, totalAyat: 112 },
  { namaSurah: "Al-Hajj", juz: 17, totalAyat: 78 },
  { namaSurah: "Al-Mu'minun", juz: 18, totalAyat: 118 },
  { namaSurah: "An-Nur", juz: 18, totalAyat: 64 },
  { namaSurah: "Al-Furqan", juz: 18, totalAyat: 77 },
  { namaSurah: "Ash-Shu'ara'", juz: 19, totalAyat: 227 },
  { namaSurah: "An-Naml", juz: 19, totalAyat: 93 },
  { namaSurah: "Al-Qasas", juz: 20, totalAyat: 88 },
  { namaSurah: "Al-'Ankabut", juz: 20, totalAyat: 69 },
  { namaSurah: "Ar-Rum", juz: 21, totalAyat: 60 },
  { namaSurah: "Luqman", juz: 21, totalAyat: 34 },
  { namaSurah: "As-Sajdah", juz: 21, totalAyat: 30 },
  { namaSurah: "Al-Ahzab", juz: 21, totalAyat: 73 },
  { namaSurah: "Saba'", juz: 22, totalAyat: 54 },
  { namaSurah: "Fatir", juz: 22, totalAyat: 45 },
  { namaSurah: "Ya-Sin", juz: 22, totalAyat: 83 },
  { namaSurah: "As-Saffat", juz: 23, totalAyat: 182 },
  { namaSurah: "Sad", juz: 23, totalAyat: 88 },
  { namaSurah: "Az-Zumar", juz: 23, totalAyat: 75 },
  { namaSurah: "Ghafir", juz: 24, totalAyat: 85 },
  { namaSurah: "Fussilat", juz: 24, totalAyat: 54 },
  { namaSurah: "Ash-Shura", juz: 25, totalAyat: 53 },
  { namaSurah: "Az-Zukhruf", juz: 25, totalAyat: 89 },
  { namaSurah: "Ad-Dukhan", juz: 25, totalAyat: 59 },
  { namaSurah: "Al-Jathiyah", juz: 25, totalAyat: 37 },
  { namaSurah: "Al-Ahqaf", juz: 26, totalAyat: 35 },
  { namaSurah: "Muhammad", juz: 26, totalAyat: 38 },
  { namaSurah: "Al-Fath", juz: 26, totalAyat: 29 },
  { namaSurah: "Al-Hujurat", juz: 26, totalAyat: 18 },
  { namaSurah: "Qaf", juz: 26, totalAyat: 45 },
  { namaSurah: "Adh-Dhariyat", juz: 26, totalAyat: 60 },
  { namaSurah: "At-Tur", juz: 27, totalAyat: 49 },
  { namaSurah: "An-Najm", juz: 27, totalAyat: 62 },
  { namaSurah: "Al-Qamar", juz: 27, totalAyat: 55 },
  { namaSurah: "Ar-Rahman", juz: 27, totalAyat: 78 },
  { namaSurah: "Al-Waqi'ah", juz: 27, totalAyat: 96 },
  { namaSurah: "Al-Hadid", juz: 27, totalAyat: 29 },
  { namaSurah: "Al-Mujadilah", juz: 28, totalAyat: 22 },
  { namaSurah: "Al-Hashr", juz: 28, totalAyat: 24 },
  { namaSurah: "Al-Mumtahanah", juz: 28, totalAyat: 13 },
  { namaSurah: "As-Saff", juz: 28, totalAyat: 14 },
  { namaSurah: "Al-Jumu'ah", juz: 28, totalAyat: 11 },
  { namaSurah: "Al-Munafiqun", juz: 28, totalAyat: 11 },
  { namaSurah: "At-Taghabun", juz: 28, totalAyat: 18 },
  { namaSurah: "At-Talaq", juz: 28, totalAyat: 12 },
  { namaSurah: "At-Tahrim", juz: 28, totalAyat: 12 },
  { namaSurah: "Al-Mulk", juz: 29, totalAyat: 30 },
  { namaSurah: "Al-Qalam", juz: 29, totalAyat: 52 },
  { namaSurah: "Al-Haqqah", juz: 29, totalAyat: 52 },
  { namaSurah: "Al-Ma'arij", juz: 29, totalAyat: 44 },
  { namaSurah: "Nuh", juz: 29, totalAyat: 28 },
  { namaSurah: "Al-Jinn", juz: 29, totalAyat: 28 },
  { namaSurah: "Al-Muzzammil", juz: 29, totalAyat: 20 },
  { namaSurah: "Al-Muddaththir", juz: 29, totalAyat: 56 },
  { namaSurah: "Al-Qiyamah", juz: 29, totalAyat: 40 },
  { namaSurah: "Al-Insan", juz: 29, totalAyat: 31 },
  { namaSurah: "Al-Mursalat", juz: 29, totalAyat: 50 },
  { namaSurah: "An-Naba'", juz: 30, totalAyat: 40 },
  { namaSurah: "An-Nazi'at", juz: 30, totalAyat: 46 },
  { namaSurah: "'Abasa", juz: 30, totalAyat: 42 },
  { namaSurah: "At-Takwir", juz: 30, totalAyat: 29 },
  { namaSurah: "Al-Infitar", juz: 30, totalAyat: 19 },
  { namaSurah: "Al-Mutaffifin", juz: 30, totalAyat: 36 },
  { namaSurah: "Al-Inshiqaq", juz: 30, totalAyat: 25 },
  { namaSurah: "Al-Buruj", juz: 30, totalAyat: 22 },
  { namaSurah: "At-Tariq", juz: 30, totalAyat: 17 },
  { namaSurah: "Al-A'la", juz: 30, totalAyat: 19 },
  { namaSurah: "Al-Ghashiyah", juz: 30, totalAyat: 26 },
  { namaSurah: "Al-Fajr", juz: 30, totalAyat: 30 },
  { namaSurah: "Al-Balad", juz: 30, totalAyat: 20 },
  { namaSurah: "Ash-Shams", juz: 30, totalAyat: 15 },
  { namaSurah: "Al-Layl", juz: 30, totalAyat: 21 },
  { namaSurah: "Ad-Duha", juz: 30, totalAyat: 11 },
  { namaSurah: "Ash-Sharh", juz: 30, totalAyat: 8 },
  { namaSurah: "At-Tin", juz: 30, totalAyat: 8 },
  { namaSurah: "Al-'Alaq", juz: 30, totalAyat: 19 },
  { namaSurah: "Al-Qadr", juz: 30, totalAyat: 5 },
  { namaSurah: "Al-Bayyinah", juz: 30, totalAyat: 8 },
  { namaSurah: "Az-Zalzalah", juz: 30, totalAyat: 8 },
  { namaSurah: "Al-'Adiyat", juz: 30, totalAyat: 11 },
  { namaSurah: "Al-Qari'ah", juz: 30, totalAyat: 11 },
  { namaSurah: "At-Takathur", juz: 30, totalAyat: 8 },
  { namaSurah: "Al-'Asr", juz: 30, totalAyat: 3 },
  { namaSurah: "Al-Humazah", juz: 30, totalAyat: 9 },
  { namaSurah: "Al-Fil", juz: 30, totalAyat: 5 },
  { namaSurah: "Quraysh", juz: 30, totalAyat: 4 },
  { namaSurah: "Al-Ma'un", juz: 30, totalAyat: 7 },
  { namaSurah: "Al-Kawthar", juz: 30, totalAyat: 3 },
  { namaSurah: "Al-Kafirun", juz: 30, totalAyat: 6 },
  { namaSurah: "An-Nasr", juz: 30, totalAyat: 3 },
  { namaSurah: "Al-Masad", juz: 30, totalAyat: 5 },
  { namaSurah: "Al-Ikhlas", juz: 30, totalAyat: 4 },
  { namaSurah: "Al-Falaq", juz: 30, totalAyat: 5 },
  { namaSurah: "An-Nas", juz: 30, totalAyat: 6 },
];

async function getOrCreateKelas(namaKelas: string, pengajarId: string) {
  const existing = await prisma.kelas.findFirst({
    where: { namaKelas, pengajarId },
  });
  if (existing) {
    return existing;
  }
  return prisma.kelas.create({ data: { namaKelas, pengajarId } });
}

async function getOrCreateMateri(namaSurah: string, juz: number, totalAyat: number) {
  const existing = await prisma.materi.findFirst({ where: { namaSurah } });
  if (existing) {
    return existing;
  }
  return prisma.materi.create({ data: { namaSurah, juz, totalAyat } });
}

async function main() {
  console.log("Mulai seed HafalTrack...");

  const password = bcrypt.hashSync(PASSWORD_DEFAULT, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hafaltrack.id" },
    update: {},
    create: { email: "admin@hafaltrack.id", password, role: Role.ADMIN },
  });

  const pengajarUser = await prisma.user.upsert({
    where: { email: "ustadz@hafaltrack.id" },
    update: {},
    create: { email: "ustadz@hafaltrack.id", password, role: Role.PENGAJAR },
  });

  const pengajar = await prisma.pengajar.upsert({
    where: { userId: pengajarUser.id },
    update: {},
    create: {
      userId: pengajarUser.id,
      namaLengkap: "Ustadz Ahmad Fauzi",
      nip: "NIP-001",
      noHp: "081234567890",
    },
  });

  const orangTuaAUser = await prisma.user.upsert({
    where: { email: "supriyadi@hafaltrack.id" },
    update: {},
    create: { email: "supriyadi@hafaltrack.id", password, role: Role.ORANG_TUA },
  });

  const orangTuaA = await prisma.orangTua.upsert({
    where: { userId: orangTuaAUser.id },
    update: {},
    create: {
      userId: orangTuaAUser.id,
      namaLengkap: "Supriyadi, S.T.",
      noHp: "081298765432",
      alamat: "Jl. Mawar No. 10, Yogyakarta",
    },
  });

  const orangTuaBUser = await prisma.user.upsert({
    where: { email: "srirahayu@hafaltrack.id" },
    update: {},
    create: { email: "srirahayu@hafaltrack.id", password, role: Role.ORANG_TUA },
  });

  const orangTuaB = await prisma.orangTua.upsert({
    where: { userId: orangTuaBUser.id },
    update: {},
    create: {
      userId: orangTuaBUser.id,
      namaLengkap: "Sri Rahayu",
      noHp: "085678912345",
      alamat: "Jl. Melati No. 5, Sleman",
    },
  });

  const kelasHalaqoh = await getOrCreateKelas("Halaqoh Al-Fatih", pengajar.id);
  const kelasTahfidz = await getOrCreateKelas("Halaqoh An-Nur", pengajar.id);

  const santriAbdullah = await prisma.santri.upsert({
    where: { nis: "S001" },
    update: {},
    create: {
      nis: "S001",
      namaLengkap: "Abdullah Ath-Thabrani",
      orangTuaId: orangTuaA.id,
      kelasId: kelasHalaqoh.id,
    },
  });

  const santriAisyah = await prisma.santri.upsert({
    where: { nis: "S002" },
    update: {},
    create: {
      nis: "S002",
      namaLengkap: "Aisyah Humaira",
      orangTuaId: orangTuaA.id,
      kelasId: kelasHalaqoh.id,
    },
  });

  await prisma.santri.upsert({
    where: { nis: "S003" },
    update: {},
    create: {
      nis: "S003",
      namaLengkap: "Muhammad Ziyad",
      orangTuaId: orangTuaB.id,
      kelasId: kelasTahfidz.id,
    },
  });

  for (const m of MATERI_SEED) {
    await getOrCreateMateri(m.namaSurah, m.juz, m.totalAyat);
  }

  const materiNaba = await prisma.materi.findFirstOrThrow({
    where: { namaSurah: "An-Naba'" },
  });
  const materiBaqarah = await prisma.materi.findFirstOrThrow({
    where: { namaSurah: "Al-Baqarah" },
  });
  const materiTakwir = await prisma.materi.findFirstOrThrow({
    where: { namaSurah: "At-Takwir" },
  });

  const existingKartuCount = await prisma.kartuKontrol.count();
  if (existingKartuCount === 0) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    await prisma.kartuKontrol.create({
      data: {
        santriId: santriAbdullah.id,
        disimakOlehUserId: pengajarUser.id,
        materiId: materiBaqarah.id,
        sumberInput: SumberInput.SEKOLAH,
        jenisSetoran: JenisSetoran.ZIYADAH,
        ayatMulai: 1,
        ayatSelesai: 10,
        nilai: "A",
        catatan: "Lancar, makhraj sudah baik. Pertahankan!",
        tanggalSetoran: new Date(now - 4 * day),
        isVerifiedByPengajar: true,
      },
    });

    await prisma.kartuKontrol.create({
      data: {
        santriId: santriAbdullah.id,
        disimakOlehUserId: pengajarUser.id,
        materiId: materiNaba.id,
        sumberInput: SumberInput.SEKOLAH,
        jenisSetoran: JenisSetoran.MUROJAAH,
        ayatMulai: 1,
        ayatSelesai: 20,
        nilai: "B",
        catatan: "Sedikit terbata-bata di ayat 12-15.",
        tanggalSetoran: new Date(now - 2 * day),
        isVerifiedByPengajar: true,
      },
    });

    await prisma.kartuKontrol.create({
      data: {
        santriId: santriAisyah.id,
        disimakOlehUserId: pengajarUser.id,
        materiId: materiNaba.id,
        sumberInput: SumberInput.SEKOLAH,
        jenisSetoran: JenisSetoran.ZIYADAH,
        ayatMulai: 1,
        ayatSelesai: 8,
        nilai: "A",
        catatan: "Hafalan sangat kuat.",
        tanggalSetoran: new Date(now - 1 * day),
        isVerifiedByPengajar: true,
      },
    });

    await prisma.kartuKontrol.create({
      data: {
        santriId: santriAbdullah.id,
        disimakOlehUserId: orangTuaAUser.id,
        materiId: materiTakwir.id,
        sumberInput: SumberInput.RUMAH,
        jenisSetoran: JenisSetoran.MUROJAAH,
        ayatMulai: 1,
        ayatSelesai: 10,
        nilai: null,
        catatan: "Muroja'ah sore bersama ayah, cukup lancar.",
        tanggalSetoran: new Date(now - 1 * day),
        isVerifiedByPengajar: false,
      },
    });
  }

  console.log("Seed selesai!");
  console.log("Akun demo:");
  console.log("  ADMIN     → admin@hafaltrack.id       / password123");
  console.log("  PENGAJAR  → ustadz@hafaltrack.id      / password123");
  console.log("  ORANG_TUA → supriyadi@hafaltrack.id   / password123");
  console.log("  ORANG_TUA → srirahayu@hafaltrack.id   / password123");
  console.log(`Dibuat: admin(${admin.email}), pengajar, 2 kelas, 3 santri, ${MATERI_SEED.length} materi`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });