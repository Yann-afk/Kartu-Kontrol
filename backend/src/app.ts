import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { routes } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    service: "HafalTrack API",
    message:
      "API aktif. Gunakan /api/health untuk cek status, atau lihat dokumentasi endpoint di bawah.",
    endpoints: [
      "POST /api/auth/login",
      "GET /api/auth/me",
      "GET /api/materi",
      "GET /api/kelas",
      "GET /api/santri",
      "GET /api/kartu-kontrol",
      "POST /api/kartu-kontrol",
    ],
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "HafalTrack API aktif" });
});

app.get("/api/download/apk", (_req, res) => {
  res.download(
    path.join(__dirname, "../public/app.apk"),
    "hafaltrack-v1.0.apk"
  );
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
