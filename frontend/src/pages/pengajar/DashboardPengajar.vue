<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>HafalTrack</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" color="medium" @click="logout">
            <ion-icon slot="icon-only" icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content
          pulling-text="Tarik untuk memperbarui…"
          refreshing-text="Memuat…"
        />
      </ion-refresher>

      <div class="mx-auto max-w-4xl">
        <div
          class="hero-gradient from-indigo-600 via-violet-600 to-fuchsia-600"
        >
          <div class="flex items-center gap-4">
            <span
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl"
            >
              <ion-icon icon="bookOutline" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-indigo-100">{{ tglHariIni }}</p>
              <h1 class="truncate text-xl font-black">Halo, {{ namaSingkat }}</h1>
              <p class="text-sm text-indigo-100">Dashboard Pengajar</p>
            </div>
          </div>
        </div>

        <div v-if="hafalan.loading && hafalan.kelasList.length === 0" class="mt-4 grid grid-cols-3 gap-3">
          <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div v-else class="mt-4 grid grid-cols-3 gap-3">
          <div class="stat-tile">
            <p class="text-xs font-medium text-slate-500">Kelas Diampu</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ hafalan.kelasList.length }}
            </p>
          </div>
          <div class="stat-tile">
            <p class="text-xs font-medium text-slate-500">Total Santri</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">{{ totalSantri }}</p>
          </div>
          <div class="stat-tile">
            <p class="text-xs font-medium text-slate-500">Total Setoran</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ hafalan.feedMeta.total }}
            </p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-4 gap-2">
          <button
            v-for="a in aksi"
            :key="a.label"
            type="button"
            class="quick-tile"
            @click="a.jalankan()"
          >
            <span class="tile-icon" :class="a.color">
              <ion-icon :icon="a.icon" class="text-lg" />
            </span>
            <span class="text-center text-[11px] font-bold text-slate-700">
              {{ a.label }}
            </span>
          </button>
        </div>

        <div class="mt-8 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800">Kelas (Halaqoh)</h2>
          <ion-button size="small" shape="round" @click="openRiwayat('')">
            Semua Riwayat
          </ion-button>
        </div>

        <div v-if="hafalan.kelasList.length === 0" class="mt-3 empty-state">
          <ion-icon icon="schoolOutline" class="text-4xl text-slate-300" />
          <p class="text-sm font-semibold text-slate-500">Belum ada kelas diampu</p>
          <p class="text-xs text-slate-400">Hubungi Admin untuk penempatan kelas.</p>
        </div>

        <button
          v-for="kelas in hafalan.kelasList"
          :key="kelas.id"
          class="mt-3 flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:ring-indigo-300 hover:shadow-md active:scale-[0.99]"
          @click="openRiwayat(kelas.id)"
        >
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ion-icon icon="peopleOutline" class="text-xl" />
            </span>
            <div>
              <p class="font-semibold text-slate-800">{{ kelas.namaKelas }}</p>
              <p class="text-sm text-slate-500">
                {{ kelas._count?.santri ?? 0 }} santri
              </p>
            </div>
          </div>
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <ion-icon icon="chevronForward" />
          </span>
        </button>

        <div class="mt-8">
          <h2 class="text-lg font-bold text-slate-800">Setoran Terbaru</h2>
          <div v-if="hafalan.loading && hafalan.feed.length === 0" class="mt-3 space-y-3">
            <div v-for="i in 3" :key="i" class="h-32 animate-pulse rounded-xl bg-slate-200" />
          </div>
          <div v-else-if="hafalan.feed.length === 0" class="mt-3 empty-state">
            <ion-icon icon="readerOutline" class="text-4xl text-slate-300" />
            <p class="text-sm font-semibold text-slate-500">Belum ada setoran</p>
            <p class="text-xs text-slate-400">
              Setoran dari kelas atau orang tua akan muncul di sini.
            </p>
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
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import {
  bookOutline,
  chatbubblesOutline,
  chevronForward,
  documentTextOutline,
  logOutOutline,
  peopleOutline,
  personOutline,
  readerOutline,
  schoolOutline,
  statsChartOutline,
} from "ionicons/icons";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import KartuKontrolCard from "@/components/KartuKontrolCard.vue";

const router = useRouter();
const auth = useAuthStore();
const hafalan = useHafalanStore();

const tglHariIni = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const namaSingkat = computed(() => {
  const nama = auth.namaLengkap.trim();
  return nama ? nama.split(/\s+/)[0] : "Pengajar";
});

const totalSantri = computed(() => hafalan.santriList.length);

const aksi = [
  {
    label: "Rekap",
    icon: documentTextOutline,
    color: "bg-gradient-to-br from-sky-500 to-blue-600",
    jalankan: () => void router.push("/rekap"),
  },
  {
    label: "Statistik",
    icon: statsChartOutline,
    color: "bg-gradient-to-br from-fuchsia-500 to-purple-600",
    jalankan: () => void router.push("/statistik"),
  },
  {
    label: "Pesan",
    icon: chatbubblesOutline,
    color: "bg-gradient-to-br from-emerald-500 to-teal-600",
    jalankan: () => void router.push("/pesan"),
  },
  {
    label: "Profil",
    icon: personOutline,
    color: "bg-gradient-to-br from-amber-500 to-orange-600",
    jalankan: () => void router.push("/profil"),
  },
];

function openRiwayat(kelasId: string): void {
  hafalan.setKelasFilter(kelasId || null);
  void router.push("/pengajar/riwayat");
}

function logout(): void {
  auth.logout();
  hafalan.reset();
  void router.replace("/login");
}

async function muatSemua(): Promise<void> {
  await Promise.allSettled([
    hafalan.fetchKelas(),
    hafalan.fetchSantri(),
    hafalan.fetchFeed(1),
  ]);
}

async function onRefresh(event: CustomEvent): Promise<void> {
  await muatSemua();
  (event.target as HTMLIonRefresherElement).complete();
}

onMounted(() => {
  void muatSemua();
});
</script>