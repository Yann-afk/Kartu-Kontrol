import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/api-error";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Data tidak ditemukan",
      });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "Data duplikat, sudah terdaftar",
      });
      return;
    }
    if (err.code === "P2003") {
      res.status(400).json({
        success: false,
        message: "Relasi data tidak valid",
      });
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server",
  });
}
