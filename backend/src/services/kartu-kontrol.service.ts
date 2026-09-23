import { JenisSetoran, Prisma, Role, SumberInput } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/api-error";
import { AuthUser } from "../types/express";

const NILAI_VALID = ["A", "B", "C", "D", "Belum Lulus"];

export interface CreateKartuKontrolInput {
  santriId: string;
  materiId: string;
  jenisSetoran: JenisSetoran;
  ayatMulai: number;
  ayatSelesai: number;
  nilai?: string | null;
  catatan?: string | null;
  tanggalSetoran?: string | null;
  sumberInput?: SumberInput;
}

export interface UpdateKartuKontrolInput {
  santriId?: string;
  materiId?: string;
  jenisSetoran?: JenisSetoran;
  sumberInput?: SumberInput;
  tanggalSetoran?: string | null;
  ayatMulai?: number;
  ayatSelesai?: number;
  nilai?: string | null;
  catatan?: string | null;
}

export interface ListKartuKontrolFilters {
  santriId?: string;
  sumberInput?: SumberInput;
  jenisSetoran?: JenisSetoran;
  page: number;
  limit: number;
}

const kartuInclude: Prisma.KartuKontrolInclude = {
  santri: {
    select: {
      id: true,
      nis: true,
      namaLengkap: true,
      kelas: { select: { id: true, namaKelas: true } },
    },
  },
  materi: {
    select: {
      id: true,
      namaSurah: true,
      juz: true,
      totalAyat: true,
    },
  },
  disimakOleh: {
    select: {
      id: true,
      email: true,
      role: true,
      pengajar: { select: { namaLengkap: true } },
      orangTua: { select: { namaLengkap: true } },
    },
  },
};

export async function getAccessibleSantriIds(
  user: AuthUser
): Promise<string[] | null> {
  if (user.role === Role.ADMIN) {
    return null;
  }

  if (user.role === Role.ORANG_TUA) {
    const orangTua = await prisma.orangTua.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!orangTua) {
      throw new ApiError(403, "Profil orang tua tidak ditemukan");
    }
    const anak = await prisma.santri.findMany({
      where: { orangTuaId: orangTua.id },
      select: { id: true },
    });
    return anak.map((s) => s.id);
  }

  const pengajar = await prisma.pengajar.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!pengajar) {
    throw new ApiError(403, "Profil pengajar tidak ditemukan");
  }
  const santri = await prisma.santri.findMany({
    where: { kelas: { pengajarId: pengajar.id } },
    select: { id: true },
  });
  return santri.map((s) => s.id);
}

export async function assertSantriAccess(user: AuthUser, santriId: string) {
  const santri = await prisma.santri.findUnique({
    where: { id: santriId },
    select: { id: true, nis: true, namaLengkap: true },
  });
  if (!santri) {
    throw new ApiError(404, "Santri tidak ditemukan");
  }
  if (user.role === Role.ADMIN) {
    return santri;
  }
  const accessibleIds = await getAccessibleSantriIds(user);
  if (!accessibleIds || !accessibleIds.includes(santriId)) {
    throw new ApiError(403, "Anda tidak memiliki akses terhadap santri ini");
  }
  return santri;
}

export async function createKartuKontrol(
  user: AuthUser,
  input: CreateKartuKontrolInput
) {
  const materi = await prisma.materi.findUnique({
    where: { id: input.materiId },
    select: { id: true, namaSurah: true, totalAyat: true },
  });
  if (!materi) {
    throw new ApiError(404, "Materi tidak ditemukan");
  }
  if (input.ayatSelesai > materi.totalAyat) {
    throw new ApiError(
      400,
      `ayatSelesai melebihi total ayat surah (${materi.totalAyat})`
    );
  }

  await assertSantriAccess(user, input.santriId);

  let sumberInput: SumberInput;
  let isVerifiedByPengajar: boolean;
  let nilai: string | null;

  if (user.role === Role.ORANG_TUA) {
    if (input.jenisSetoran !== JenisSetoran.MUROJAAH) {
      throw new ApiError(
        400,
        "Orang tua hanya dapat input setoran MUROJAAH"
      );
    }
    sumberInput = SumberInput.RUMAH;
    isVerifiedByPengajar = false;
    nilai = null;
  } else if (user.role === Role.PENGAJAR) {
    if (!input.nilai || !NILAI_VALID.includes(input.nilai)) {
      throw new ApiError(
        400,
        "Nilai wajib diisi: A, B, C, D, atau Belum Lulus"
      );
    }
    sumberInput = SumberInput.SEKOLAH;
    isVerifiedByPengajar = true;
    nilai = input.nilai;
  } else {
    if (
      !input.sumberInput ||
      !Object.values(SumberInput).includes(input.sumberInput)
    ) {
      throw new ApiError(
        400,
        "sumberInput wajib diisi: SEKOLAH atau RUMAH"
      );
    }
    sumberInput = input.sumberInput;
    if (sumberInput === SumberInput.SEKOLAH) {
      if (!input.nilai || !NILAI_VALID.includes(input.nilai)) {
        throw new ApiError(
          400,
          "Nilai wajib diisi: A, B, C, D, atau Belum Lulus"
        );
      }
      isVerifiedByPengajar = true;
      nilai = input.nilai;
    } else {
      if (input.nilai && !NILAI_VALID.includes(input.nilai)) {
        throw new ApiError(400, "Nilai harus A, B, C, D, atau Belum Lulus");
      }
      isVerifiedByPengajar = false;
      nilai = input.nilai || null;
    }
  }

  return prisma.kartuKontrol.create({
    data: {
      santriId: input.santriId,
      disimakOlehUserId: user.id,
      materiId: input.materiId,
      sumberInput,
      jenisSetoran: input.jenisSetoran,
      ayatMulai: input.ayatMulai,
      ayatSelesai: input.ayatSelesai,
      nilai,
      catatan: input.catatan ?? null,
      tanggalSetoran: input.tanggalSetoran
        ? new Date(input.tanggalSetoran)
        : new Date(),
      isVerifiedByPengajar,
    },
    include: kartuInclude,
  });
}

export async function listKartuKontrol(
  user: AuthUser,
  filters: ListKartuKontrolFilters
) {
  const where: Prisma.KartuKontrolWhereInput = {};

  if (filters.santriId) {
    await assertSantriAccess(user, filters.santriId);
    where.santriId = filters.santriId;
  } else {
    const accessibleIds = await getAccessibleSantriIds(user);
    if (accessibleIds) {
      if (accessibleIds.length === 0) {
        return {
          items: [],
          page: filters.page,
          limit: filters.limit,
          total: 0,
        };
      }
      where.santriId = { in: accessibleIds };
    }
  }

  if (filters.sumberInput) {
    where.sumberInput = filters.sumberInput;
  }
  if (filters.jenisSetoran) {
    where.jenisSetoran = filters.jenisSetoran;
  }

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await prisma.$transaction([
    prisma.kartuKontrol.findMany({
      where,
      include: kartuInclude,
      orderBy: [{ tanggalSetoran: "desc" }, { createdAt: "desc" }],
      skip,
      take: filters.limit,
    }),
    prisma.kartuKontrol.count({ where }),
  ]);

  return {
    items,
    page: filters.page,
    limit: filters.limit,
    total,
  };
}

export async function getKartuKontrolById(user: AuthUser, id: string) {
  const kartu = await prisma.kartuKontrol.findUnique({
    where: { id },
    include: kartuInclude,
  });
  if (!kartu) {
    throw new ApiError(404, "Data kartu kontrol tidak ditemukan");
  }
  if (user.role !== Role.ADMIN) {
    const accessibleIds = await getAccessibleSantriIds(user);
    if (!accessibleIds || !accessibleIds.includes(kartu.santriId)) {
      throw new ApiError(403, "Anda tidak memiliki akses terhadap data ini");
    }
  }
  return kartu;
}

export async function updateKartuKontrol(
  user: AuthUser,
  id: string,
  input: UpdateKartuKontrolInput
) {
  const existing = await getKartuKontrolById(user, id);

  const restrictedFields = [
    "santriId",
    "materiId",
    "jenisSetoran",
    "sumberInput",
    "tanggalSetoran",
  ];
  const usesRestricted =
    restrictedFields.some((f) => (input as Record<string, unknown>)[f] !== undefined);
  if (usesRestricted && user.role !== Role.ADMIN) {
    throw new ApiError(
      403,
      "Hanya admin yang dapat mengubah santri, materi, jenis, sumber, atau tanggal"
    );
  }

  let santriId = existing.santriId;
  if (input.santriId !== undefined) {
    await assertSantriAccess(user, input.santriId);
    santriId = input.santriId;
  }

  let materi = existing.materi;
  if (input.materiId !== undefined) {
    const target = await prisma.materi.findUnique({
      where: { id: input.materiId },
      select: { id: true, namaSurah: true, juz: true, totalAyat: true },
    });
    if (!target) {
      throw new ApiError(404, "Materi tidak ditemukan");
    }
    materi = target;
  }

  const ayatMulai = input.ayatMulai ?? existing.ayatMulai;
  const ayatSelesai = input.ayatSelesai ?? existing.ayatSelesai;
  if (ayatSelesai < ayatMulai) {
    throw new ApiError(400, "ayatSelesai tidak boleh kurang dari ayatMulai");
  }
  if (ayatSelesai > materi.totalAyat) {
    throw new ApiError(
      400,
      `ayatSelesai melebihi total ayat surah (${materi.totalAyat})`
    );
  }

  let jenisSetoran = existing.jenisSetoran;
  if (input.jenisSetoran !== undefined) {
    if (
      input.jenisSetoran !== JenisSetoran.ZIYADAH &&
      input.jenisSetoran !== JenisSetoran.MUROJAAH
    ) {
      throw new ApiError(400, "jenisSetoran harus ZIYADAH atau MUROJAAH");
    }
    jenisSetoran = input.jenisSetoran;
  }

  let sumberInput = existing.sumberInput;
  let isVerifiedByPengajar = existing.isVerifiedByPengajar;
  if (input.sumberInput !== undefined) {
    if (
      input.sumberInput !== SumberInput.SEKOLAH &&
      input.sumberInput !== SumberInput.RUMAH
    ) {
      throw new ApiError(400, "sumberInput harus SEKOLAH atau RUMAH");
    }
    sumberInput = input.sumberInput;
    isVerifiedByPengajar = sumberInput === SumberInput.SEKOLAH;
  }

  let nilai = input.nilai !== undefined ? input.nilai : existing.nilai;
  if (user.role === Role.ADMIN) {
    if (nilai && !NILAI_VALID.includes(nilai)) {
      throw new ApiError(400, "Nilai harus A, B, C, D, atau Belum Lulus");
    }
    if (sumberInput === SumberInput.SEKOLAH && !nilai) {
      throw new ApiError(400, "Nilai wajib diisi untuk setoran sekolah");
    }
  } else if (user.role === Role.PENGAJAR && nilai !== null && nilai !== undefined) {
    if (!NILAI_VALID.includes(nilai)) {
      throw new ApiError(
        400,
        "Nilai harus A, B, C, D, atau Belum Lulus"
      );
    }
  }

  let tanggalSetoran = existing.tanggalSetoran;
  if (input.tanggalSetoran !== undefined) {
    if (input.tanggalSetoran !== null && input.tanggalSetoran !== "") {
      tanggalSetoran = new Date(input.tanggalSetoran);
    }
  }

  return prisma.kartuKontrol.update({
    where: { id },
    data: {
      santriId,
      materiId: materi.id,
      jenisSetoran,
      sumberInput,
      ayatMulai,
      ayatSelesai,
      nilai: nilai ?? null,
      catatan: input.catatan !== undefined ? input.catatan : existing.catatan,
      tanggalSetoran,
      isVerifiedByPengajar,
    },
    include: kartuInclude,
  });
}

export async function verifyKartuKontrol(user: AuthUser, id: string) {
  const kartu = await getKartuKontrolById(user, id);
  if (kartu.isVerifiedByPengajar) {
    return kartu;
  }
  return prisma.kartuKontrol.update({
    where: { id },
    data: { isVerifiedByPengajar: true },
    include: kartuInclude,
  });
}

export async function deleteKartuKontrol(user: AuthUser, id: string) {
  if (user.role !== Role.ADMIN) {
    throw new ApiError(403, "Hanya ADMIN yang dapat menghapus data");
  }
  const kartu = await prisma.kartuKontrol.findUnique({ where: { id } });
  if (!kartu) {
    throw new ApiError(404, "Data kartu kontrol tidak ditemukan");
  }
  await prisma.kartuKontrol.delete({ where: { id } });
}
