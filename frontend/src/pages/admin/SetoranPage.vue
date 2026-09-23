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
      <div class="mx-auto max-w-3xl space-y-4">
        <div class="hero-gradient from-sky-600 via-blue-600 to-indigo-600">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-sky-200">
                Kartu Kontrol
              </p>
              <h1 class="text-2xl font-black text-white">
                {{ admin.feedMeta.total }} Setoran
              </h1>
              <p class="text-sm text-sky-100">
                Seluruh setoran dari sekolah dan rumah.
              </p>
            </div>
            <span class="flex gap-2">
              <span class="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/30">
                {{ todaySetoran }} Hari ini
              </span>
              <span class="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/30">
                {{ unverifiedCount }} Perlu Verifikasi
              </span>
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
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

        <p
          v-if="admin.error"
          class="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600"
        >
          {{ admin.error }}
        </p>

        <div class="space-y-3">
          <div v-if="admin.loading && admin.feed.length === 0" class="space-y-3">
            <div v-for="i in 4" :key="i" class="h-36 animate-pulse rounded-xl bg-slate-200" />
          </div>

          <div
            v-else-if="admin.feed.length === 0"
            class="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-sm text-slate-400"
          >
            Belum ada setoran untuk filter ini.
          </div>

          <KartuKontrolCard
            v-for="kartu in admin.feed"
            :key="kartu.id"
            :kartu="kartu"
          >
            <template #actions>
              <div class="mt-3 flex items-center justify-between gap-2">
                <span class="truncate text-xs text-slate-400">
                  {{ kartu.disimakOleh.email }}
                </span>
                <span class="flex shrink-0 gap-1">
                  <ion-button fill="clear" size="small" @click="openEdit(kartu)">
                    <ion-icon slot="icon-only" :icon="createOutline" />
                  </ion-button>
                  <ion-button
                    fill="clear"
                    size="small"
                    color="danger"
                    @click="confirmDelete(kartu)"
                  >
                    <ion-icon slot="icon-only" :icon="trashOutline" />
                  </ion-button>
                </span>
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

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="openCreate">
        <span class="text-2xl">+</span>
      </ion-fab-button>
    </ion-fab>

    <ion-modal :is-open="showForm" @did-dismiss="showForm = false" :can-dismiss="!admin.submitting">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editing ? "Edit Setoran" : "Tambah Setoran" }}</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" :disabled="admin.submitting" @click="showForm = false">
              Tutup
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="mx-auto max-w-md space-y-4">
          <p v-if="admin.error" class="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
            {{ admin.error }}
          </p>

          <div>
            <label class="field-label">Sumber Setoran</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in sumberOptions"
                :key="s.value"
                type="button"
                class="chip-base"
                :class="form.sumberInput === s.value ? 'chip-active' : 'chip-inactive'"
                @click="onSumberFormChange(s.value)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="field-label">Santri</label>
            <select v-model="form.santriId" class="field-select">
              <option value="" disabled>-- Pilih santri --</option>
              <option v-for="s in admin.santriList" :key="s.id" :value="s.id">
                {{ s.namaLengkap }}
                <template v-if="s.kelas"> ({{ s.kelas.namaKelas }})</template>
              </option>
            </select>
            <p v-if="admin.santriList.length === 0" class="mt-1 text-xs font-medium text-red-500">
              Belum ada santri. Buat dulu di Manajemen Santri.
            </p>
          </div>

          <div>
            <label class="field-label">Materi (Surah)</label>
            <select v-model="form.materiId" class="field-select">
              <option value="" disabled>-- Pilih surah --</option>
              <option v-for="m in admin.materiList" :key="m.id" :value="m.id">
                {{ m.namaSurah }} (Juz {{ m.juz }} · {{ m.totalAyat }} ayat)
              </option>
            </select>
            <p v-if="admin.materiList.length === 0" class="mt-1 text-xs font-medium text-red-500">
              Belum ada materi. Buat dulu di Katalog Materi.
            </p>
          </div>

          <div>
            <label class="field-label">Jenis Setoran</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="j in jenisOptions"
                :key="j"
                type="button"
                class="chip-base"
                :class="form.jenisSetoran === j ? 'chip-active' : 'chip-inactive'"
                @click="form.jenisSetoran = j"
              >
                {{ j === "ZIYADAH" ? "Ziyadah (Baru)" : "Muroja'ah (Ulang)" }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label">Ayat Mulai</label>
              <input v-model="form.ayatMulai" type="number" min="1" class="field-input" placeholder="1" />
            </div>
            <div>
              <label class="field-label">Ayat Selesai</label>
              <input v-model="form.ayatSelesai" type="number" min="1" class="field-input" placeholder="7" />
            </div>
          </div>

          <div v-if="form.sumberInput === 'SEKOLAH'">
            <label class="field-label">Nilai</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="n in nilaiOptions"
                :key="n"
                type="button"
                class="chip-base"
                :class="form.nilai === n ? 'chip-active' : 'chip-inactive'"
                @click="form.nilai = n"
              >
                {{ n }}
              </button>
            </div>
          </div>

          <div>
            <label class="field-label">Catatan</label>
            <textarea v-model="form.catatan" rows="3" class="field-input resize-none" placeholder="Feedback / catatan setoran..." />
          </div>

          <div>
            <label class="field-label">Tanggal Setoran</label>
            <input v-model="form.tanggalSetoran" type="date" class="field-input" />
          </div>

          <ion-button
            expand="block"
            shape="round"
            :disabled="admin.submitting"
            @click="submit"
          >
            <ion-spinner v-if="admin.submitting" name="crescent" />
            <template v-else>{{ editing ? "Simpan Perubahan" : "Simpan Setoran" }}</template>
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  IonBackButton,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  alertController,
  toastController,
} from "@ionic/vue";
import { createOutline, trashOutline } from "ionicons/icons";
import { useAdminStore } from "@/stores/admin";
import KartuKontrolCard from "@/components/KartuKontrolCard.vue";
import type {
  JenisSetoran,
  KartuKontrol,
  SumberInput,
  UpdateSetoranPayload,
} from "@/types";

const admin = useAdminStore();

const todaySetoran = computed(() => admin.stats?.setoranHariIni ?? 0);
const unverifiedCount = computed(() => admin.stats?.setoranBelumDiverifikasi ?? 0);

const sumberFilter = ref<SumberInput | "">("");
const jenisFilter = ref<JenisSetoran | "">("");
const showForm = ref(false);
const editing = ref<KartuKontrol | null>(null);

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

const sumberOptions = [
  { label: "Sekolah", value: "SEKOLAH" as SumberInput },
  { label: "Rumah", value: "RUMAH" as SumberInput },
];

const jenisOptions: JenisSetoran[] = ["ZIYADAH", "MUROJAAH"];
const nilaiOptions = ["A", "B", "C", "D", "Belum Lulus"];

const today = new Date().toISOString().slice(0, 10);

const form = reactive({
  sumberInput: "SEKOLAH" as SumberInput,
  santriId: "",
  materiId: "",
  jenisSetoran: "ZIYADAH" as JenisSetoran,
  ayatMulai: "1",
  ayatSelesai: "7",
  nilai: "",
  catatan: "",
  tanggalSetoran: today,
});

function onSumberFormChange(value: SumberInput): void {
  form.sumberInput = value;
  form.nilai = "";
}

function resetForm(): void {
  form.sumberInput = "SEKOLAH";
  form.santriId = "";
  form.materiId = "";
  form.jenisSetoran = "ZIYADAH";
  form.ayatMulai = "1";
  form.ayatSelesai = "7";
  form.nilai = "";
  form.catatan = "";
  form.tanggalSetoran = today;
}

function openCreate(): void {
  admin.error = null;
  resetForm();
  editing.value = null;
  showForm.value = true;
}

function openEdit(kartu: KartuKontrol): void {
  admin.error = null;
  editing.value = kartu;
  form.sumberInput = kartu.sumberInput;
  form.santriId = kartu.santriId;
  form.materiId = kartu.materiId;
  form.jenisSetoran = kartu.jenisSetoran;
  form.ayatMulai = String(kartu.ayatMulai);
  form.ayatSelesai = String(kartu.ayatSelesai);
  form.nilai = kartu.nilai ?? "";
  form.catatan = kartu.catatan ?? "";
  form.tanggalSetoran = kartu.tanggalSetoran.slice(0, 10);
  showForm.value = true;
}

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

async function submit(): Promise<void> {
  if (!form.santriId || !form.materiId) {
    await showToast("Pilih santri dan materi surah", "danger");
    return;
  }
  const mulai = Number(form.ayatMulai);
  const selesai = Number(form.ayatSelesai);
  if (!Number.isInteger(mulai) || mulai < 1 || !Number.isInteger(selesai) || selesai < 1) {
    await showToast("Isi ayat mulai dan selesai dengan benar", "danger");
    return;
  }
  if (selesai < mulai) {
    await showToast("Ayat selesai tidak boleh kurang dari ayat mulai", "danger");
    return;
  }
  const materi = admin.materiList.find((m) => m.id === form.materiId);
  if (materi && selesai > materi.totalAyat) {
    await showToast(`Maksimal ${materi.totalAyat} ayat untuk ${materi.namaSurah}`, "danger");
    return;
  }
  if (form.sumberInput === "SEKOLAH" && !form.nilai) {
    await showToast("Nilai wajib diisi untuk setoran sekolah", "danger");
    return;
  }
  if (form.sumberInput === "RUMAH") {
    form.nilai = "";
  }

  const tanggalISO = form.tanggalSetoran
    ? new Date(form.tanggalSetoran).toISOString()
    : undefined;

  if (editing.value) {
    const payload: UpdateSetoranPayload = {
      santriId: form.santriId,
      materiId: form.materiId,
      jenisSetoran: form.jenisSetoran,
      sumberInput: form.sumberInput,
      tanggalSetoran: tanggalISO ?? null,
      ayatMulai: mulai,
      ayatSelesai: selesai,
      nilai: form.nilai || null,
      catatan: form.catatan.trim() || null,
    };
    const updated = await admin.updateSetoran(editing.value.id, payload);
    await showToast(
      updated ? "Setoran berhasil diperbarui" : admin.error ?? "Gagal menyimpan",
      updated ? "success" : "danger"
    );
    if (updated) {
      showForm.value = false;
    }
    return;
  }

  const created = await admin.createSetoran({
    santriId: form.santriId,
    materiId: form.materiId,
    jenisSetoran: form.jenisSetoran,
    sumberInput: form.sumberInput,
    ayatMulai: mulai,
    ayatSelesai: selesai,
    nilai: form.sumberInput === "SEKOLAH" ? form.nilai : null,
    catatan: form.catatan.trim() || null,
    tanggalSetoran: tanggalISO,
  });
  await showToast(
    created ? "Setoran hafalan berhasil ditambahkan" : admin.error ?? "Gagal menyimpan",
    created ? "success" : "danger"
  );
  if (created) {
    showForm.value = false;
  }
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
  void admin.fetchSantri();
  void admin.fetchMateri();
  void admin.fetchStats();
});
</script>