import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as service from "../services/laporan.service";

export const rekap = asyncHandler(async (req: Request, res: Response) => {
  const { kelasId, santriId, tanggalAwal, tanggalAkhir, page, limit } =
    req.query;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));

  const result = await service.getRekap(req.user!, {
    kelasId: typeof kelasId === "string" && kelasId ? kelasId : undefined,
    santriId: typeof santriId === "string" && santriId ? santriId : undefined,
    tanggalAwal:
      typeof tanggalAwal === "string" ? tanggalAwal : undefined,
    tanggalAkhir:
      typeof tanggalAkhir === "string" ? tanggalAkhir : undefined,
    page: pageNum,
    limit: limitNum,
  });

  res.json({ success: true, data: result });
});

export const statistik = asyncHandler(async (req: Request, res: Response) => {
  const { kelasId, santriId, tanggalAwal, tanggalAkhir } = req.query;

  const result = await service.getStatistik(req.user!, {
    kelasId: typeof kelasId === "string" && kelasId ? kelasId : undefined,
    santriId: typeof santriId === "string" && santriId ? santriId : undefined,
    tanggalAwal: typeof tanggalAwal === "string" ? tanggalAwal : undefined,
    tanggalAkhir: typeof tanggalAkhir === "string" ? tanggalAkhir : undefined,
  });

  res.json({ success: true, data: result });
});