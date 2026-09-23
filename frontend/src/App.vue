<template>
  <ion-app>
    <ion-router-outlet />

    <div
      v-if="update.hasUpdate"
      class="fixed inset-x-0 top-0 z-[9999] bg-gradient-to-r from-amber-500 to-orange-600 px-4 pb-3 pt-2 shadow-lg"
    >
      <div class="mx-auto flex max-w-3xl items-center gap-3">
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white"
        >
          <ion-icon :icon="downloadOutline" class="text-lg" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-white">
            Versi baru HafalTrack v{{ update.latest }} tersedia
          </p>
          <p class="truncate text-xs text-amber-100">
            Unduh dan instal untuk fitur terbaru.
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-orange-600 shadow transition hover:brightness-95 active:scale-95"
          @click="update.openDownload()"
        >
          Unduh
        </button>
        <button
          type="button"
          aria-label="Tutup"
          class="shrink-0 text-amber-100 transition hover:text-white"
          @click="update.dismiss()"
        >
          <ion-icon icon="close" class="text-xl" />
        </button>
      </div>
    </div>
  </ion-app>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { IonApp, IonIcon, IonRouterOutlet } from "@ionic/vue";
import { close, downloadOutline } from "ionicons/icons";
import { useAuthStore } from "@/stores/auth";
import { useUpdateStore } from "@/stores/update";

const auth = useAuthStore();
const update = useUpdateStore();

onMounted(() => {
  if (auth.isAuthenticated) {
    void auth.fetchMe();
  }
  void update.checkVersion();
});
</script>