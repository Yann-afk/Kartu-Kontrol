<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin" />
        </ion-buttons>
        <ion-title>Katalog Materi</ion-title>
        <ion-buttons slot="end">
          <button type="button" class="btn-gradient hidden sm:inline-flex" @click="openCreate">Tambah</button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl space-y-4">
        <div class="hero-gradient from-amber-500 via-orange-600 to-rose-500">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-amber-200">
                Katalog Hafalan
              </p>
              <h1 class="text-2xl font-black text-white">
                {{ admin.materiList.length }} Surah
              </h1>
              <p class="text-sm text-amber-100">
                Referensi surah, juz, dan jumlah ayat.
              </p>
            </div>
            <span class="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/30">
              {{ totalAyatMateri }} Ayat
            </span>
          </div>
        </div>

        <p
          v-if="admin.error"
          class="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600"
        >
          {{ admin.error }}
        </p>

        <button type="button" class="btn-gradient w-full sm:hidden" @click="openCreate">
          + Tambah Materi
        </button>

        <div v-if="loading && admin.materiList.length === 0" class="space-y-3">
          <div v-for="i in 6" :key="i" class="h-16 animate-pulse rounded-2xl bg-slate-200" />
        </div>

        <div v-else-if="admin.materiList.length === 0">
          <div class="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
            Belum ada materi. Tambahkan lewat tombol "Tambah".
          </div>
        </div>

        <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            v-for="materi in admin.materiList"
            :key="materi.id"
            class="row-card border-l-amber-500 ring-amber-100 hover:ring-amber-300"
          >
            <InitialsAvatar :name="materi.namaSurah" color="amber" />
            <button type="button" class="min-w-0 flex-1 text-left" @click="openEdit(materi)">
              <div class="flex flex-wrap items-center gap-2">
                <span class="shrink-0 rounded-lg bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
                  {{ materi.noUrut }}
                </span>
                <p class="truncate font-semibold text-slate-800">{{ materi.namaSurah }}</p>
                <span class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                  Juz {{ materi.juz }}
                </span>
              </div>
              <p class="mt-0.5 text-sm text-slate-500">
                <span class="font-semibold text-orange-600">{{ materi.totalAyat }} ayat</span>
              </p>
            </button>
            <ion-button fill="clear" size="small" color="danger" @click="confirmDelete(materi)">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-modal :is-open="showForm" @did-dismiss="showForm = false" :can-dismiss="!admin.submitting">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editing ? "Edit Materi" : "Tambah Materi" }}</ion-title>
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
            <label class="field-label">Nama Surah</label>
            <input v-model="form.namaSurah" class="field-input" placeholder="cth: Al-Baqarah" />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="field-label">No</label>
              <input v-model.number="form.noUrut" type="number" min="1" class="field-input" />
            </div>
            <div>
              <label class="field-label">Juz</label>
              <input v-model.number="form.juz" type="number" min="1" max="30" class="field-input" />
            </div>
            <div>
              <label class="field-label">Total Ayat</label>
              <input v-model.number="form.totalAyat" type="number" min="1" class="field-input" />
            </div>
          </div>

          <ion-button
            expand="block"
            shape="round"
            :disabled="admin.submitting"
            @click="submit"
          >
            <ion-spinner v-if="admin.submitting" name="crescent" />
            <template v-else>{{ editing ? "Simpan Perubahan" : "Tambah Materi" }}</template>
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
  IonButtons,
  IonContent,
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
import { trashOutline } from "ionicons/icons";
import InitialsAvatar from "@/components/InitialsAvatar.vue";
import { useAdminStore } from "@/stores/admin";
import type { Materi } from "@/types";

const admin = useAdminStore();

const loading = computed(() => admin.loading && admin.materiList.length === 0);

const totalAyatMateri = computed(() =>
  admin.materiList.reduce((acc, m) => acc + m.totalAyat, 0)
);

const showForm = ref(false);
const editing = ref<Materi | null>(null);
const form = reactive({ namaSurah: "", noUrut: 1, juz: 1, totalAyat: 1 });

function resetForm(): void {
  form.namaSurah = "";
  form.noUrut = 1;
  form.juz = 1;
  form.totalAyat = 1;
}

function openCreate(): void {
  admin.error = null;
  resetForm();
  editing.value = null;
  showForm.value = true;
}

function openEdit(materi: Materi): void {
  admin.error = null;
  editing.value = materi;
  form.namaSurah = materi.namaSurah;
  form.noUrut = materi.noUrut;
  form.juz = materi.juz;
  form.totalAyat = materi.totalAyat;
  showForm.value = true;
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
  const namaSurah = form.namaSurah.trim();
  if (!namaSurah || !Number.isInteger(form.juz) || form.juz < 1 || form.juz > 30) {
    await showToast("Nama surah dan juz (1-30) wajib valid", "danger");
    return;
  }
  if (!Number.isInteger(form.totalAyat) || form.totalAyat < 1) {
    await showToast("Total ayat harus bilangan bulat lebih dari 0", "danger");
    return;
  }
  if (!Number.isInteger(form.noUrut) || form.noUrut < 1) {
    await showToast("Nomor urut harus bilangan bulat lebih dari 0", "danger");
    return;
  }
  const payload = { namaSurah, noUrut: form.noUrut, juz: form.juz, totalAyat: form.totalAyat };
  let ok: boolean;
  if (editing.value) {
    const updated = await admin.updateMateri(editing.value.id, payload);
    ok = !!updated;
  } else {
    const created = await admin.createMateri(payload);
    ok = !!created;
  }
  await showToast(
    ok ? (editing.value ? "Materi berhasil diperbarui" : "Materi berhasil ditambahkan") : admin.error ?? "Gagal menyimpan",
    ok ? "success" : "danger"
  );
  if (ok) {
    showForm.value = false;
  }
}

async function confirmDelete(materi: Materi): Promise<void> {
  const alert = await alertController.create({
    header: "Hapus materi?",
    message: `Materi "${materi.namaSurah}" (Juz ${materi.juz}) akan dihapus permanen.`,
    buttons: [
      { text: "Batal", role: "cancel" },
      {
        text: "Hapus",
        role: "destructive",
        handler: async () => {
          const ok = await admin.deleteMateri(materi.id);
          await showToast(
            ok ? "Materi berhasil dihapus" : admin.error ?? "Gagal menghapus materi",
            ok ? "success" : "danger"
          );
        },
      },
    ],
  });
  await alert.present();
}

onMounted(() => {
  void admin.fetchMateri();
});
</script>