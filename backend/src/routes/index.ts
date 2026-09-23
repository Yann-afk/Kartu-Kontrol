import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import * as authController from "../controllers/auth.controller";
import * as kartuKontrolController from "../controllers/kartu-kontrol.controller";
import * as masterController from "../controllers/master.controller";
import * as adminController from "../controllers/admin.controller";
import * as pushController from "../controllers/push.controller";
import * as pesanController from "../controllers/pesan.controller";
import * as laporanController from "../controllers/laporan.controller";

export const routes = Router();

routes.post("/auth/login", authController.login);
routes.get("/auth/me", authenticate, authController.me);
routes.patch("/auth/me", authenticate, authController.updateMe);

routes.post("/push/register", authenticate, pushController.register);
routes.post("/push/unregister", authenticate, pushController.unregister);

routes.get("/pesan", authenticate, pesanController.list);
routes.post("/pesan", authenticate, pesanController.create);

routes.get("/rekap", authenticate, laporanController.rekap);
routes.get("/statistik", authenticate, laporanController.statistik);

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

const adminOnly = requireRole(Role.ADMIN);

routes.get("/admin/stats", authenticate, adminOnly, adminController.getStats);

routes.get("/admin/users", authenticate, adminOnly, adminController.listUsers);
routes.post("/admin/users", authenticate, adminOnly, adminController.createUser);
routes.get("/admin/users/:id", authenticate, adminOnly, adminController.getUserById);
routes.patch("/admin/users/:id", authenticate, adminOnly, adminController.updateUser);
routes.delete("/admin/users/:id", authenticate, adminOnly, adminController.deleteUser);

routes.get("/admin/kelas", authenticate, adminOnly, adminController.listKelas);
routes.post("/admin/kelas", authenticate, adminOnly, adminController.createKelas);
routes.patch("/admin/kelas/:id", authenticate, adminOnly, adminController.updateKelas);
routes.delete("/admin/kelas/:id", authenticate, adminOnly, adminController.deleteKelas);

routes.get("/admin/santri", authenticate, adminOnly, adminController.listSantri);
routes.post("/admin/santri", authenticate, adminOnly, adminController.createSantri);
routes.patch("/admin/santri/:id", authenticate, adminOnly, adminController.updateSantri);
routes.delete("/admin/santri/:id", authenticate, adminOnly, adminController.deleteSantri);

routes.get("/admin/materi", authenticate, adminOnly, adminController.listMateri);
routes.post("/admin/materi", authenticate, adminOnly, adminController.createMateri);
routes.patch("/admin/materi/:id", authenticate, adminOnly, adminController.updateMateri);
routes.delete("/admin/materi/:id", authenticate, adminOnly, adminController.deleteMateri);

routes.get(
  "/admin/kartu-kontrol",
  authenticate,
  adminOnly,
  adminController.listSetoran
);
routes.post(
  "/admin/kartu-kontrol",
  authenticate,
  adminOnly,
  adminController.createSetoran
);
routes.patch(
  "/admin/kartu-kontrol/:id",
  authenticate,
  adminOnly,
  adminController.updateSetoran
);
