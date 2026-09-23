import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type PushNotificationSchema,
  type ActionPerformed,
} from "@capacitor/push-notifications";
import { toastController } from "@ionic/vue";
import api from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

let currentToken = "";
let bound = false;

export function isPushSupported(): boolean {
  return Capacitor.isNativePlatform();
}

async function attachToken(token: string, authToken?: string): Promise<void> {
  try {
    await api.post(
      "/push/register",
      { token, platform: "android" },
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
    );
  } catch {
    // token terdaftar kemudian saat bindPushToAccount dipanggil
  }
}

async function showForegroundNotif(notification: PushNotificationSchema): Promise<void> {
  const toast = await toastController.create({
    header: notification.title ?? "HafalTrack",
    message: notification.body ?? "",
    duration: 4000,
    position: "top",
    buttons: [
      {
        text: "Buka",
        handler: () => {
          const auth = useAuthStore();
          void import("@/router").then(({ default: router }) =>
            router.push(auth.berandaPath)
          );
        },
      },
    ],
  });
  await toast.present();
}

export async function initPush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  try {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === "prompt") {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== "granted") {
      return;
    }

    await PushNotifications.register();

    void PushNotifications.addListener("registration", ({ value }) => {
      currentToken = value;
      void attachToken(value);
    });
    void PushNotifications.addListener("registrationError", ({ error }) => {
      console.error("[push] registration error:", error);
    });
    void PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        void showForegroundNotif(notification);
      }
    );
    void PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (performed: ActionPerformed) => {
        const auth = useAuthStore();
        if (auth.isAuthenticated) {
          void import("@/router").then(({ default: router }) =>
            router.push(auth.berandaPath)
          );
        }
      }
    );
  } catch (err) {
    console.error("[push] init error:", err);
  }
}

export async function bindPushToAccount(): Promise<void> {
  if (!Capacitor.isNativePlatform() || bound) {
    return;
  }
  if (currentToken) {
    bound = true;
    void attachToken(currentToken);
  }
}

export async function unregisterPush(authToken?: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !currentToken) {
    return;
  }
  const token = currentToken;
  currentToken = "";
  bound = false;
  try {
    await api.post(
      "/push/unregister",
      { token },
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
    );
  } catch {
    // abaikan
  }
}