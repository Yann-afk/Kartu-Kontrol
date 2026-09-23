<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin" />
        </ion-buttons>
        <ion-title>Manajemen Santri</ion-title>
        <ion-buttons slot="end">
          <button type="button" class="btn-gradient hidden sm:inline-flex" @click="openCreate">Tambah</button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl space-y-4">
        <div class="hero-gradient from-emerald-600 via-teal-600 to-cyan-600">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-emerald-200">
                Kelola Santri
              </p>
              <h1 class="text-2xl font-black text-white">
                {{ admin.santriList.length }} Santri
              </h1>
              <p class="text-sm text-emerald-100">
                Data santri, wali, dan kelasnya.
              </p>
            </div>
            <span class="flex gap-2">
              <span class="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/30">
                {{ totalKelasSantri }} Kelas
              </span>
              <span class="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/30">
                {{ totalWali }} Wali
              </span>
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
          + Tambah Santri
        </button>

        <div v-if="loading && admin.santriList.length === 0" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-2xl bg-slate-200" />
        </div>

        <div v-else-if="admin.santriList.length === 0">
          <div class="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
            Belum ada santri. Tambahkan lewat tombol "Tambah".
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="santri in admin.santriList"
            :key="santri.id"
            class="row-card border-l-teal-500 ring-teal-100 hover:ring-teal-300"
          >
            <InitialsAvatar :name="santri.namaLengkap" color="emerald" />
            <button type="button" class="min-w-0 flex-1 text-left" @click="openEdit(santri)">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate font-semibold text-slate-800">{{ santri.namaLengkap }}</p>
                <span class="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-teal-700">
                  NIS {{ santri.nis }}
                </span>
              </div>
              <p class="mt-0.5 truncate text-sm text-slate-500">
                <span class="font-medium text-slate-600">{{ santri.kelas?.namaKelas ?? "Tanpa kelas" }}</span>
                <span class="text-slate-300"> Â· </span>
                Wali: {{ santri.orangTua?.namaLengkap ?? "Belum ada" }}
              </p>
            </button>
            <ion-button fill="clear" size="small" color="danger" @click="confirmDelete(santri)">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-modal :is-open="showForm" @did-dismiss="showForm = false" :can-dismiss="!admin.submitting">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editing ? "Edit Santri" : "Tambah Santri" }}</ion-title>
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
            <label class="field-label">NIS</label>
            <input v-model="form.nis" class="field-input" placeholder="Nomor induk santri" />
          </div>

          <div>
            <label class="field-label">Nama Lengkap</label>
            <input v-model="form.namaLengkap" class="field-input" placeholder="Nama santri" />
          </div>

          <div>
            <label class="field-label">Orang Tua / Wali</label>
            <select v-model="form.orangTuaId" class="field-select">
              <option
                v-for="o in admin.orangTuaOptions"
                :key="o.id"
                :value="o.orangTua!.id"
              >
                {{ o.namaLengkap ?? o.email }}
              </option>
            </select>
            <p v-if="admin.orangTuaOptions.length === 0" class="mt-1 text-xs font-medium text-red-500">
              Belum ada akun Orang Tua. Buat dulu di Manajemen User.
            </p>
          </div>

          <div>
            <label class="field-label">Kelas</label>
            <select v-model="form.kelasId" class="field-select">
              <option v-for="k in admin.kelasList" :key="k.id" :value="k.id">
                {{ k.namaKelas }}
              </option>
            </select>
            <p v-if="admin.kelasList.length === 0" class="mt-1 text-xs font-medium text-red-500">
              Belum ada kelas. Buat dulu di Manajemen Kelas.
            </p>
          </div>

          <ion-button
            expand="block"
            shape="round"
            :disabled="admin.submitting"
            @click="submit"
          >
            <ion-spinner v-if="admin.submitting" name="crescent" />
            <template v-else>{{ editing ? "Simpan Perubahan" : "Tambah Santri" }}</template>
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
import type { Santri } from "@/types";

const admin = useAdminStore();

const loading = computed(() => admin.loading && admin.santriList.length === 0);

const totalKelasSantri = computed(
  () => new Set(admin.santriList.map((s) => s.kelas?.id).filter(Boolean)).size
);

const totalWali = computed(
  () => new Set(admin.santriList.map((s) => s.orangTua?.id).filter(Boolean)).size
);

const showForm = ref(false);
const editing = ref<Santri | null>(null);
const form = reactive({ nis: "", namaLengkap: "", orangTuaId: "", kelasId: "" });

function defaultsSantri(): { orangTuaId: string; kelasId: string } {
  return {
    orangTuaId: admin.orangTuaOptions[0]?.orangTua?.id ?? "",
    kelasId: admin.kelasList[0]?.id ?? "",
  };
}

function resetForm(): void {
  form.nis = "";
  form.namaLengkap = "";
  form.orangTuaId = defaultsSantri().orangTuaId;
  form.kelasId = defaultsSantri().kelasId;
}

function openCreate(): void {
  admin.error = null;
  resetForm();
  editing.value = null;
  showForm.value = true;
}

function openEdit(santri: Santri): void {
  admin.error = null;
  editing.value = santri;
  form.nis = santri.nis;
  form.namaLengkap = santri.namaLengkap;
  form.orangTuaId = santri.orangTua?.id ?? "";
  form.kelasId = santri.kelas?.id ?? "";
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
  if (!form.nis.trim() || !form.namaLengkap.trim() || !form.orangTuaId || !form.kelasId) {
    await showToast("Semua kolom wajib diisi", "danger");
    return;
  }
  const payload = {
    nis: form.nis.trim(),
    namaLengkap: form.namaLengkap.trim(),
    orangTuaId: form.orangTuaId,
    kelasId: form.kelasId,
  };
  let ok: boolean;
  if (editing.value) {
    const updated = await admin.updateSantri(editing.value.id, payload);
    ok = !!updated;
  } else {
    const created = await admin.createSantri(payload);
    ok = !!created;
  }
  await showToast(
    ok ? (editing.value ? "Data santri diperbarui" : "Santri berhasil ditambahkan") : admin.error ?? "Gagal menyimpan",
    ok ? "success" : "danger"
  );
  if (ok) {
    showForm.value = false;
  }
}

async function confirmDelete(santri: Santri): Promise<void> {
  const alert = await alertController.create({
    header: "Hapus santri?",
    message: `Santri "${santri.namaLengkap}" (NIS ${santri.nis}) akan dihapus permanen.`,
    buttons: [
      { text: "Batal", role: "cancel" },
      {
        text: "Hapus",
        role: "destructive",
        handler: async () => {
          const ok = await admin.deleteSantri(santri.id);
          await showToast(
            ok ? "Santri berhasil dihapus" : admin.error ?? "Gagal menghapus santri",
            ok ? "success" : "danger"
          );
        },
      },
    ],
  });
  await alert.present();
}

onMounted(() => {
  void admin.fetchSantri();
  void admin.fetchKelas();
  if (admin.users.length === 0) {
    void admin.fetchUsers();
  }
});
</script>