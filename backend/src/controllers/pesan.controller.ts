import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import { prisma } from "../utils/prisma";
import { getAccessibleSantriIds } from "../services/kartu-kontrol.service";
import { sendPushToUsers } from "../utils/fcm";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const body = (req.query as Record<string, unknown>).santriId;
  const { page } = req.query;

  if (typeof body !== "string" || body.trim() === "") {
    throw new ApiError(400, "santriId wajib diisi");
  }
  const santriId = body.trim();
  const accessibleIds = await getAccessibleSantriIds(req.user!);
  if (accessibleIds && !accessibleIds.includes(santriId)) {
    throw new ApiError(403, "Anda tidak memiliki akses terhadap santri ini");
  }
  const pageNum = Math.max(1, Number(page) || 1);

  const [items, total] = await prisma.$transaction([
    prisma.pesan.findMany({
      where: { santriId },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            pengajar: { select: { namaLengkap: true } },
            orangTua: { select: { namaLengkap: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip: (pageNum - 1) * 50,
      take: 50,
    }),
    prisma.pesan.count({ where: { santriId } }),
  ]);

  res.json({ success: true, data: { items, page: pageNum, limit: 50, total } });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const body = req.body ?? {};
  const rawSantriId = body.santriId as unknown;
  const rawIsi = body.isi as unknown;

  if (typeof rawSantriId !== "string" || rawSantriId.trim() === "") {
    throw new ApiError(400, "santriId wajib diisi");
  }
  if (typeof rawIsi !== "string" || rawIsi.trim() === "") {
    throw new ApiError(400, "Isi pesan tidak boleh kosong");
  }
  const santriId = rawSantriId.trim();
  const isi = rawIsi.trim().slice(0, 1000);

  const accessibleIds = await getAccessibleSantriIds(user);
  if (accessibleIds && !accessibleIds.includes(santriId)) {
    throw new ApiError(403, "Anda tidak memiliki akses terhadap santri ini");
  }

  const pesan = await prisma.pesan.create({
    data: { santriId, senderUserId: user.id, isi },
  });

  let targetUserIds: string[] = [];

  if (user.role === "ORANG_TUA") {
    const santri = await prisma.santri.findUnique({
      where: { id: santriId },
      select: { kelas: { select: { pengajar: { select: { userId: true } } } } },
    });
    if (santri?.kelas?.pengajar?.userId) {
      targetUserIds = [santri.kelas.pengajar.userId];
    }
  } else if (user.role === "PENGAJAR") {
    const santri = await prisma.santri.findUnique({
      where: { id: santriId },
      select: { orangTua: { select: { userId: true } } },
    });
    if (santri?.orangTua?.userId) {
      targetUserIds = [santri.orangTua.userId];
    }
  }

  if (targetUserIds.length > 0) {
    void sendPushToUsers(targetUserIds, {
      title: "Pesan baru dari " + getUserLabel(user.role),
      body: isi.length > 80 ? isi.slice(0, 80) + "…" : isi,
      data: { tipe: "pesan", santriId },
    });
  }

  res.status(201).json({
    success: true,
    message: "Pesan terkirim",
    data: pesan,
  });
});

function getUserLabel(role: string): string {
  return role === "PENGAJAR" ? "Pengajar" : role === "ORANG_TUA" ? "Orang Tua" : "Admin";
}