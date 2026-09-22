import { PrismaClient, Role, SumberInput, JenisSetoran } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD_DEFAULT = "password123";

const MATERI_SEED = [
  { namaSurah: "Al-Baqarah", juz: 1, totalAyat: 286 },
  { namaSurah: "An-Naba'", juz: 30, totalAyat: 40 },
  { namaSurah: "An-Nazi'at", juz: 30, totalAyat: 46 },
  { namaSurah: "'Abasa", juz: 30, totalAyat: 42 },
  { namaSurah: "At-Takwir", juz: 30, totalAyat: 29 },
  { namaSurah: "Al-Infitar", juz: 30, totalAyat: 19 },
  { namaSurah: "Al-Mutaffifin", juz: 30, totalAyat: 36 },
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