<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>Rekap Hafalan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl space-y-4">
        <div class="hero-gradient from-sky-600 via-blue-600 to-indigo-600 p-5">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white"
            >
              <ion-icon icon="documentTextOutline" class="text-xl" />
            </span>
            <div>
              <p class="font-bold text-white">Rekap Setoran Hafalan</p>
              <p class="text-sm text-sky-100">
                {{ scopeLabel }} · {{ periodeLabel }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in periodeChips"
            :key="p.key"
            type="button"
            :class="periode === p.key ? 'chip-active' : 'chip-inactive'"
            @click="pilihPeriode(p.key)"
          >
            {{ p.label }}
          </button>
        </div>

        <template v-if="auth.isPengajar">
          <div>
            <label class="field-label" for="kelasFilter">Kelas</label>
            <select
              id="kelasFilter"
              v-model="kelasId"
              class="field-select"
              @change="muatRekap()"
            >
              <option value="">Semua kelas</option>
              <option
                v-for="k in hafalan.kelasList"
                :key="k.id"
                :value="k.id"
              >
                {{ k.namaKelas }}
              </option>
            </select>
          </div>
        </template>

        <template v-else-if="auth.isOrangTua">
          <div>
            <label class="field-label" for="anakFilter">Anak</label>
            <select
              id="anakFilter"
              v-model="santriId"
              class="field-select"
              @change="muatRekap()"
            >
              <option value="">Semua anak</option>
              <option
                v-for="s in hafalan.anakList"
                :key="s.id"
                :value="s.id"
              >
                {{ s.namaLengkap }}
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

        <template v-else-if="laporan.rekap">
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p class="text-xs text-slate-500">Total Setoran</p>
              <p class="mt-1 text-2xl font-bold text-indigo-600">
                {{ laporan.rekap.totals.total }}
              </p>
            </div>
            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p class="text-xs text-slate-500">Ayat</p>
              <p class="mt-1 text-2xl font-bold text-emerald-600">
                {{ laporan.rekap.totals.totalAyat }}
              </p>
            </div>
            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p class="text-xs text-slate-500">Sekolah</p>
              <p class="mt-1 text-2xl font-bold text-sky-600">
                {{ laporan.rekap.totals.totalSekolah }}
              </p>
            </div>
            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p class="text-xs text-slate-500">Rumah</p>
              <p class="mt-1 text-2xl font-bold text-amber-600">
                {{ laporan.rekap.totals.totalRumah }}
              </p>
            </div>
          </div>

          <div class="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="font-semibold text-slate-800">Per Santri</p>
            <div v-if="laporan.rekap.perSantri.length === 0" class="py-6 text-center text-sm text-slate-400">
              Belum ada data pada periode ini
            </div>
            <div
              v-for="s in laporan.rekap.perSantri"
              :key="s.santriId"
              class="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
            >
              <InitialsAvatar :name="s.namaLengkap ?? '?'" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-800">
                  {{ s.namaLengkap }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ s.kelas ?? "—" }} · NIS {{ s.nis ?? "—" }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-indigo-600">{{ s.total }}x</p>
                <p class="text-xs text-slate-400">{{ s.totalAyat }} ayat</p>
              </div>
            </div>
          </div>

          <ion-button
            expand="block"
            shape="round"
            class="btn-gradient"
            @click="bagikan"
          >
            <ion-icon slot="start" icon="shareSocialOutline" />
            Bagikan Rekap
          </ion-button>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Capacitor } from "@capacitor/core";
import { toastGagal, toastSukses } from "@/utils/toast";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { documentTextOutline, shareSocialOutline } from "ionicons/icons";
import InitialsAvatar from "@/components/InitialsAvatar.vue";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import { useLaporanStore } from "@/stores/laporan";

const auth = useAuthStore();
const hafalan = useHafalanStore();
const laporan = useLaporanStore();

const periode = ref("30");
const kelasId = ref("");
const santriId = ref("");

const periodeChips = [
  { key: "7", label: "7 hari" },
  { key: "30", label: "30 hari" },
  { key: "90", label: "3 bulan" },
  { key: "all", label: "Semua" },
];

function hitungRentang(key: string): { awal: string | undefined; akhir: string | undefined } {
  if (key === "all") {
    return { awal: undefined, akhir: undefined };
  }
  const hari = Number(key);
  const akhir = new Date();
  const awal = new Date();
  awal.setDate(awal.getDate() - hari + 1);
  return {
    awal: toYmd(awal),
    akhir: toYmd(akhir),
  };
}

function toYmd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const scopeLabel = computed(() => {
  if (auth.isPengajar) {
    return "Kelas " + (kelasId.value ? hafalan.kelasList.find((k) => k.id === kelasId.value)?.namaKelas : "semua");
  }
  return hafalan.anakList.find((a) => a.id === santriId.value)?.namaLengkap ?? "Semua anak";
});

const periodeLabel = computed(() => {
  if (periode.value === "all") {
    return "semua periode";
  }
  return periode.value + " hari terakhir";
});

async function muat(): Promise<void> {
  const { awal, akhir } = hitungRentang(periode.value);
  await Promise.all([
    laporan.fetchRekap({
      ...(auth.isPengajar ? { kelasId: kelasId.value || undefined } : {}),
      ...(auth.isOrangTua ? { santriId: santriId.value || undefined } : {}),
      tanggalAwal: awal,
      tanggalAkhir: akhir,
      limit: 100,
    }),
    hafalan.fetchKelas().then(() => {}).catch(() => undefined),
    hafalan.fetchAnak().then(() => {}).catch(() => undefined),
  ]);
}

function muatRekap(): void {
  void muat();
}

function pilihPeriode(key: string): void {
  periode.value = key;
  void muat();
}

function dibagikan(kelasNama: string): string {
  const r = laporan.rekap!;
  const baris = r.perSantri
    .map((s) => `${s.namaLengkap}: ${s.total} setoran (${s.totalAyat} ayat)`)
    .join("\n");
  return `Rekap Hafalan — ${kelasNama || "semua"}\nPeriode: ${periodeLabel.value}\nTotal setoran: ${r.totals.total}\nTotal ayat: ${r.totals.totalAyat}\n\n${baris}`;
}

async function bagikan(): Promise<void> {
  if (!laporan.rekap) {
    return;
  }
  const teks = dibagikan(scopeLabel.value.includes("Kelas") ? scopeLabel.value.replace(/^Kelas /, "") : scopeLabel.value);
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ text: teks });
    } catch {
      await salin(teks);
    }
  } else {
    await salin(teks);
  }
}

async function salin(teks: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    toastGagal("Berbagi tidak tersedia — teks rekap tampil di kirim ulang");
    return;
  }
  try {
    await navigator.clipboard.writeText(teks);
    await toastSukses("Rekap disalin ke clipboard");
  } catch {
    await toastGagal("Gagal menyalin teks rekap");
  }
}

onMounted(() => {
  void muat();
});
</script>