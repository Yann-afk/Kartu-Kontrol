import { Request, Response } from "express";
import { JenisSetoran, SumberInput } from "@prisma/client";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import * as service from "../services/kartu-kontrol.service";

function parseTanggal(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "tanggalSetoran tidak valid");
  }
  return date.toISOString();
}

function parseAyat(value: unknown, field: string): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new ApiError(400, `${field} harus bilangan bulat lebih dari 0`);
  }
  return num;
}

function parseCreateBody(body: Record<string, unknown>): service.CreateKartuKontrolInput {
  const { santriId, materiId, jenisSetoran, ayatMulai, ayatSelesai, nilai, catatan, tanggalSetoran } = body;

  if (!santriId || typeof santriId !== "string") {
    throw new ApiError(400, "santriId wajib diisi");
  }
  if (!materiId || typeof materiId !== "string") {
    throw new ApiError(400, "materiId wajib diisi");
  }
  if (
    jenisSetoran !== JenisSetoran.ZIYADAH &&
    jenisSetoran !== JenisSetoran.MUROJAAH
  ) {
    throw new ApiError(400, "jenisSetoran harus ZIYADAH atau MUROJAAH");
  }

  const mulai = parseAyat(ayatMulai, "ayatMulai");
  const selesai = parseAyat(ayatSelesai, "ayatSelesai");
  if (selesai < mulai) {
    throw new ApiError(400, "ayatSelesai tidak boleh kurang dari ayatMulai");
  }

  return {
    santriId,
    materiId,
    jenisSetoran,
    ayatMulai: mulai,
    ayatSelesai: selesai,
    nilai: typeof nilai === "string" && nilai.trim() !== "" ? nilai.trim() : null,
    catatan: typeof catatan === "string" ? catatan.trim() : null,
    tanggalSetoran: parseTanggal(tanggalSetoran),
  };
}

function parseUpdateBody(body: Record<string, unknown>): service.UpdateKartuKontrolInput {
  const input: service.UpdateKartuKontrolInput = {};

  if (body.ayatMulai !== undefined) {
    input.ayatMulai = parseAyat(body.ayatMulai, "ayatMulai");
  }
  if (body.ayatSelesai !== undefined) {
    input.ayatSelesai = parseAyat(body.ayatSelesai, "ayatSelesai");
  }
  if (body.nilai !== undefined) {
    input.nilai =
      typeof body.nilai === "string" && body.nilai.trim() !== ""
        ? body.nilai.trim()
        : null;
  }
  if (body.catatan !== undefined) {
    input.catatan =
      typeof body.catatan === "string" ? body.catatan.trim() : null;
  }

  return input;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const kartu = await service.createKartuKontrol(
    req.user!,
    parseCreateBody(req.body)
  );
  res.status(201).json({
    success: true,
    message: "Setoran hafalan berhasil disimpan",
    data: kartu,
  });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { santriId, sumberInput, jenisSetoran, page, limit } = req.query;

  if (
    sumberInput !== undefined &&
    !Object.values(SumberInput).includes(sumberInput as SumberInput)
  ) {
    throw new ApiError(400, "Filter sumberInput tidak valid");
  }
  if (
    jenisSetoran !== undefined &&
    !Object.values(JenisSetoran).includes(jenisSetoran as JenisSetoran)
  ) {
    throw new ApiError(400, "Filter jenisSetoran tidak valid");
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

  const result = await service.listKartuKontrol(req.user!, {
    santriId: typeof santriId === "string" && santriId ? santriId : undefined,
    sumberInput: sumberInput as SumberInput | undefined,
    jenisSetoran: jenisSetoran as JenisSetoran | undefined,
    page: pageNum,
    limit: limitNum,
  });

  res.json({ success: true, data: result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const kartu = await service.getKartuKontrolById(req.user!, req.params.id);
  res.json({ success: true, data: kartu });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const kartu = await service.updateKartuKontrol(
    req.user!,
    req.params.id,
    parseUpdateBody(req.body)
  );
  res.json({
    success: true,
    message: "Data kartu kontrol berhasil diperbarui",
    data: kartu,
  });
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const kartu = await service.verifyKartuKontrol(req.user!, req.params.id);
  res.json({
    success: true,
    message: "Setoran rumah berhasil diverifikasi",
    data: kartu,
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteKartuKontrol(req.user!, req.params.id);
  res.json({
    success: true,
    message: "Data kartu kontrol berhasil dihapus",
  });
});
