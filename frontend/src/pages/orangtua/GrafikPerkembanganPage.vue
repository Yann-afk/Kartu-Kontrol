<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/orangtua" />
        </ion-buttons>
        <ion-title>Grafik Perkembangan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl space-y-6">
        <div
          v-if="anakAktif"
          class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
        >
          <h2 class="font-bold text-slate-800">
            {{ anakAktif.namaLengkap }}
          </h2>
          <p class="text-sm text-slate-500">
            Perpindahan hafalan berdasarkan riwayat setoran terakhir
          </p>

          <div class="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              class="bg-emerald-500 transition-all"
              :style="{ width: pctSekolah + '%' }"
            />
            <div
              class="bg-sky-500 transition-all"
              :style="{ width: pctRumah + '%' }"
            />
          </div>
          <div class="mt-2 flex flex-wrap justify-between gap-2 text-xs">
            <span class="font-medium text-emerald-600">
              Sekolah: {{ hafalan.feedSekolahCount }} setoran
            </span>
            <span class="font-medium text-sky-600">
              Rumah: {{ hafalan.feedRumahCount }} setoran
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Total Setoran</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ hafalan.feedMeta.total }}
            </p>
          </div>
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Total Ayat Disetor</p>
            <p class="mt-1 text-2xl font-bold text-slate-800">
              {{ hafalan.totalAyatTersetor }}
            </p>
          </div>
          <div class="rounded-xl bg-teal-50 p-4 ring-1 ring-teal-100">
            <p class="text-xs font-medium text-teal-600">Terverifikasi</p>
            <p class="mt-1 text-2xl font-bold text-teal-700">
              {{ verifiedCount }}
            </p>
          </div>
          <div class="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
            <p class="text-xs font-medium text-amber-600">Menunggu Verifikasi</p>
            <p class="mt-1 text-2xl font-bold text-amber-700">
              {{ pendingCount }}
            </p>
          </div>
        </div>

        <section
          v-if="perMateri.length > 0"
          class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
        >
          <h3 class="text-base font-bold text-slate-800">
            Progres per Surah
          </h3>
          <div class="mt-4 space-y-4">
            <div v-for="item in perMateri" :key="item.materi.id">
              <div class="flex items-center justify-between text-sm">
                <span class="font-semibold text-slate-700">
                  {{ item.materi.namaSurah }}
                  <span class="text-xs font-normal text-slate-400">
                    (Juz {{ item.materi.juz }})
                  </span>
                </span>
                <span class="text-xs font-medium text-slate-500">
                  maks. ayat {{ item.maxAyat }} / {{ item.materi.totalAyat }}
                </span>
              </div>
              <div class="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  :style="{ width: item.progress + '%' }"
                />
              </div>
            </div>
          </div>
        </section>

        <p
          v-if="hafalan.feed.length === 0"
          class="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400"
        >
          Belum ada data untuk ditampilkan.
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import {
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
} from "@ionic/vue";
import { useHafalanStore } from "@/stores/hafalan";

const hafalan = useHafalanStore();

const anakAktif = computed(() => hafalan.anakAktif);

const pctSekolah = computed(() => {
  const total = hafalan.feed.length;
  if (total === 0) {
    return 0;
  }
  return Math.round((hafalan.feedSekolahCount / total) * 100);
});

const pctRumah = computed(() => {
  const total = hafalan.feed.length;
  if (total === 0) {
    return 0;
  }
  return Math.round((hafalan.feedRumahCount / total) * 100);
});

const verifiedCount = computed(
  () => hafalan.feed.filter((k) => k.isVerifiedByPengajar).length
);
const pendingCount = computed(
  () => hafalan.feed.filter((k) => !k.isVerifiedByPengajar).length
);

const perMateri = computed(() => {
  const map = new Map<
    string,
    {
      materi: { id: string; namaSurah: string; juz: number; totalAyat: number };
      maxAyat: number;
    }
  >();
  for (const kartu of hafalan.feed) {
    const entry = map.get(kartu.materiId) ?? {
      materi: kartu.materi,
      maxAyat: 0,
    };
    entry.maxAyat = Math.max(entry.maxAyat, kartu.ayatSelesai);
    map.set(kartu.materiId, entry);
  }
  return [...map.values()]
    .map((entry) => ({
      materi: entry.materi,
      maxAyat: entry.maxAyat,
      progress: Math.min(
        100,
        Math.round((entry.maxAyat / entry.materi.totalAyat) * 100)
      ),
    }))
    .sort((a, b) => b.maxAyat - a.maxAyat);
});

onMounted(() => {
  if (!hafalan.anakAktif) {
    void hafalan.fetchAnak().then(() => void hafalan.fetchFeed(1));
  } else {
    void hafalan.fetchFeed(1);
  }
});
</script>