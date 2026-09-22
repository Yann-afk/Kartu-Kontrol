<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/pengajar" />
        </ion-buttons>
        <ion-title>Riwayat Kelas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="field-label">Kelas</label>
            <select v-model="selectedKelas" class="field-input" @change="onKelasChange">
              <option value="">Semua Kelas</option>
              <option v-for="k in hafalan.kelasList" :key="k.id" :value="k.id">
                {{ k.namaKelas }}
              </option>
            </select>
          </div>
          <div>
            <label class="field-label">Santri</label>
            <select
              v-model="selectedSantri"
              class="field-input"
              @change="onSantriChange"
            >
              <option value="">Semua Santri</option>
              <option
                v-for="s in santriOptions"
                :key="s.id"
                :value="s.id"
              >
                {{ s.namaLengkap }}
                <template v-if="s.kelas"> ({{ s.kelas.namaKelas }})</template>
              </option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500">
            {{ hafalan.feedMeta.total }} setoran
          </p>
          <div class="flex gap-2">
            <button
              v-for="f in filters"
              :key="f.value"
              type="button"
              class="chip-base"
              :class="
                hafalan.sumberFilter === f.value ? 'chip-active' : 'chip-inactive'
              "
              @click="hafalan.setSumberFilter(f.value)"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div class="mt-3 space-y-3">
          <div
            v-if="hafalan.loading && hafalan.feed.length === 0"
            class="space-y-3"
          >
            <div
              v-for="i in 4"
              :key="i"
              class="h-36 animate-pulse rounded-xl bg-slate-200"
            />
          </div>

          <p
            v-else-if="hafalan.error"
            class="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600"
          >
            {{ hafalan.error }}
          </p>

          <div
            v-else-if="hafalan.feed.length === 0"
            class="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center text-sm text-slate-400"
          >
            Belum ada setoran untuk filter ini.
          </div>

          <KartuKontrolCard
            v-for="kartu in hafalan.feed"
            :key="kartu.id"
            :kartu="kartu"
          >
            <template #actions>
              <div class="mt-3">
                <ion-button
                  v-if="
                    kartu.sumberInput === 'RUMAH' &&
                    !kartu.isVerifiedByPengajar
                  "
                  size="small"
                  shape="round"
                  color="success"
                  @click="verifikasi(kartu.id)"
                >
                  Verifikasi Setoran Rumah
                </ion-button>
                <span
                  v-else-if="kartu.sumberInput === 'RUMAH'"
                  class="text-xs font-medium text-teal-600"
                >
                  Setoran rumah terverifikasi
                </span>
              </div>
            </template>
          </KartuKontrolCard>

          <div class="pt-2 text-center">
            <ion-button
              v-if="hafalan.hasMore"
              fill="outline"
              shape="round"
              :disabled="hafalan.loadingMore"
              @click="hafalan.muatLebih()"
            >
              <ion-spinner v-if="hafalan.loadingMore" name="crescent" />
              <template v-else>Muat lebih banyak</template>
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="showInput = true">
        <span class="text-2xl">+</span>
      </ion-fab-button>
    </ion-fab>

    <ion-modal :is-open="showInput" @did-dismiss="showInput = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Tambah Setoran</ion-title>
          <ion-buttons slot="end">
            <ion-button
              fill="clear"
              @click="showInput = false"
            >
              Tutup
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <InputSetoranForm
          :show-santri-select="!selectedSantri"
          :santri="selectedSantriDetail"
          :santri-options="santriOptions"
          @submitted="onSubmitted"
        />
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonModal,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  toastController,
} from "@ionic/vue";
import { useHafalanStore } from "@/stores/hafalan";
import KartuKontrolCard from "@/components/KartuKontrolCard.vue";
import InputSetoranForm from "@/components/InputSetoranForm.vue";
import type { SumberInput } from "@/types";

const hafalan = useHafalanStore();

const selectedKelas = ref<string>(hafalan.kelasFilterId ?? "");
const selectedSantri = ref<string>(hafalan.santriFilterId ?? "");
const showInput = ref(false);

const filters = [
  { label: "Semua", value: "" as SumberInput | "" },
  { label: "Sekolah", value: "SEKOLAH" as SumberInput },
  { label: "Rumah", value: "RUMAH" as SumberInput },
];

const santriOptions = computed(() => {
  if (!selectedKelas.value) {
    return hafalan.santriList;
  }
  return hafalan.santriList.filter((s) => s.kelas?.id === selectedKelas.value);
});

const selectedSantriDetail = computed(
  () =>
    hafalan.santriList.find((s) => s.id === selectedSantri.value) ?? null
);

function onKelasChange(): void {
  selectedSantri.value = "";
  hafalan.setKelasFilter(selectedKelas.value || null);
  void hafalan.fetchFeed(1);
}

function onSantriChange(): void {
  hafalan.setSantriFilter(selectedSantri.value || null);
}

async function verifikasi(id: string): Promise<void> {
  const updated = await hafalan.verifikasiSetoran(id);
  const toast = await toastController.create({
    message: updated
      ? "Setoran rumah berhasil diverifikasi"
      : hafalan.error ?? "Gagal verifikasi",
    duration: 2200,
    color: updated ? "success" : "danger",
    position: "bottom",
  });
  await toast.present();
}

function onSubmitted(): void {
  showInput.value = false;
}

onMounted(() => {
  void hafalan.fetchKelas();
  void hafalan.fetchSantri();
  if (selectedKelas.value) {
    void hafalan.fetchFeed(1);
  }
});
</script>