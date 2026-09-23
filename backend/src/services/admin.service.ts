import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/api-error";

export interface CreateUserInput {
  email: string;
  password: string;
  role: Role;
  namaLengkap?: string | null;
  nip?: string | null;
  noHp?: string | null;
  alamat?: string | null;
}

export interface UpdateUserInput {
  email?: string;
  password?: string | null;
  role?: Role;
  namaLengkap?: string | null;
  nip?: string | null;
  noHp?: string | null;
  alamat?: string | null;
}

export interface CreateKelasInput {
  namaKelas: string;
  pengajarId: string;
}

export interface UpdateKelasInput {
  namaKelas?: string;
  pengajarId?: string;
}

export interface CreateSantriInput {
  nis: string;
  namaLengkap: string;
  orangTuaId: string;
  kelasId: string;
}

export interface UpdateSantriInput {
  nis?: string;
  namaLengkap?: string;
  orangTuaId?: string;
  kelasId?: string;
}

export interface CreateMateriInput {
  namaSurah: string;
  noUrut?: number;
  juz: number;
  totalAyat: number;
}

export interface UpdateMateriInput {
  namaSurah?: string;
  noUrut?: number;
  juz?: number;
  totalAyat?: number;
}

const userSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  pengajar: { select: { id: true, namaLengkap: true, nip: true, noHp: true } },
  orangTua: { select: { id: true, namaLengkap: true, noHp: true, alamat: true } },
} satisfies Prisma.UserSelect;

const kelasInclude = {
  pengajar: { select: { id: true, namaLengkap: true, noHp: true } },
  _count: { select: { santri: true } },
} satisfies Prisma.KelasInclude;

const santriInclude = {
  kelas: {
    select: {
      id: true,
      namaKelas: true,
      pengajar: { select: { id: true, namaLengkap: true } },
    },
  },
  orangTua: { select: { id: true, namaLengkap: true } },
  _count: { select: { kartuKontrol: true } },
} satisfies Prisma.SantriInclude;

function startOfToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

async function assertNotLastAdmin() {
  const count = await prisma.user.count({ where: { role: Role.ADMIN } });
  if (count <= 1) {
    throw new ApiError(
      400,
      "Tidak dapat menghapus/mengubah peran admin terakhir"
    );
  }
}

function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Format email tidak valid");
  }
  return email;
}

function normalizePassword(value: string): string {
  if (value.length < 6) {
    throw new ApiError(400, "Password minimal 6 karakter");
  }
  return value;
}

export async function getStats() {
  const [
    countAdmin,
    countPengajar,
    countOrangTua,
    totalSantri,
    totalKelas,
    totalMateri,
    totalSetoran,
    setoranHariIni,
    setoranBelumDiverifikasi,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.user.count({ where: { role: Role.PENGAJAR } }),
    prisma.user.count({ where: { role: Role.ORANG_TUA } }),
    prisma.santri.count(),
    prisma.kelas.count(),
    prisma.materi.count(),
    prisma.kartuKontrol.count(),
    prisma.kartuKontrol.count({
      where: { tanggalSetoran: { gte: startOfToday() } },
    }),
    prisma.kartuKontrol.count({ where: { isVerifiedByPengajar: false } }),
  ]);

  return {
    users: {
      ADMIN: countAdmin,
      PENGAJAR: countPengajar,
      ORANG_TUA: countOrangTua,
    },
    totalSantri,
    totalKelas,
    totalMateri,
    totalSetoran,
    setoranHariIni,
    setoranBelumDiverifikasi,
  };
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    namaLengkap: u.pengajar?.namaLengkap ?? u.orangTua?.namaLengkap ?? null,
    pengajar: u.pengajar,
    orangTua: u.orangTua,
  }));
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    select: userSelect,
    where: { id },
  });
  if (!user) {
    throw new ApiError(404, "User tidak ditemukan");
  }
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    namaLengkap: user.pengajar?.namaLengkap ?? user.orangTua?.namaLengkap ?? null,
    pengajar: user.pengajar,
    orangTua: user.orangTua,
  };
}

export async function createUser(input: CreateUserInput) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(409, "Email sudah terdaftar");
  }

  const password = await bcrypt.hash(normalizePassword(input.password), 10);

  const namaLengkap =
    input.namaLengkap && input.namaLengkap.trim() !== ""
      ? input.namaLengkap.trim()
      : null;
  if (
    input.role !== Role.ADMIN &&
    (!namaLengkap || typeof namaLengkap !== "string")
  ) {
    throw new ApiError(400, "namaLengkap wajib diisi untuk akun ini");
  }

  const user = await prisma.user.create({
    data: {
      email,
      password,
      role: input.role,
      pengajar:
        input.role === Role.PENGAJAR
          ? {
              create: {
                namaLengkap: namaLengkap!,
                nip: input.nip?.trim() || null,
                noHp: input.noHp?.trim() || null,
              },
            }
          : undefined,
      orangTua:
        input.role === Role.ORANG_TUA
          ? {
              create: {
                namaLengkap: namaLengkap!,
                noHp: input.noHp?.trim() || null,
                alamat: input.alamat?.trim() || null,
              },
            }
          : undefined,
    },
    select: userSelect,
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    namaLengkap: user.pengajar?.namaLengkap ?? user.orangTua?.namaLengkap ?? null,
    pengajar: user.pengajar,
    orangTua: user.orangTua,
  };
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { pengajar: true, orangTua: true },
  });
  if (!user) {
    throw new ApiError(404, "User tidak ditemukan");
  }

  if (input.role && input.role !== user.role && user.role === Role.ADMIN) {
    await assertNotLastAdmin();
  }

  const data: Prisma.UserUpdateInput = {};
  if (input.email) {
    data.email = normalizeEmail(input.email);
  }
  if (input.password && input.password.trim() !== "") {
    data.password = await bcrypt.hash(normalizePassword(input.password), 10);
  }
  if (input.role && input.role !== user.role) {
    data.role = input.role;
  }

  const targetRole = (data.role as Role | undefined) ?? user.role;

  if (input.role && input.role !== user.role && input.role === Role.ADMIN) {
    if (user.pengajar) {
      await prisma.pengajar.delete({ where: { id: user.pengajar.id } }).catch(() => {
        throw new ApiError(
          400,
          "Pengajar ini masih memiliki kelas, pindahkan kelasnya terlebih dahulu"
        );
      });
    }
  }

  if (targetRole === Role.PENGAJAR) {
    const namaLengkap =
      input.namaLengkap !== undefined && input.namaLengkap && input.namaLengkap.trim() !== ""
        ? input.namaLengkap.trim()
        : user.pengajar?.namaLengkap ?? "Pengajar";
    data.pengajar = {
      upsert: {
        create: {
          namaLengkap,
          nip: input.nip?.trim() || null,
          noHp: input.noHp?.trim() || null,
        },
        update: {
          namaLengkap,
          nip: input.nip !== undefined ? input.nip?.trim() || null : undefined,
          noHp: input.noHp !== undefined ? input.noHp?.trim() || null : undefined,
        },
      },
    };
  } else if (targetRole === Role.ORANG_TUA) {
    const namaLengkap =
      input.namaLengkap !== undefined && input.namaLengkap && input.namaLengkap.trim() !== ""
        ? input.namaLengkap.trim()
        : user.orangTua?.namaLengkap ?? "Orang Tua";
    data.orangTua = {
      upsert: {
        create: {
          namaLengkap,
          noHp: input.noHp?.trim() || null,
          alamat: input.alamat?.trim() || null,
        },
        update: {
          namaLengkap,
          noHp: input.noHp !== undefined ? input.noHp?.trim() || null : undefined,
          alamat: input.alamat !== undefined ? input.alamat?.trim() || null : undefined,
        },
      },
    };
  }

  const updated = await prisma.user.update({ where: { id }, data, select: userSelect });

  return {
    id: updated.id,
    email: updated.email,
    role: updated.role,
    createdAt: updated.createdAt,
    namaLengkap: updated.pengajar?.namaLengkap ?? updated.orangTua?.namaLengkap ?? null,
    pengajar: updated.pengajar,
    orangTua: updated.orangTua,
  };
}

export async function deleteUser(actingUserId: string, id: string) {
  if (id === actingUserId) {
    throw new ApiError(400, "Tidak dapat menghapus akun yang sedang digunakan");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      pengajar: { include: { _count: { select: { kelas: true } } } },
      orangTua: { include: { _count: { select: { anak: true } } } },
    },
  });
  if (!user) {
    throw new ApiError(404, "User tidak ditemukan");
  }
  if (user.role === Role.ADMIN) {
    await assertNotLastAdmin();
  }
  if (user.pengajar && user.pengajar._count.kelas > 0) {
    throw new ApiError(
      400,
      `User ini masih memiliki ${user.pengajar._count.kelas} kelas, pindahkan kelasnya terlebih dahulu`
    );
  }
  if (user.orangTua && user.orangTua._count.anak > 0) {
    throw new ApiError(
      400,
      `User ini masih memiliki ${user.orangTua._count.anak} anak, pindahkan walinya terlebih dahulu`
    );
  }

  await prisma.user.delete({ where: { id } });
}

export async function listKelasAdmin() {
  return prisma.kelas.findMany({
    include: kelasInclude,
    orderBy: { namaKelas: "asc" },
  });
}

export async function createKelas(input: CreateKelasInput) {
  const pengajar = await prisma.pengajar.findUnique({
    where: { id: input.pengajarId },
    select: { id: true },
  });
  if (!pengajar) {
    throw new ApiError(400, "Pengajar tidak ditemukan");
  }
  return prisma.kelas.create({
    data: { namaKelas: input.namaKelas.trim(), pengajarId: input.pengajarId },
    include: kelasInclude,
  });
}

export async function updateKelas(id: string, input: UpdateKelasInput) {
  const existing = await prisma.kelas.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Kelas tidak ditemukan");
  }
  if (input.pengajarId) {
    const pengajar = await prisma.pengajar.findUnique({
      where: { id: input.pengajarId },
      select: { id: true },
    });
    if (!pengajar) {
      throw new ApiError(400, "Pengajar tidak ditemukan");
    }
  }
  return prisma.kelas.update({
    where: { id },
    data: {
      namaKelas: input.namaKelas?.trim() ?? existing.namaKelas,
      pengajarId: input.pengajarId ?? existing.pengajarId,
    },
    include: kelasInclude,
  });
}

export async function deleteKelas(id: string) {
  const existing = await prisma.kelas.findUnique({
    where: { id },
    include: { _count: { select: { santri: true } } },
  });
  if (!existing) {
    throw new ApiError(404, "Kelas tidak ditemukan");
  }
  if (existing._count.santri > 0) {
    throw new ApiError(
      400,
      `Kelas "${existing.namaKelas}" masih memiliki ${existing._count.santri} santri, pindahkan santri terlebih dahulu`
    );
  }
  await prisma.kelas.delete({ where: { id } });
}

export async function listSantriAdmin() {
  return prisma.santri.findMany({
    include: santriInclude,
    orderBy: { namaLengkap: "asc" },
  });
}

export async function createSantri(input: CreateSantriInput) {
  const [orangTua, kelas] = await Promise.all([
    prisma.orangTua.findUnique({ where: { id: input.orangTuaId }, select: { id: true } }),
    prisma.kelas.findUnique({ where: { id: input.kelasId }, select: { id: true } }),
  ]);
  if (!orangTua) {
    throw new ApiError(400, "Orang tua tidak ditemukan");
  }
  if (!kelas) {
    throw new ApiError(400, "Kelas tidak ditemukan");
  }
  return prisma.santri.create({
    data: {
      nis: input.nis.trim(),
      namaLengkap: input.namaLengkap.trim(),
      orangTuaId: input.orangTuaId,
      kelasId: input.kelasId,
    },
    include: santriInclude,
  });
}

export async function updateSantri(id: string, input: UpdateSantriInput) {
  const existing = await prisma.santri.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Santri tidak ditemukan");
  }
  if (input.orangTuaId) {
    const orangTua = await prisma.orangTua.findUnique({
      where: { id: input.orangTuaId },
      select: { id: true },
    });
    if (!orangTua) {
      throw new ApiError(400, "Orang tua tidak ditemukan");
    }
  }
  if (input.kelasId) {
    const kelas = await prisma.kelas.findUnique({
      where: { id: input.kelasId },
      select: { id: true },
    });
    if (!kelas) {
      throw new ApiError(400, "Kelas tidak ditemukan");
    }
  }
  return prisma.santri.update({
    where: { id },
    data: {
      nis: input.nis?.trim() ?? existing.nis,
      namaLengkap: input.namaLengkap?.trim() ?? existing.namaLengkap,
      orangTuaId: input.orangTuaId ?? existing.orangTuaId,
      kelasId: input.kelasId ?? existing.kelasId,
    },
    include: santriInclude,
  });
}

export async function deleteSantri(id: string) {
  const existing = await prisma.santri.findUnique({
    where: { id },
    include: {
      _count: { select: { kartuKontrol: true } },
    },
  });
  if (!existing) {
    throw new ApiError(404, "Santri tidak ditemukan");
  }
  if (existing._count.kartuKontrol > 0) {
    throw new ApiError(
      400,
      `Santri "${existing.namaLengkap}" memiliki ${existing._count.kartuKontrol} data setoran. Hapus setoran terlebih dahulu agar santri dapat dihapus`
    );
  }
  await prisma.santri.delete({ where: { id } });
}

export async function listMateriAdmin() {
  return prisma.materi.findMany({
    orderBy: { noUrut: "asc" },
  });
}

function parseJuz(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 30) {
    throw new ApiError(400, "juz harus bilangan bulat antara 1 sampai 30");
  }
  return value;
}

function parseTotalAyat(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 300) {
    throw new ApiError(400, "totalAyat harus bilangan bulat antara 1 sampai 300");
  }
  return value;
}

function parseNoUrut(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new ApiError(400, "noUrut harus bilangan bulat minimal 1");
  }
  return value;
}

export async function createMateri(input: CreateMateriInput) {
  return prisma.materi.create({
    data: {
      namaSurah: input.namaSurah.trim(),
      noUrut: parseNoUrut(input.noUrut ?? 0),
      juz: parseJuz(input.juz),
      totalAyat: parseTotalAyat(input.totalAyat),
    },
  });
}

export async function updateMateri(id: string, input: UpdateMateriInput) {
  const existing = await prisma.materi.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Materi tidak ditemukan");
  }
  return prisma.materi.update({
    where: { id },
    data: {
      namaSurah: input.namaSurah?.trim() ?? existing.namaSurah,
      noUrut:
        input.noUrut !== undefined ? parseNoUrut(input.noUrut) : existing.noUrut,
      juz: input.juz !== undefined ? parseJuz(input.juz) : existing.juz,
      totalAyat:
        input.totalAyat !== undefined
          ? parseTotalAyat(input.totalAyat)
          : existing.totalAyat,
    },
  });
}

export async function deleteMateri(id: string) {
  const existing = await prisma.materi.findUnique({
    where: { id },
    include: { _count: { select: { kartuKontrol: true } } },
  });
  if (!existing) {
    throw new ApiError(404, "Materi tidak ditemukan");
  }
  if (existing._count.kartuKontrol > 0) {
    throw new ApiError(
      400,
      `Materi "${existing.namaSurah}" digunakan oleh ${existing._count.kartuKontrol} data setoran. Hapus setoran terlebih dahulu`
    );
  }
  await prisma.materi.delete({ where: { id } });
}