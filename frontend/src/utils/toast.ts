import { toastController } from "@ionic/vue";

export async function showToast(opts: {
  message: string;
  color?: string;
  duration?: number;
}): Promise<void> {
  const toast = await toastController.create({
    message: opts.message,
    duration: opts.duration ?? 2200,
    position: "bottom",
    color: opts.color ?? "success",
  });
  await toast.present();
}

export function toastSukses(message: string): Promise<void> {
  return showToast({ message, color: "success" });
}

export function toastGagal(message: string): Promise<void> {
  return showToast({ message, color: "danger" });
}