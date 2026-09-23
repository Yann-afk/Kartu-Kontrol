import { Prisma, SumberInput, JenisSetoran, Role } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/api-error";
import { AuthUser } from "../types/express";
import { getAccessibleSantriIds } from "./kartu-kontrol.service";

export interface LaporanOptions {
  kelasId?: string;
  santriId?: string;
  tanggalAwal?: string;
  tanggalAkhir?: string;
  page: number;
  limit: number;
}

function parseTanggalFilter(value: string | undefined): Date | undefined {
  if (!value || value === "") {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Format tanggal tidak valid");
  }
  return date;
}

async function resolveSantriIds(
  user: AuthUser,
  opts: { kelasId?: string; santriId?: string }
): Promise<string[] | null> {
  if (opts.santriId) {
    const accessible = await getAccessibleSantriIds(user);
    if (accessible && !accessible.includes(opts.santriId)) {
      throw new ApiError(403, "Anda tidak memiliki akses terhadap santri ini");
    }
    return [opts.santriId];
  }

  if (opts.kelasId) {
    if (user.role === Role.PENGAJAR) {
      const pengajar = await prisma.pengajar.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      const kelas = await prisma.kelas.findUnique({
        where: { id: opts.kelasId },
        select: { pengajarId: true },
      });
      if (!kelas) {
        throw new ApiError(404, "Kelas tidak ditemukan");
      }
      if (kelas.pengajarId !== pengajar?.id) {
        throw new ApiError(403, "Anda tidak mengampu kelas ini");
      }
    } else if (user.role === Role.ORANG_TUA) {
      const orangTua = await prisma.orangTua.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      const kelas = await prisma.kelas.findUnique({
        where: { id: opts.kelasId },
        select: { id: true },
      });
      if (!kelas) {
        throw new ApiError(404, "Kelas tidak ditemukan");
      }
      const milik = await prisma.santri.findFirst({
        where: { kelasId: opts.kelasId, orangTuaId: orangTua?.id },
        select: { id: true },
      });
      if (!milik) {
        throw new ApiError(403, "Anda tidak memiliki akses terhadap kelas ini");
      }
    }
    const santri = await prisma.santri.findMany({
      where: { kelasId: opts.kelasId },
      select: { id: true },
    });
    return santri.map((s) => s.id);
  }

  return getAccessibleSantriIds(user);
}

const rekapInclude: Prisma.KartuKontrolInclude = {
  santri: {
    select: {
      id: true,
      nis: true,
      namaLengkap: true,
      kelas: { select: { id: true, namaKelas: true } },
    },
  },
  materi: {
    select: { id: true, namaSurah: true, juz: true, totalAyat: true },
  },
  disimakOleh: {
    select: {
      id: true,
      role: true,
      pengajar: { select: { namaLengkap: true } },
      orangTua: { select: { namaLengkap: true } },
    },
  },
};

export async function getRekap(user: AuthUser, opts: LaporanOptions) {
  const awal = parseTanggalFilter(opts.tanggalAwal);
  const akhir = parseTanggalFilter(opts.tanggalAkhir);
  const santriIds = await resolveSantriIds(user, opts);

  const where: Prisma.KartuKontrolWhereInput = {
    ...(santriIds ? { santriId: { in: santriIds } } : {}),
    ...(awal ? { tanggalSetoran: { gte: awal } } : {}),
    ...(akhir ? { tanggalSetoran: { lte: akhir } } : {}),
  };

  const [items, total, totalSekolah, totalRumah, totalZiyadah, totalMurojaah, kelompokNilai, kelompokSantri, jumlahAyat] =
    await prisma.$transaction([
      prisma.kartuKontrol.findMany({
        where,
        include: rekapInclude,
        orderBy: [{ tanggalSetoran: "desc" }, { createdAt: "desc" }],
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      prisma.kartuKontrol.count({ where }),
      prisma.kartuKontrol.count({ where: { ...where, sumberInput: SumberInput.SEKOLAH } }),
      prisma.kartuKontrol.count({ where: { ...where, sumberInput: SumberInput.RUMAH } }),
      prisma.kartuKontrol.count({ where: { ...where, jenisSetoran: JenisSetoran.ZIYADAH } }),
      prisma.kartuKontrol.count({ where: { ...where, jenisSetoran: JenisSetoran.MUROJAAH } }),
      prisma.kartuKontrol.groupBy({
        by: ["nilai"],
        where,
        orderBy: { nilai: "desc" },
        _count: { _all: true },
      }),
      prisma.kartuKontrol.groupBy({
        by: ["santriId"],
        where,
        orderBy: { santriId: "asc" },
        _count: { _all: true },
        _sum: { ayatMulai: true, ayatSelesai: true },
      }),
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM("ayatSelesai" - "ayatMulai" + 1), 0)::int AS total
        FROM "KartuKontrol"
        ${buildWhereSql({
          santriIds,
          awal,
          akhir,
        })}`,
    ]);

  const santriNames = await prisma.santri.findMany({
    where: { id: { in: kelompokSantri.map((g) => g.santriId) } },
    select: {
      id: true,
      nis: true,
      namaLengkap: true,
      kelas: { select: { namaKelas: true } },
    },
  });
  const namaMap = new Map(santriNames.map((s) => [s.id, s]));

  const perSantri = kelompokSantri
    .map((g) => {
      const s = namaMap.get(g.santriId);
      const jumlah = (g._count as { _all: number })._all;
      const sum = g._sum as { ayatMulai: number | null; ayatSelesai: number | null };
      return {
        santriId: g.santriId,
        nis: s?.nis ?? null,
        namaLengkap: s?.namaLengkap ?? null,
        kelas: s?.kelas?.namaKelas ?? null,
        total: jumlah,
        totalAyat: (sum.ayatSelesai ?? 0) - (sum.ayatMulai ?? 0) + 1,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    periode: { tanggalAwal: awal ?? null, tanggalAkhir: akhir ?? null },
    totals: {
      total,
      totalSekolah,
      totalRumah,
      totalZiyadah,
      totalMurojaah,
      totalAyat: jumlahAyat[0]?.total ?? 0,
      santriCount: kelompokSantri.length,
    },
    nilai: kelompokNilai.map((n) => ({
      nilai: n.nilai,
      total: (n._count as { _all: number })._all,
    })),
    perSantri,
    items,
    page: opts.page,
    limit: opts.limit,
  };
}

interface WhereBuild {
  santriIds: string[] | null;
  awal?: Date;
  akhir?: Date;
}

function buildWhereSql({ santriIds, awal, akhir }: WhereBuild): Prisma.Sql {
  const conds: Prisma.Sql[] = [];
  if (santriIds) {
    conds.push(Prisma.sql`"santriId" IN (${Prisma.join(santriIds)})`);
  }
  if (awal) {
    conds.push(Prisma.sql`"tanggalSetoran" >= ${awal}`);
  }
  if (akhir) {
    conds.push(Prisma.sql`"tanggalSetoran" <= ${akhir}`);
  }
  return conds.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}`
    : Prisma.empty;
}

export async function getStatistik(
  user: AuthUser,
  opts: {
    kelasId?: string;
    santriId?: string;
    tanggalAwal?: string;
    tanggalAkhir?: string;
  }
) {
  const awal = parseTanggalFilter(opts.tanggalAwal);
  const akhir = parseTanggalFilter(opts.tanggalAkhir);
  const santriIds = await resolveSantriIds(user, opts);

  const whereSql = buildWhereSql({ santriIds, awal, akhir });
  const where: Prisma.KartuKontrolWhereInput = {
    ...(santriIds ? { santriId: { in: santriIds } } : {}),
    ...(awal ? { tanggalSetoran: { gte: awal } } : {}),
    ...(akhir ? { tanggalSetoran: { lte: akhir } } : {}),
  };
  const dasarWhere: Prisma.KartuKontrolWhereInput = santriIds
    ? { santriId: { in: santriIds } }
    : {};

  const [perBulan, perHari, perSumber, perJenis, perNilai, totalAyat, perSantriRow] =
    await prisma.$transaction([
      prisma.$queryRaw<{ bulan: string; total: number }[]>`
        SELECT to_char("tanggalSetoran", 'YYYY-MM') AS bulan, count(*)::int AS total
        FROM "KartuKontrol" ${whereSql}
        GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw<{ tgl: string; total: number }[]>`
        SELECT to_char("tanggalSetoran", 'YYYY-MM-DD') AS tgl, count(*)::int AS total
        FROM "KartuKontrol" ${whereSql}
        GROUP BY 1 ORDER BY 1 DESC
        LIMIT 7`,
      prisma.kartuKontrol.groupBy({
        by: ["sumberInput"],
        where: dasarWhere,
        orderBy: { sumberInput: "asc" },
        _count: { _all: true },
      }),
      prisma.kartuKontrol.groupBy({
        by: ["jenisSetoran"],
        where: dasarWhere,
        orderBy: { jenisSetoran: "asc" },
        _count: { _all: true },
      }),
      prisma.kartuKontrol.groupBy({
        by: ["nilai"],
        where: dasarWhere,
        orderBy: { nilai: "desc" },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM("ayatSelesai" - "ayatMulai" + 1), 0)::int AS total
        FROM "KartuKontrol" ${whereSql}`,
      prisma.kartuKontrol.groupBy({
        by: ["santriId"],
        where: dasarWhere,
        orderBy: { santriId: "asc" },
        _count: { _all: true },
        _sum: { ayatMulai: true, ayatSelesai: true },
      }),
    ]);

  const santriNames = await prisma.santri.findMany({
    where: { id: { in: perSantriRow.map((g) => g.santriId) } },
    select: {
      id: true,
      nis: true,
      namaLengkap: true,
      kelas: { select: { namaKelas: true } },
    },
  });
  const namaMap = new Map(santriNames.map((s) => [s.id, s]));
  const perSantri = perSantriRow
    .map((g) => {
      const s = namaMap.get(g.santriId);
      const jumlah = (g._count as { _all: number })._all;
      const sum = g._sum as { ayatMulai: number | null; ayatSelesai: number | null };
      return {
        santriId: g.santriId,
        nis: s?.nis ?? null,
        namaLengkap: s?.namaLengkap ?? null,
        kelas: s?.kelas?.namaKelas ?? null,
        total: jumlah,
        totalAyat: (sum.ayatSelesai ?? 0) - (sum.ayatMulai ?? 0) + 1,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    perBulan,
    perHari,
    perSumber,
    perJenis,
    perNilai,
    totalAyat: totalAyat[0]?.total ?? 0,
    perSantri,
  };
}