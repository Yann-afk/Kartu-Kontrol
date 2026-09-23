import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import { signToken } from "../utils/jwt";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email dan password wajib diisi");
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new ApiError(401, "Email atau password salah");
  }

  const match = await bcrypt.compare(String(password), user.password);
  if (!match) {
    throw new ApiError(401, "Email atau password salah");
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    },
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      pengajar: { select: { id: true, namaLengkap: true, nip: true, noHp: true } },
      orangTua: { select: { id: true, namaLengkap: true, noHp: true, alamat: true } },
    },
  });

  if (!user) {
    throw new ApiError(404, "User tidak ditemukan");
  }

  const namaLengkap =
    user.pengajar?.namaLengkap ?? user.orangTua?.namaLengkap ?? null;

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      namaLengkap,
      createdAt: user.createdAt,
      profil: user.pengajar ?? user.orangTua ?? null,
    },
  });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const body = req.body ?? {};

  const namaLengkap =
    typeof body.namaLengkap === "string" && body.namaLengkap.trim() !== ""
      ? body.namaLengkap.trim()
      : undefined;
  const noHp =
    typeof body.noHp === "string" && body.noHp.trim() !== ""
      ? body.noHp.trim().slice(0, 20)
      : null;
  const nip =
    typeof body.nip === "string" && body.nip.trim() !== ""
      ? body.nip.trim().slice(0, 30)
      : null;
  const alamat =
    typeof body.alamat === "string" && body.alamat.trim() !== ""
      ? body.alamat.trim()
      : null;

  if (user.role === "PENGAJAR") {
    const ownId = user.id;
    const data: { namaLengkap?: string; noHp?: string | null; nip?: string | null } = {};
    if (namaLengkap !== undefined) data.namaLengkap = namaLengkap;
    if (noHp !== undefined) data.noHp = noHp;
    if (nip !== undefined) data.nip = nip;

    const pengajar = await prisma.pengajar.findUnique({ where: { userId: ownId } });
    if (!pengajar) {
      throw new ApiError(404, "Profil pengajar tidak ditemukan");
    }
    await prisma.pengajar.update({ where: { userId: ownId }, data });
  } else if (user.role === "ORANG_TUA") {
    const ownId = user.id;
    const data: { namaLengkap?: string; noHp?: string | null; alamat?: string | null } = {};
    if (namaLengkap !== undefined) data.namaLengkap = namaLengkap;
    if (noHp !== undefined) data.noHp = noHp;
    if (alamat !== undefined) data.alamat = alamat;

    const orangTua = await prisma.orangTua.findUnique({ where: { userId: ownId } });
    if (!orangTua) {
      throw new ApiError(404, "Profil orang tua tidak ditemukan");
    }
    await prisma.orangTua.update({ where: { userId: ownId }, data });
  } else {
    throw new ApiError(403, "Profil tidak dapat diubah untuk peran ini");
  }

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      pengajar: { select: { id: true, namaLengkap: true, nip: true, noHp: true } },
      orangTua: { select: { id: true, namaLengkap: true, noHp: true, alamat: true } },
    },
  });

  const namaLengkapBaru =
    updated?.pengajar?.namaLengkap ?? updated?.orangTua?.namaLengkap ?? null;

  res.json({
    success: true,
    message: "Profil berhasil diperbarui",
    data: {
      id: updated!.id,
      email: updated!.email,
      role: updated!.role,
      namaLengkap: namaLengkapBaru,
      createdAt: updated!.createdAt,
      profil: updated!.pengajar ?? updated!.orangTua ?? null,
    },
  });
});
