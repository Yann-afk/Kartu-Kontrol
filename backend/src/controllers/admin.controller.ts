import { Request, Response } from "express";
import { JenisSetoran, Role, SumberInput } from "@prisma/client";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import * as adminService from "../services/admin.service";
import {
  createKartuKontrol,
  listKartuKontrol,
  updateKartuKontrol,
  CreateKartuKontrolInput,
  UpdateKartuKontrolInput,
} from "../services/kartu-kontrol.service";

function parseId(value: string): string {
  if (!value || typeof value !== "string") {
    throw new ApiError(400, "ID tidak valid");
  }
  return value;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${field} wajib diisi`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return typeof value === "string" ? value.trim() || null : null;
}

function parseRole(value: unknown): Role {
  if (
    value !== Role.ADMIN &&
    value !== Role.PENGAJAR &&
    value !== Role.ORANG_TUA
  ) {
    throw new ApiError(400, "role harus ADMIN, PENGAJAR, atau ORANG_TUA");
  }
  return value as Role;
}

function parseCreateUserBody(body: Record<string, unknown>): adminService.CreateUserInput {
  if (typeof body.password !== "string" || body.password.length < 6) {
    throw new ApiError(400, "password wajib diisi minimal 6 karakter");
  }
  const role = parseRole(body.role);
  const namaLengkap = optionalString(body.namaLengkap);
  if (role !== Role.ADMIN && !namaLengkap) {
    throw new ApiError(400, "namaLengkap wajib diisi");
  }
  return {
    email: requiredString(body.email, "email"),
    password: body.password,
    role,
    namaLengkap,
    nip: optionalString(body.nip),
    noHp: optionalString(body.noHp),
    alamat: optionalString(body.alamat),
  };
}

function parseUpdateUserBody(body: Record<string, unknown>): adminService.UpdateUserInput {
  const input: adminService.UpdateUserInput = {};
  if (body.email !== undefined) {
    input.email = requiredString(body.email, "email");
  }
  if (body.password !== undefined && body.password !== null && body.password !== "") {
    if (typeof body.password !== "string" || body.password.length < 6) {
      throw new ApiError(400, "password minimal 6 karakter");
    }
    input.password = body.password;
  }
  if (body.role !== undefined) {
    input.role = parseRole(body.role);
  }
  if (body.namaLengkap !== undefined) {
    input.namaLengkap =
      typeof body.namaLengkap === "string"
        ? body.namaLengkap.trim() || null
        : null;
  }
  if (body.nip !== undefined) {
    input.nip = typeof body.nip === "string" ? body.nip.trim() || null : null;
  }
  if (body.noHp !== undefined) {
    input.noHp = typeof body.noHp === "string" ? body.noHp.trim() || null : null;
  }
  if (body.alamat !== undefined) {
    input.alamat =
      typeof body.alamat === "string" ? body.alamat.trim() || null : null;
  }
  return input;
}

function parseKelasBody(body: Record<string, unknown>): adminService.CreateKelasInput {
  return {
    namaKelas: requiredString(body.namaKelas, "namaKelas"),
    pengajarId: requiredString(body.pengajarId, "pengajarId"),
  };
}

function parseUpdateKelasBody(body: Record<string, unknown>): adminService.UpdateKelasInput {
  const input: adminService.UpdateKelasInput = {};
  if (body.namaKelas !== undefined) {
    input.namaKelas = requiredString(body.namaKelas, "namaKelas");
  }
  if (body.pengajarId !== undefined) {
    input.pengajarId = requiredString(body.pengajarId, "pengajarId");
  }
  return input;
}

function parseSantriBody(body: Record<string, unknown>): adminService.CreateSantriInput {
  return {
    nis: requiredString(body.nis, "nis"),
    namaLengkap: requiredString(body.namaLengkap, "namaLengkap"),
    orangTuaId: requiredString(body.orangTuaId, "orangTuaId"),
    kelasId: requiredString(body.kelasId, "kelasId"),
  };
}

function parseUpdateSantriBody(body: Record<string, unknown>): adminService.UpdateSantriInput {
  const input: adminService.UpdateSantriInput = {};
  if (body.nis !== undefined) {
    input.nis = requiredString(body.nis, "nis");
  }
  if (body.namaLengkap !== undefined) {
    input.namaLengkap = requiredString(body.namaLengkap, "namaLengkap");
  }
  if (body.orangTuaId !== undefined) {
    input.orangTuaId = requiredString(body.orangTuaId, "orangTuaId");
  }
  if (body.kelasId !== undefined) {
    input.kelasId = requiredString(body.kelasId, "kelasId");
  }
  return input;
}

function parseMateriBody(body: Record<string, unknown>): adminService.CreateMateriInput {
  return {
    namaSurah: requiredString(body.namaSurah, "namaSurah"),
    noUrut: body.noUrut !== undefined ? Number(body.noUrut) : undefined,
    juz: Number(body.juz),
    totalAyat: Number(body.totalAyat),
  };
}

function parseUpdateMateriBody(body: Record<string, unknown>): adminService.UpdateMateriInput {
  const input: adminService.UpdateMateriInput = {};
  if (body.namaSurah !== undefined) {
    input.namaSurah = requiredString(body.namaSurah, "namaSurah");
  }
  if (body.noUrut !== undefined) {
    input.noUrut = Number(body.noUrut);
  }
  if (body.juz !== undefined) {
    input.juz = Number(body.juz);
  }
  if (body.totalAyat !== undefined) {
    input.totalAyat = Number(body.totalAyat);
  }
  return input;
}

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getStats();
  res.json({ success: true, data });
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listUsers();
  res.json({ success: true, data });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.getUserById(parseId(req.params.id));
  res.json({ success: true, data });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createUser(parseCreateUserBody(req.body));
  res.status(201).json({
    success: true,
    message: "Akun baru berhasil dibuat",
    data,
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateUser(
    parseId(req.params.id),
    parseUpdateUserBody(req.body)
  );
  res.json({
    success: true,
    message: "Akun berhasil diperbarui",
    data,
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteUser(req.user!.id, parseId(req.params.id));
  res.json({
    success: true,
    message: "Akun berhasil dihapus",
  });
});

export const listKelas = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listKelasAdmin();
  res.json({ success: true, data });
});

export const createKelas = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createKelas(parseKelasBody(req.body));
  res.status(201).json({
    success: true,
    message: "Kelas berhasil dibuat",
    data,
  });
});

export const updateKelas = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateKelas(
    parseId(req.params.id),
    parseUpdateKelasBody(req.body)
  );
  res.json({
    success: true,
    message: "Kelas berhasil diperbarui",
    data,
  });
});

export const deleteKelas = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteKelas(parseId(req.params.id));
  res.json({
    success: true,
    message: "Kelas berhasil dihapus",
  });
});

export const listSantri = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listSantriAdmin();
  res.json({ success: true, data });
});

export const createSantri = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createSantri(parseSantriBody(req.body));
  res.status(201).json({
    success: true,
    message: "Santri berhasil ditambahkan",
    data,
  });
});

export const updateSantri = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateSantri(
    parseId(req.params.id),
    parseUpdateSantriBody(req.body)
  );
  res.json({
    success: true,
    message: "Data santri berhasil diperbarui",
    data,
  });
});

export const deleteSantri = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteSantri(parseId(req.params.id));
  res.json({
    success: true,
    message: "Santri berhasil dihapus",
  });
});

export const listMateri = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listMateriAdmin();
  res.json({ success: true, data });
});

export const createMateri = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createMateri(parseMateriBody(req.body));
  res.status(201).json({
    success: true,
    message: "Materi berhasil ditambahkan",
    data,
  });
});

export const updateMateri = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateMateri(
    parseId(req.params.id),
    parseUpdateMateriBody(req.body)
  );
  res.json({
    success: true,
    message: "Materi berhasil diperbarui",
    data,
  });
});

export const deleteMateri = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteMateri(parseId(req.params.id));
  res.json({
    success: true,
    message: "Materi berhasil dihapus",
  });
});

function parseSetoranTanggal(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "tanggalSetoran tidak valid");
  }
  return date.toISOString();
}

function parseSetoranAngka(value: unknown, field: string): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new ApiError(400, `${field} harus bilangan bulat lebih dari 0`);
  }
  return num;
}

export const createSetoran = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as Record<string, unknown>;

  const santriId = requiredString(b.santriId, "santriId");
  const materiId = requiredString(b.materiId, "materiId");

  if (
    b.jenisSetoran !== JenisSetoran.ZIYADAH &&
    b.jenisSetoran !== JenisSetoran.MUROJAAH
  ) {
    throw new ApiError(400, "jenisSetoran harus ZIYADAH atau MUROJAAH");
  }
  if (
    b.sumberInput !== SumberInput.SEKOLAH &&
    b.sumberInput !== SumberInput.RUMAH
  ) {
    throw new ApiError(400, "sumberInput harus SEKOLAH atau RUMAH");
  }

  const mulai = parseSetoranAngka(b.ayatMulai, "ayatMulai");
  const selesai = parseSetoranAngka(b.ayatSelesai, "ayatSelesai");
  if (selesai < mulai) {
    throw new ApiError(400, "ayatSelesai tidak boleh kurang dari ayatMulai");
  }

  const input: CreateKartuKontrolInput = {
    santriId,
    materiId,
    jenisSetoran: b.jenisSetoran as JenisSetoran,
    sumberInput: b.sumberInput as SumberInput,
    ayatMulai: mulai,
    ayatSelesai: selesai,
    nilai:
      typeof b.nilai === "string" && b.nilai.trim() !== ""
        ? b.nilai.trim()
        : null,
    catatan: typeof b.catatan === "string" ? b.catatan.trim() : null,
    tanggalSetoran: parseSetoranTanggal(b.tanggalSetoran),
  };

  const data = await createKartuKontrol(req.user!, input);
  res.status(201).json({
    success: true,
    message: "Setoran hafalan berhasil ditambahkan",
    data,
  });
});

export const updateSetoran = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as Record<string, unknown>;
  const input: UpdateKartuKontrolInput = {};

  if (b.santriId !== undefined) {
    input.santriId = requiredString(b.santriId, "santriId");
  }
  if (b.materiId !== undefined) {
    input.materiId = requiredString(b.materiId, "materiId");
  }
  if (b.jenisSetoran !== undefined) {
    if (
      b.jenisSetoran !== JenisSetoran.ZIYADAH &&
      b.jenisSetoran !== JenisSetoran.MUROJAAH
    ) {
      throw new ApiError(400, "jenisSetoran harus ZIYADAH atau MUROJAAH");
    }
    input.jenisSetoran = b.jenisSetoran as JenisSetoran;
  }
  if (b.sumberInput !== undefined) {
    if (
      b.sumberInput !== SumberInput.SEKOLAH &&
      b.sumberInput !== SumberInput.RUMAH
    ) {
      throw new ApiError(400, "sumberInput harus SEKOLAH atau RUMAH");
    }
    input.sumberInput = b.sumberInput as SumberInput;
  }
  if (b.tanggalSetoran !== undefined) {
    input.tanggalSetoran =
      typeof b.tanggalSetoran === "string" && b.tanggalSetoran.trim() !== ""
        ? new Date(b.tanggalSetoran).toISOString()
        : null;
  }
  if (b.ayatMulai !== undefined) {
    input.ayatMulai = parseSetoranAngka(b.ayatMulai, "ayatMulai");
  }
  if (b.ayatSelesai !== undefined) {
    input.ayatSelesai = parseSetoranAngka(b.ayatSelesai, "ayatSelesai");
  }
  if (b.nilai !== undefined) {
    input.nilai =
      typeof b.nilai === "string" && b.nilai.trim() !== ""
        ? b.nilai.trim()
        : null;
  }
  if (b.catatan !== undefined) {
    input.catatan =
      typeof b.catatan === "string" ? b.catatan.trim() || null : null;
  }

  const data = await updateKartuKontrol(req.user!, parseId(req.params.id), input);
  res.json({
    success: true,
    message: "Data kartu kontrol berhasil diperbarui",
    data,
  });
});

export const listSetoran = asyncHandler(async (req: Request, res: Response) => {
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

  const result = await listKartuKontrol(req.user!, {
    santriId: typeof santriId === "string" && santriId ? santriId : undefined,
    sumberInput: sumberInput as SumberInput | undefined,
    jenisSetoran: jenisSetoran as JenisSetoran | undefined,
    page: pageNum,
    limit: limitNum,
  });

  res.json({ success: true, data: result });
});