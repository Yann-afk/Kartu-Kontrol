import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import { prisma } from "../utils/prisma";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const body = req.body ?? {};
  const rawToken = body.token as unknown;
  const rawPlatform = body.platform as unknown;

  if (typeof rawToken !== "string" || rawToken.trim() === "") {
    throw new ApiError(400, "token wajib diisi");
  }
  const token = rawToken.trim();
  const platform =
    typeof rawPlatform === "string" && rawPlatform.trim() !== ""
      ? rawPlatform.trim().slice(0, 50)
      : "android";

  const existing = await prisma.pushToken.findUnique({ where: { token } });
  if (existing && existing.userId !== userId) {
    await prisma.pushToken.update({
      where: { id: existing.id },
      data: { userId, platform },
    });
  } else if (!existing) {
    await prisma.pushToken.create({
      data: { userId, token, platform },
    });
  }

  res.json({ success: true, data: { registered: true } });
});

export const unregister = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const body = req.body ?? {};
  const rawToken = body.token as unknown;

  if (typeof rawToken === "string" && rawToken.trim() !== "") {
    const existing = await prisma.pushToken.findUnique({
      where: { token: rawToken.trim() },
    });
    if (existing && existing.userId === userId) {
      await prisma.pushToken.delete({ where: { id: existing.id } });
    }
  }

  res.json({ success: true, data: { registered: false } });
});