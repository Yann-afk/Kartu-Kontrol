import { JenisSetoran, Prisma, Role, SumberInput } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/api-error";
import { AuthUser } from "../types/express";
import { sendPushToUsers } from "../utils/fcm";

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

async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { id: true },
  });
  return admins.map((a) => a.id);
}

async function getOrtuUserId(santriId: string): Promise<string | null> {
  const santri = await prisma.santri.findUnique({
    where: { id: santriId },
    select: { orangTua: { select: { userId: true } } },
  });
  return santri?.orangTua?.userId ?? null;
}

async function getPengajarUserIdByKelas(
  kelasId: string
): Promise<string | null> {
  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    select: { pengajar: { select: { userId: true } } },
  });
  return kelas?.pengajar?.userId ?? null;
}

interface NotifyKartu {
  id: string;
  santriId: string;
  santri: {
    namaLengkap: string;
    kelas: { id: string };
  };
  materi: { namaSurah: string };
  ayatMulai: number;
  ayatSelesai: number;
  nilai: string | null;
  isVerifiedByPengajar: boolean;
}

interface NotifyKartuVerif {
  id: string;
  santriId: string;
  santri: { namaLengkap: string };
  materi: { namaSurah: string };
  ayatMulai: number;
  ayatSelesai: number;
  nilai: string | null;
}

function setoranLabel(kartu: {
  santri: { namaLengkap: string };
  materi: { namaSurah: string };
  ayatMulai: number;
  ayatSelesai: number;
}): string {
  return `${kartu.santri.namaLengkap} - ${kartu.materi.namaSurah} ${kartu.ayatMulai}-${kartu.ayatSelesai}`;
}

async function notifyOnCreate(kartu: NotifyKartu, sumberInput: SumberInput): Promise<void> {
  const admins = await getAdminUserIds();
  const label = setoranLabel(kartu);

  if (sumberInput === SumberInput.RUMAH) {
    const pengajarId = await getPengajarUserIdByKelas(kartu.santri.kelas.id);
    const targets = pengajarId
      ? [...new Set([pengajarId, ...admins])]
      : admins;
    void sendPushToUsers(targets, {
      title: "Setoran rumah menunggu verifikasi",
      body: `${label} · by orang tua`,
      data: { kartuId: kartu.id },
    });
  } else {
    void sendPushToUsers(admins, {
      title: "Setoran baru masuk",
      body: label,
      data: { kartuId: kartu.id },
    });
  }

  if (kartu.isVerifiedByPengajar && kartu.nilai) {
    const ortuId = await getOrtuUserId(kartu.santriId);
    if (ortuId) {
      void sendPushToUsers([ortuId], {
        title: `Nilai setoran ${kartu.santri.namaLengkap}`,
        body: `${kartu.materi.namaSurah} ${kartu.ayatMulai}-${kartu.ayatSelesai}: ${kartu.nilai}`,
        data: { kartuId: kartu.id },
      });
    }
  }
}

async function notifyNilaiToOrtu(kartu: NotifyKartuVerif): Promise<void> {
  if (!kartu.nilai) {
    return;
  }
  const ortuId = await getOrtuUserId(kartu.santriId);
  if (!ortuId) {
    return;
  }
  void sendPushToUsers([ortuId], {
    title: `Nilai setoran ${kartu.santri.namaLengkap}`,
    body: `${kartu.materi.namaSurah} ${kartu.ayatMulai}-${kartu.ayatSelesai}: ${kartu.nilai}`,
    data: { kartuId: kartu.id },
  });
}

async function notifyVerifiedToOrtu(kartu: NotifyKartuVerif): Promise<void> {
  const ortuId = await getOrtuUserId(kartu.santriId);
  if (!ortuId) {
    return;
  }
  void sendPushToUsers([ortuId], {
    title: `Setoran ${kartu.santri.namaLengkap} sudah diperiksa`,
    body: `${kartu.materi.namaSurah} ${kartu.ayatMulai}-${kartu.ayatSelesai} divalidasi pengajar`,
    data: { kartuId: kartu.id },
  });
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

  const kartu = await prisma.kartuKontrol.create({
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

  void notifyOnCreate(kartu as unknown as NotifyKartu, sumberInput);
  return kartu;
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

  const kartu = await prisma.kartuKontrol.update({
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

  const nilaiBerubah = existing.nilai !== kartu.nilai;
  const statusBerubah =
    !existing.isVerifiedByPengajar && kartu.isVerifiedByPengajar;
  if ((nilaiBerubah || statusBerubah) && kartu.nilai) {
    void notifyNilaiToOrtu(kartu as unknown as NotifyKartuVerif);
  }
  return kartu;
}

export async function verifyKartuKontrol(user: AuthUser, id: string) {
  const kartu = await getKartuKontrolById(user, id);
  if (kartu.isVerifiedByPengajar) {
    return kartu;
  }
  const verified = await prisma.kartuKontrol.update({
    where: { id },
    data: { isVerifiedByPengajar: true },
    include: kartuInclude,
  });
  void notifyVerifiedToOrtu(verified as unknown as NotifyKartuVerif);
  return verified;
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
