import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "../config/env";
import { prisma } from "./prisma";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

let app: App | null = null;

function getFcmApp(): App | null {
  if (!env.firebaseServiceAccount) {
    return null;
  }
  if (getApps().length === 0) {
    try {
      app = initializeApp({
        credential: cert(JSON.parse(env.firebaseServiceAccount as string)),
      });
    } catch (err) {
      console.error("[fcm] gagal init firebase-admin:", err);
      return null;
    }
  } else {
    app = getApps()[0];
  }
  return app;
}

export function isPushEnabled(): boolean {
  return Boolean(env.firebaseServiceAccount);
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  if (!userIds || userIds.length === 0) {
    return;
  }
  try {
    const fcmApp = getFcmApp();
    if (!fcmApp) {
      return;
    }
    const tokens = await prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    if (tokens.length === 0) {
      return;
    }
    const messaging = getMessaging(fcmApp);
    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize).map((t) => t.token);
      await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
      });
    }
  } catch (err) {
    console.error("[fcm] gagal kirim push:", err);
  }
}