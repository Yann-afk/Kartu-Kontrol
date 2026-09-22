import express from "express";
import cors from "cors";
import helmet from "helmet";
import { routes } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "HafalTrack API aktif" });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
