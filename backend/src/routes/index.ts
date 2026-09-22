import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import * as authController from "../controllers/auth.controller";
import * as kartuKontrolController from "../controllers/kartu-kontrol.controller";
import * as masterController from "../controllers/master.controller";

export const routes = Router();

routes.post("/auth/login", authController.login);
routes.get("/auth/me", authenticate, authController.me);

routes.get("/materi", authenticate, masterController.listMateri);
routes.get("/kelas", authenticate, masterController.listKelas);
routes.get("/santri", authenticate, masterController.listSantri);

routes.post(
  "/kartu-kontrol",
  authenticate,
  requireRole(Role.PENGAJAR, Role.ORANG_TUA),
  kartuKontrolController.create
);
routes.get("/kartu-kontrol", authenticate, kartuKontrolController.list);
routes.get("/kartu-kontrol/:id", authenticate, kartuKontrolController.getById);
routes.patch(
  "/kartu-kontrol/:id",
  authenticate,
  requireRole(Role.PENGAJAR, Role.ADMIN),
  kartuKontrolController.update
);
routes.patch(
  "/kartu-kontrol/:id/verify",
  authenticate,
  requireRole(Role.PENGAJAR),
  kartuKontrolController.verify
);
routes.delete(
  "/kartu-kontrol/:id",
  authenticate,
  requireRole(Role.ADMIN),
  kartuKontrolController.remove
);
