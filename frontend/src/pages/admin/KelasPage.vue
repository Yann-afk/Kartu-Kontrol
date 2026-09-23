<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin" />
        </ion-buttons>
        <ion-title>Manajemen Kelas</ion-title>
        <ion-buttons slot="end">
          <button type="button" class="btn-gradient hidden sm:inline-flex" @click="openCreate">Tambah</button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl space-y-4">
        <div class="hero-gradient from-violet-600 via-purple-600 to-fuchsia-600">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-violet-200">
                Kelola Kelas
              </p>
              <h1 class="text-2xl font-black text-white">
                {{ admin.kelasList.length }} Kelas / Halaqoh
              </h1>
              <p class="text-sm text-violet-100">
                Kelompok setoran beserta pengajarnya.
              </p>
            </div>
            <span class="flex gap-2">
              <span class="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/30">
                {{ totalSantriKelas }} Santri
              </span>
              <span class="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/30">
                {{ totalPengajar }} Pengajar
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
          + Tambah Kelas
        </button>

        <div v-if="loading && admin.kelasList.length === 0" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-2xl bg-slate-200" />
        </div>

        <div v-else-if="admin.kelasList.length === 0">
          <div class="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
            Belum ada kelas. Tambahkan lewat tombol "Tambah".
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="kelas in admin.kelasList"
            :key="kelas.id"
            class="row-card border-l-violet-500 ring-violet-100 hover:ring-violet-300"
          >
            <InitialsAvatar :name="kelas.namaKelas" color="violet" />
            <button type="button" class="min-w-0 flex-1 text-left" @click="openEdit(kelas)">
              <p class="truncate font-semibold text-slate-800">{{ kelas.namaKelas }}</p>
              <p class="mt-0.5 truncate text-sm text-slate-500">
                <span class="font-medium text-slate-600">{{ kelas.pengajar?.namaLengkap ?? "Belum ada pengajar" }}</span>
                <span class="text-slate-300"> Â· </span>
                <span class="font-semibold text-violet-600">{{ kelas._count?.santri ?? 0 }} santri</span>
              </p>
            </button>
            <ion-button fill="clear" size="small" color="danger" @click="confirmDelete(kelas.id, kelas.namaKelas)">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-modal :is-open="showForm" @did-dismiss="showForm = false" :can-dismiss="!admin.submitting">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editing ? "Edit Kelas" : "Tambah Kelas" }}</ion-title>
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
            <label class="field-label">Nama Kelas</label>
            <input v-model="form.namaKelas" class="field-input" placeholder="cth: Halaqoh 1 / Kelas Tahfidz A" />
          </div>

          <div>
            <label class="field-label">Pengajar</label>
            <select v-model="form.pengajarId" class="field-select">
              <option
                v-for="p in admin.pengajarOptions"
                :key="p.id"
                :value="p.pengajar!.id"
              >
                {{ p.namaLengkap ?? p.email }}
              </option>
            </select>
            <p v-if="admin.pengajarOptions.length === 0" class="mt-1 text-xs font-medium text-red-500">
              Belum ada akun Pengajar. Buat dulu di Manajemen User.
            </p>
          </div>

          <ion-button
            expand="block"
            shape="round"
            :disabled="admin.submitting"
            @click="submit"
          >
            <ion-spinner v-if="admin.submitting" name="crescent" />
            <template v-else>{{ editing ? "Simpan Perubahan" : "Buat Kelas" }}</template>
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
import type { Kelas } from "@/types";

const admin = useAdminStore();

const loading = computed(() => admin.loading && admin.kelasList.length === 0);

const totalSantriKelas = computed(() =>
  admin.kelasList.reduce((acc, k) => acc + (k._count?.santri ?? 0), 0)
);

const totalPengajar = computed(
  () => new Set(admin.kelasList.map((k) => k.pengajar?.id).filter(Boolean)).size
);

const showForm = ref(false);
const editing = ref<Kelas | null>(null);
const form = reactive({ namaKelas: "", pengajarId: "" });

function resetForm(): void {
  form.namaKelas = "";
  form.pengajarId = admin.pengajarOptions[0]?.pengajar?.id ?? "";
}

function openCreate(): void {
  admin.error = null;
  resetForm();
  editing.value = null;
  showForm.value = true;
}

function openEdit(kelas: Kelas): void {
  admin.error = null;
  editing.value = kelas;
  form.namaKelas = kelas.namaKelas;
  form.pengajarId = kelas.pengajar?.id ?? "";
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
  if (!form.namaKelas.trim() || !form.pengajarId) {
    await showToast("Nama kelas dan pengajar wajib diisi", "danger");
    return;
  }
  const payload = { namaKelas: form.namaKelas.trim(), pengajarId: form.pengajarId };
  let ok: boolean;
  if (editing.value) {
    const updated = await admin.updateKelas(editing.value.id, payload);
    ok = !!updated;
  } else {
    const created = await admin.createKelas(payload);
    ok = !!created;
  }
  await showToast(
    ok ? (editing.value ? "Kelas berhasil diperbarui" : "Kelas berhasil dibuat") : admin.error ?? "Gagal menyimpan",
    ok ? "success" : "danger"
  );
  if (ok) {
    showForm.value = false;
  }
}

async function confirmDelete(id: string, namaKelas: string): Promise<void> {
  const alert = await alertController.create({
    header: "Hapus kelas?",
    message: `Kelas "${namaKelas}" akan dihapus permanen.`,
    buttons: [
      { text: "Batal", role: "cancel" },
      {
        text: "Hapus",
        role: "destructive",
        handler: async () => {
          const ok = await admin.deleteKelas(id);
          await showToast(
            ok ? "Kelas berhasil dihapus" : admin.error ?? "Gagal menghapus kelas",
            ok ? "success" : "danger"
          );
        },
      },
    ],
  });
  await alert.present();
}

onMounted(() => {
  void admin.fetchKelas();
  if (admin.users.length === 0) {
    void admin.fetchUsers();
  }
});
</script>