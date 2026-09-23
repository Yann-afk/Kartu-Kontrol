import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { Capacitor } from "@capacitor/core";
import api from "@/api/axios";
import { extractError } from "@/utils/error";
import { APP_VERSION } from "@/constants/version";

interface VersionPayload {
  version: string;
  apkUrl: string;
}

function isNewer(latest: string, current: string): boolean {
  const a = latest.split(".").map((n) => Number(n) || 0);
  const b = current.split(".").map((n) => Number(n) || 0);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

export const useUpdateStore = defineStore("update", () => {
  const latest = ref<string | null>(null);
  const apkUrl = ref("");
  const error = ref<string | null>(null);
  const dismissed = ref(false);

  const hasUpdate = computed(
    () => !dismissed.value && latest.value !== null && isNewer(latest.value, APP_VERSION)
  );

  async function checkVersion(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      latest.value = null;
      return;
    }
    error.value = null;
    try {
      const res = await api.get("/version");
      const data = res.data.data as VersionPayload;
      latest.value = data.version;
      apkUrl.value = data.apkUrl;
    } catch (err) {
      error.value = extractError(err);
      latest.value = null;
    }
  }

  function openDownload(): void {
    if (!apkUrl.value) {
      return;
    }
    window.open(apkUrl.value, "_system");
  }

  function dismiss(): void {
    dismissed.value = true;
  }

  return {
    latest,
    apkUrl,
    error,
    dismissed,
    hasUpdate,
    checkVersion,
    openDownload,
    dismiss,
  };
});