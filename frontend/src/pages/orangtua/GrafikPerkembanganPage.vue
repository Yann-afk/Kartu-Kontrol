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

        <section
          v-if="laporan.statistik?.perBulan?.length"
          class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
        >
          <h3 class="text-base font-bold text-slate-800">
            Tren Setoran per Bulan
          </h3>
          <div class="mt-4 flex h-32 items-end gap-2">
            <div
              v-for="b in laporan.statistik.perBulan"
              :key="b.bulan"
              class="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span class="text-xs font-semibold text-indigo-600">
                {{ b.total }}
              </span>
              <div
                class="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-violet-500"
                :style="{ height: tinggiBar(b.total) + 'px' }"
              />
              <span class="text-[10px] text-slate-400">
                {{ labelBulan(b.bulan) }}
              </span>
            </div>
          </div>
        </section>

        <section
          v-if="laporan.statistik?.perNilai?.length"
          class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
        >
          <h3 class="text-base font-bold text-slate-800">
            Sebaran Nilai
          </h3>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="n in laporan.statistik.perNilai"
              :key="n.nilai ?? 'kosong'"
              class="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700 ring-1 ring-violet-100"
            >
              {{ n.nilai ?? "Belum dinilai" }} · {{ n._count._all }}
            </span>
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
import { computed, onMounted, watch } from "vue";
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
import { useLaporanStore } from "@/stores/laporan";

const hafalan = useHafalanStore();
const laporan = useLaporanStore();

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

watch(
  () => hafalan.anakAktif?.id,
  (id) => {
    if (id) {
      void laporan.fetchStatistik({ santriId: id });
    }
  },
  { immediate: true }
);

function tinggiBar(total: number): number {
  const maks = Math.max(1, ...(laporan.statistik?.perBulan ?? []).map((b) => b.total));
  return Math.max(4, Math.round((total / maks) * 96));
}

function labelBulan(bulan: string): string {
  const [tahun, bulanAngka] = bulan.split("-");
  const nama = new Date(Number(tahun), Number(bulanAngka) - 1, 1).toLocaleDateString(
    "id-ID",
    { month: "short" }
  );
  return tahun === String(new Date().getFullYear()) ? nama : `${nama} ${tahun.slice(2)}`;
}
</script>