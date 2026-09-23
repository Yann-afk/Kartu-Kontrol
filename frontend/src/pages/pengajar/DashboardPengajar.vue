<template>
  <ion-page>
    <ion-header v-if="!isMobile">
      <ion-toolbar>
        <ion-title>HafalTrack</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-4xl">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">
              Halo, {{ auth.namaLengkap }}
            </h1>
            <p class="text-sm text-slate-500">Dashboard Pengajar</p>
          </div>
          <ion-button fill="outline" size="small" color="danger" @click="logout">
            Keluar
          </ion-button>
        </div>

        <div
          v-if="hafalan.loading && hafalan.kelasList.length === 0"
          class="mt-6 grid grid-cols-3 gap-3"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="h-24 animate-pulse rounded-xl bg-slate-200"
          />
        </div>

        <div v-else class="mt-6 grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Kelas Diampu</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ hafalan.kelasList.length }}
            </p>
          </div>
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Total Santri</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ totalSantri }}
            </p>
          </div>
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Total Setoran</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ hafalan.feedMeta.total }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <ion-button
            shape="round"
            size="small"
            fill="outline"
            color="secondary"
            @click="router.push('/rekap')"
          >
            Rekap
          </ion-button>
          <ion-button
            shape="round"
            size="small"
            fill="outline"
            color="tertiary"
            @click="router.push('/statistik')"
          >
            Statistik
          </ion-button>
          <ion-button
            shape="round"
            size="small"
            fill="outline"
            color="success"
            @click="router.push('/pesan')"
          >
            Pesan Ortu
          </ion-button>
          <ion-button
            shape="round"
            size="small"
            fill="outline"
            color="medium"
            @click="router.push('/profil')"
          >
            Profil
          </ion-button>
        </div>

        <div class="mt-8 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800">Kelas (Halaqoh)</h2>
          <ion-button
            size="small"
            shape="round"
            @click="openRiwayat('')"
          >
            Semua Riwayat
          </ion-button>
        </div>

        <div v-if="hafalan.kelasList.length === 0" class="mt-3">
          <div class="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            Belum ada kelas yang diampu. Hubungi Admin.
          </div>
        </div>

        <button
          v-for="kelas in hafalan.kelasList"
          :key="kelas.id"
          class="mt-3 flex w-full items-center justify-between rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:ring-indigo-300"
          @click="openRiwayat(kelas.id)"
        >
          <div>
            <p class="font-semibold text-slate-800">{{ kelas.namaKelas }}</p>
            <p class="text-sm text-slate-500">
              {{ kelas._count?.santri ?? 0 }} santri
            </p>
          </div>
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
          >
            &rarr;
          </span>
        </button>

        <div class="mt-8">
          <h2 class="text-lg font-bold text-slate-800">Setoran Terbaru</h2>
          <div
            v-if="hafalan.loading && hafalan.feed.length === 0"
            class="mt-3 space-y-3"
          >
            <div
              v-for="i in 3"
              :key="i"
              class="h-32 animate-pulse rounded-xl bg-slate-200"
            />
          </div>
          <div v-else-if="hafalan.feed.length === 0" class="mt-3">
            <div class="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
              Belum ada setoran hafalan.
            </div>
          </div>
          <div v-else class="mt-3 space-y-3">
            <KartuKontrolCard
              v-for="kartu in hafalan.feed.slice(0, 3)"
              :key="kartu.id"
              :kartu="kartu"
            />
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { IonButton, IonContent, IonPage, IonTitle, IonToolbar, IonHeader } from "@ionic/vue";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import KartuKontrolCard from "@/components/KartuKontrolCard.vue";

const router = useRouter();
const auth = useAuthStore();
const hafalan = useHafalanStore();

const isMobile = computed(() => window.innerWidth < 768);

const totalSantri = computed(() =>
  hafalan.santriList.length
);

function openRiwayat(kelasId: string): void {
  hafalan.setKelasFilter(kelasId || null);
  void router.push("/pengajar/riwayat");
}

function logout(): void {
  auth.logout();
  hafalan.reset();
  void router.replace("/login");
}

onMounted(() => {
  void hafalan.fetchKelas();
  void hafalan.fetchSantri();
  void hafalan.fetchFeed(1);
});
</script>