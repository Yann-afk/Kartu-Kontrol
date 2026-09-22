<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/orangtua" />
        </ion-buttons>
        <ion-title>Feed Hafalan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl">
        <div
          v-if="anakAktif"
          class="flex flex-wrap items-center justify-between gap-2"
        >
          <p class="text-sm font-semibold text-slate-700">
            {{ anakAktif.namaLengkap }}
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

        <div class="mt-4 space-y-3">
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
            Belum ada riwayat hafalan.
            <br />
            Setoran Sekolah tampil hijau, setoran Rumah tampil biru.
          </div>

          <KartuKontrolCard
            v-for="kartu in hafalan.feed"
            :key="kartu.id"
            :kartu="kartu"
          />

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
          <ion-title>Tambah Setoran Rumah</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="showInput = false">
              Tutup
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <InputSetoranForm
          :santri="anakAktif"
          :show-santri-select="false"
          :santri-options="hafalan.anakList"
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
} from "@ionic/vue";
import { useHafalanStore } from "@/stores/hafalan";
import KartuKontrolCard from "@/components/KartuKontrolCard.vue";
import InputSetoranForm from "@/components/InputSetoranForm.vue";
import type { SumberInput } from "@/types";

const hafalan = useHafalanStore();

const showInput = ref(false);
const anakAktif = computed(() => hafalan.anakAktif);

const filters = [
  { label: "Semua", value: "" as SumberInput | "" },
  { label: "Sekolah", value: "SEKOLAH" as SumberInput },
  { label: "Rumah", value: "RUMAH" as SumberInput },
];

function onSubmitted(): void {
  showInput.value = false;
}

onMounted(() => {
  if (!hafalan.anakAktif) {
    void hafalan.fetchAnak().then(() => void hafalan.fetchFeed(1));
  } else {
    void hafalan.fetchFeed(1);
  }
});
</script>