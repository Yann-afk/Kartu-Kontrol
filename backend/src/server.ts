import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`HafalTrack API berjalan di port ${env.port}`);
});
