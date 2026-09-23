<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>Statistik Hafalan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl space-y-4">
        <div class="hero-gradient from-fuchsia-600 via-purple-600 to-indigo-600 p-5">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white"
            >
              <ion-icon icon="statsChartOutline" class="text-xl" />
            </span>
            <div>
              <p class="font-bold text-white">Statistik Hafalan</p>
              <p class="text-sm text-fuchsia-100">{{ scopeLabel }}</p>
            </div>
          </div>
        </div>

        <template v-if="auth.isPengajar">
          <div>
            <label class="field-label" for="kelasStats">Kelas</label>
            <select
              id="kelasStats"
              v-model="kelasId"
              class="field-select"
              @change="muat()"
            >
              <option value="">Semua kelas</option>
              <option v-for="k in hafalan.kelasList" :key="k.id" :value="k.id">
                {{ k.namaKelas }}
              </option>
            </select>
          </div>
        </template>

        <p v-if="laporan.error" class="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {{ laporan.error }}
        </p>

        <div v-if="laporan.loading" class="space-y-3">
          <div class="h-20 animate-pulse rounded-xl bg-slate-200" />
          <div class="h-40 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <template v-else-if="laporan.statistik">
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p class="text-xs text-slate-500">Total Setoran</p>
              <p class="mt-1 text-2xl font-bold text-indigo-600">
                {{ totalSumber }}
              </p>
            </div>
            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p class="text-xs text-slate-500">Total Ayat</p>
              <p class="mt-1 text-2xl font-bold text-emerald-600">
                {{ laporan.statistik.totalAyat }}
              </p>
            </div>
            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p class="text-xs text-slate-500">Sekolah</p>
              <p class="mt-1 text-2xl font-bold text-sky-600">{{ jumlahSumber("SEKOLAH") }}</p>
            </div>
            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p class="text-xs text-slate-500">Rumah</p>
              <p class="mt-1 text-2xl font-bold text-amber-600">{{ jumlahSumber("RUMAH") }}</p>
            </div>
          </div>

          <section
            v-if="laporan.statistik.perBulan.length"
            class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <h3 class="text-base font-bold text-slate-800">Tren per Bulan</h3>
            <div class="mt-4 flex h-32 items-end gap-2">
              <div
                v-for="b in laporan.statistik.perBulan"
                :key="b.bulan"
                class="flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <span class="text-xs font-semibold text-indigo-600">{{ b.total }}</span>
                <div
                  class="w-full rounded-t-lg bg-gradient-to-t from-purple-500 to-fuchsia-500"
                  :style="{ height: tinggiBar(b.total) + 'px' }"
                />
                <span class="text-[10px] text-slate-400">{{ labelBulan(b.bulan) }}</span>
              </div>
            </div>
          </section>

          <section
            v-if="laporan.statistik.perNilai.length"
            class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <h3 class="text-base font-bold text-slate-800">Sebaran Nilai</h3>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="n in laporan.statistik.perNilai"
                :key="n.nilai ?? 'kosong'"
                class="rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700 ring-1 ring-purple-100"
              >
                {{ n.nilai ?? "Belum dinilai" }} · {{ n._count._all }}
              </span>
            </div>
          </section>

          <template v-if="auth.isPengajar">
            <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 class="text-base font-bold text-slate-800">Per Santri</h3>
              <div v-if="laporan.statistik.perSantri.length === 0" class="py-6 text-center text-sm text-slate-400">
                Belum ada data
              </div>
              <div
                v-for="s in laporan.statistik.perSantri"
                :key="s.santriId"
                class="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
              >
                <InitialsAvatar :name="s.namaLengkap ?? '?'" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-slate-800">{{ s.namaLengkap }}</p>
                  <p class="text-xs text-slate-500">{{ s.kelas ?? "—" }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-indigo-600">{{ s.total }}x</p>
                  <p class="text-xs text-slate-400">{{ s.totalAyat }} ayat</p>
                </div>
              </div>
            </section>
          </template>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { statsChartOutline } from "ionicons/icons";
import InitialsAvatar from "@/components/InitialsAvatar.vue";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import { useLaporanStore } from "@/stores/laporan";
import type { SumberInput } from "@/types";

const auth = useAuthStore();
const hafalan = useHafalanStore();
const laporan = useLaporanStore();
const route = useRoute();

const kelasId = ref("");
const santriIdRef = ref("");

const scopeLabel = computed(() => {
  if (auth.isPengajar) {
    return kelasId.value
      ? hafalan.kelasList.find((k) => k.id === kelasId.value)?.namaKelas ?? ""
      : "Semua kelas";
  }
  const id = santriIdRef.value || hafalan.anakAktif?.id || "";
  return hafalan.anakList.find((a) => a.id === id)?.namaLengkap ?? "Semua anak";
});

const totalSumber = computed(() =>
  (laporan.statistik?.perSumber ?? []).reduce((a, s) => a + s._count._all, 0)
);

function jumlahSumber(s: SumberInput): number {
  return (
    (laporan.statistik?.perSumber ?? []).find((x) => x.sumberInput === s)?._count
      ._all ?? 0
  );
}

async function muat(): Promise<void> {
  if (auth.isPengajar && hafalan.kelasList.length === 0) {
    await hafalan.fetchKelas();
  }
  const ortuId = santriIdRef.value || hafalan.anakAktif?.id;
  await laporan.fetchStatistik({
    ...(auth.isPengajar ? { kelasId: kelasId.value || undefined } : {}),
    ...(auth.isOrangTua && ortuId ? { santriId: ortuId } : {}),
  });
}

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

onMounted(() => {
  const qsantri =
    typeof route.query.santriId === "string" ? route.query.santriId : "";
  if (auth.isOrangTua) {
    if (qsantri) {
      santriIdRef.value = qsantri;
      void muat();
    } else if (!hafalan.anakAktif) {
      void hafalan.fetchAnak().then(() => void muat());
    } else {
      void muat();
    }
  } else {
    void muat();
  }
});
</script>