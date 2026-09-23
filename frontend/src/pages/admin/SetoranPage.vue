<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin" />
        </ion-buttons>
        <ion-title>Semua Setoran</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl">
        <div class="mt-1 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <button
            v-for="f in sumberFilters"
            :key="f.value || 'all'"
            type="button"
            class="chip-base"
            :class="sumberFilter === f.value ? 'chip-active' : 'chip-inactive'"
            @click="onSumber(f.value)"
          >
            {{ f.label }}
          </button>
          <span class="mx-1 h-5 w-px bg-slate-200" />
          <button
            v-for="f in jenisFilters"
            :key="f.value || 'all'"
            type="button"
            class="chip-base"
            :class="jenisFilter === f.value ? 'chip-active' : 'chip-inactive'"
            @click="onJenis(f.value)"
          >
            {{ f.label }}
          </button>
        </div>

        <p class="mt-4 text-sm font-semibold text-slate-600">
          {{ admin.feedMeta.total }} setoran
        </p>

        <p
          v-if="admin.error"
          class="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600"
        >
          {{ admin.error }}
        </p>

        <div class="mt-3 space-y-3">
          <div v-if="admin.loading && admin.feed.length === 0" class="space-y-3">
            <div v-for="i in 4" :key="i" class="h-36 animate-pulse rounded-xl bg-slate-200" />
          </div>

          <div
            v-else-if="admin.feed.length === 0"
            class="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center text-sm text-slate-400"
          >
            Belum ada setoran untuk filter ini.
          </div>

          <KartuKontrolCard
            v-for="kartu in admin.feed"
            :key="kartu.id"
            :kartu="kartu"
          >
            <template #actions>
              <div class="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
                <span class="truncate text-xs text-slate-400">
                  {{ kartu.disimakOleh.email }}
                </span>
                <ion-button
                  fill="clear"
                  size="small"
                  color="danger"
                  @click="confirmDelete(kartu)"
                >
                  Hapus Setoran
                </ion-button>
              </div>
            </template>
          </KartuKontrolCard>

          <div class="pt-2 text-center">
            <ion-button
              v-if="admin.hasMore"
              fill="outline"
              shape="round"
              :disabled="admin.loadingMore"
              @click="admin.muatLebih()"
            >
              <ion-spinner v-if="admin.loadingMore" name="crescent" />
              <template v-else>Muat lebih banyak</template>
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  IonBackButton,
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  alertController,
  toastController,
} from "@ionic/vue";
import { useAdminStore } from "@/stores/admin";
import KartuKontrolCard from "@/components/KartuKontrolCard.vue";
import type { JenisSetoran, KartuKontrol, SumberInput } from "@/types";

const admin = useAdminStore();

const sumberFilter = ref<SumberInput | "">("");
const jenisFilter = ref<JenisSetoran | "">("");

const sumberFilters = [
  { label: "Semua Sumber", value: "" as SumberInput | "" },
  { label: "Sekolah", value: "SEKOLAH" as SumberInput },
  { label: "Rumah", value: "RUMAH" as SumberInput },
];

const jenisFilters = [
  { label: "Semua Jenis", value: "" as JenisSetoran | "" },
  { label: "Ziyadah", value: "ZIYADAH" as JenisSetoran },
  { label: "Muroja'ah", value: "MUROJAAH" as JenisSetoran },
];

function onSumber(value: SumberInput | ""): void {
  sumberFilter.value = value;
  void admin.fetchFeed(1, { sumberInput: value, jenisSetoran: jenisFilter.value });
}

function onJenis(value: JenisSetoran | ""): void {
  jenisFilter.value = value;
  void admin.fetchFeed(1, { sumberInput: sumberFilter.value, jenisSetoran: value });
}

async function showToast(message: string, color: "success" | "danger"): Promise<void> {
  const toast = await toastController.create({
    message,
    duration: 2200,
    color,
    position: "bottom",
  });
  await toast.present();
}

async function confirmDelete(kartu: KartuKontrol): Promise<void> {
  const alert = await alertController.create({
    header: "Hapus setoran?",
    message: `Setoran ${kartu.santri.namaLengkap} — ${kartu.materi.namaSurah} (ayat ${kartu.ayatMulai}–${kartu.ayatSelesai}) akan dihapus permanen.`,
    buttons: [
      { text: "Batal", role: "cancel" },
      {
        text: "Hapus",
        role: "destructive",
        handler: async () => {
          const ok = await admin.deleteSetoran(kartu.id);
          await showToast(
            ok ? "Setoran berhasil dihapus" : admin.error ?? "Gagal menghapus setoran",
            ok ? "success" : "danger"
          );
        },
      },
    ],
  });
  await alert.present();
}

onMounted(() => {
  void admin.fetchFeed(1);
});
</script>