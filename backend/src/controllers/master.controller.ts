import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import { getAccessibleSantriIds } from "../services/kartu-kontrol.service";

export const listMateri = asyncHandler(async (_req: Request, res: Response) => {
  const materi = await prisma.materi.findMany({
    orderBy: { noUrut: "asc" },
  });
  res.json({ success: true, data: materi });
});

export const listSantri = asyncHandler(async (req: Request, res: Response) => {
  const accessibleIds = await getAccessibleSantriIds(req.user!);

  const santri = await prisma.santri.findMany({
    where: accessibleIds ? { id: { in: accessibleIds } } : undefined,
    include: {
      kelas: {
        select: {
          id: true,
          namaKelas: true,
          pengajar: { select: { id: true, namaLengkap: true } },
        },
      },
      orangTua: { select: { id: true, namaLengkap: true } },
    },
    orderBy: { namaLengkap: "asc" },
  });

  res.json({ success: true, data: santri });
});

export const listKelas = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  if (user.role === Role.PENGAJAR) {
    const pengajar = await prisma.pengajar.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!pengajar) {
      throw new ApiError(403, "Profil pengajar tidak ditemukan");
    }
    const kelas = await prisma.kelas.findMany({
      where: { pengajarId: pengajar.id },
      include: {
        pengajar: { select: { id: true, namaLengkap: true } },
        _count: { select: { santri: true } },
      },
      orderBy: { namaKelas: "asc" },
    });
    res.json({ success: true, data: kelas });
    return;
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
      select: { kelasId: true },
    });
    const kelasIds = Array.from(new Set(anak.map((a) => a.kelasId)));
    const kelas = await prisma.kelas.findMany({
      where: { id: { in: kelasIds } },
      include: {
        pengajar: { select: { id: true, namaLengkap: true } },
        _count: { select: { santri: true } },
      },
      orderBy: { namaKelas: "asc" },
    });
    res.json({ success: true, data: kelas });
    return;
  }

  const kelas = await prisma.kelas.findMany({
    include: {
      pengajar: { select: { id: true, namaLengkap: true } },
      _count: { select: { santri: true } },
    },
    orderBy: { namaKelas: "asc" },
  });
  res.json({ success: true, data: kelas });
});
