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
