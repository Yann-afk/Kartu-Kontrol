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
        <div class="hero-gradient from-sky-600 via-blue-600 to-indigo-600">
          <div class="flex items-center gap-4">
            <span
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl"
            >
              <ion-icon icon="homeOutline" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-sky-100">{{ tglHariIni }}</p>
              <h1 class="truncate text-xl font-black">Halo, {{ namaSingkat }}</h1>
              <p class="text-sm text-sky-100">
                Pantau hafalan ananda kapan saja
              </p>
            </div>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-4 gap-2">
          <button
            v-for="a in aksi"
            :key="a.label"
            type="button"
            class="quick-tile"
            @click="a.jalankan(anakAktif?.id)"
          >
            <span class="tile-icon" :class="a.color">
              <ion-icon :icon="a.icon" class="text-lg" />
            </span>
            <span class="text-center text-[11px] font-bold text-slate-700">
              {{ a.label }}
            </span>
          </button>
        </div>

        <h2 class="mt-6 text-lg font-bold text-slate-800">Pilih Anak</h2>
        <p class="text-sm text-slate-500">
          Pilih profil anak untuk melihat kartu kontrol hafalannya.
        </p>

        <div
          v-if="hafalan.loading && hafalan.anakList.length === 0"
          class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div v-for="i in 2" :key="i" class="h-24 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div
          v-else-if="hafalan.anakList.length === 0"
          class="mt-4 empty-state"
        >
          <ion-icon icon="peopleOutline" class="text-4xl text-slate-300" />
          <p class="text-sm font-semibold text-slate-500">Belum ada data anak</p>
          <p class="text-xs text-slate-400">
            Hubungi Admin sekolah untuk mendaftarkan anak Anda.
          </p>
        </div>

        <div v-else class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PilihAnakCard
            v-for="anak in hafalan.anakList"
            :key="anak.id"
            :santri="anak"
            :active="hafalan.anakAktif?.id === anak.id"
            @select="hafalan.pilihAnak"
          />
        </div>

        <template v-if="anakAktif">
          <div
            class="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                >
                  <ion-icon icon="ribbonOutline" class="text-xl" />
                </span>
                <div class="min-w-0">
                  <h3 class="truncate text-lg font-bold text-slate-800">
                    {{ anakAktif.namaLengkap }}
                  </h3>
                  <p class="text-sm text-slate-500">
                    NIS {{ anakAktif.nis
                    }}<template v-if="anakAktif.kelas">
                      · {{ anakAktif.kelas.namaKelas }}
                    </template>
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-3">
              <div class="rounded-xl bg-indigo-50 p-3 text-center">
                <p class="text-xl font-bold text-indigo-700">
                  {{ hafalan.feedMeta.total }}
                </p>
                <p class="text-xs font-medium text-indigo-400">Setoran</p>
              </div>
              <div class="rounded-xl bg-emerald-50 p-3 text-center">
                <p class="text-xl font-bold text-emerald-700">
                  {{ hafalan.feedSekolahCount }}
                </p>
                <p class="text-xs font-medium text-emerald-400">Sekolah</p>
              </div>
              <div class="rounded-xl bg-sky-50 p-3 text-center">
                <p class="text-xl font-bold text-sky-700">
                  {{ hafalan.feedRumahCount }}
                </p>
                <p class="text-xs font-medium text-sky-400">Rumah</p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2">
              <ion-button
                shape="round"
                size="small"
                @click="router.push('/orangtua/feed')"
              >
                Feed
              </ion-button>
              <ion-button
                shape="round"
                size="small"
                fill="outline"
                @click="router.push('/orangtua/grafik')"
              >
                Grafik
              </ion-button>
              <ion-button
                shape="round"
                size="small"
                fill="outline"
                color="success"
                @click="showInput = true"
              >
                Setoran
              </ion-button>
            </div>
          </div>

          <div class="mt-6">
            <h3 class="text-base font-bold text-slate-800">Setoran Terbaru</h3>
            <div class="mt-3 space-y-3">
              <KartuKontrolCard
                v-for="kartu in hafalan.feed.slice(0, 2)"
                :key="kartu.id"
                :kartu="kartu"
              />
              <div v-if="hafalan.feed.length === 0" class="empty-state">
                <ion-icon icon="readerOutline" class="text-4xl text-slate-300" />
                <p class="text-sm font-semibold text-slate-500">
                  Belum ada setoran untuk {{ anakAktif.namaLengkap }}
                </p>
                <p class="text-xs text-slate-400">
                  Setoran akan tampil di sini setelah input pertama.
                </p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </ion-content>

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
import { useRouter } from "vue-router";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import {
  chatbubblesOutline,
  documentTextOutline,
  homeOutline,
  logOutOutline,
  peopleOutline,
  personOutline,
  readerOutline,
  ribbonOutline,
  statsChartOutline,
} from "ionicons/icons";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import PilihAnakCard from "@/components/PilihAnakCard.vue";
import KartuKontrolCard from "@/components/KartuKontrolCard.vue";
import InputSetoranForm from "@/components/InputSetoranForm.vue";

const router = useRouter();
const auth = useAuthStore();
const hafalan = useHafalanStore();

const showInput = ref(false);

const tglHariIni = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const namaSingkat = computed(() => {
  const nama = auth.namaLengkap.trim();
  return nama ? nama.split(/\s+/)[0] : "Ayah/Bunda";
});

const anakAktif = computed(() => hafalan.anakAktif);

const aksi = [
  {
    label: "Rekap",
    icon: documentTextOutline,
    color: "bg-gradient-to-br from-sky-500 to-blue-600",
    jalankan: (santriId?: string) =>
      void router.push({ path: "/rekap", query: santriId ? { santriId } : {} }),
  },
  {
    label: "Statistik",
    icon: statsChartOutline,
    color: "bg-gradient-to-br from-fuchsia-500 to-purple-600",
    jalankan: (santriId?: string) =>
      void router.push({
        path: "/statistik",
        query: santriId ? { santriId } : {},
      }),
  },
  {
    label: "Pesan",
    icon: chatbubblesOutline,
    color: "bg-gradient-to-br from-emerald-500 to-teal-600",
    jalankan: (santriId?: string) =>
      void router.push({ path: "/pesan", query: santriId ? { santriId } : {} }),
  },
  {
    label: "Profil",
    icon: personOutline,
    color: "bg-gradient-to-br from-amber-500 to-orange-600",
    jalankan: () => void router.push("/profil"),
  },
];

function logout(): void {
  auth.logout();
  hafalan.reset();
  void router.replace("/login");
}

function onSubmitted(): void {
  showInput.value = false;
}

async function muatSemua(): Promise<void> {
  await hafalan.fetchAnak();
  if (hafalan.anakAktif) {
    await hafalan.fetchFeed(1);
  }
}

async function onRefresh(event: CustomEvent): Promise<void> {
  await muatSemua();
  (event.target as HTMLIonRefresherElement).complete();
}

onMounted(() => {
  void muatSemua();
});
</script>