<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin" />
        </ion-buttons>
        <ion-title>Manajemen User</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="outline" size="small" @click="openCreate">Tambah</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl">
        <p
          v-if="admin.error"
          class="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600"
        >
          {{ admin.error }}
        </p>

        <div v-if="admin.loading && admin.users.length === 0" class="mt-3 space-y-3">
          <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div v-else-if="admin.users.length === 0" class="mt-3">
          <div class="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
            Belum ada akun pengguna.
          </div>
        </div>

        <div v-else class="mt-3 space-y-3">
          <div
            v-for="user in admin.users"
            :key="user.id"
            class="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
          >
            <button type="button" class="min-w-0 flex-1 text-left" @click="openEdit(user)">
              <div class="flex items-center gap-2">
                <p class="truncate font-semibold text-slate-800">
                  {{ user.namaLengkap ?? user.email }}
                </p>
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                  :class="roleBadge(user.role)"
                >
                  {{ roleLabel(user.role) }}
                </span>
                <span
                  v-if="auth.user?.id === user.id"
                  class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500"
                >
                  Anda
                </span>
              </div>
              <p class="mt-0.5 text-sm text-slate-500">{{ user.email }}</p>
            </button>
            <ion-button
              v-if="auth.user?.id !== user.id"
              fill="clear"
              size="small"
              color="danger"
              @click="confirmDelete(user)"
            >
              Hapus
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-modal :is-open="showForm" @did-dismiss="closeForm" :can-dismiss="!admin.submitting">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editing ? "Edit User" : "Tambah User" }}</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" :disabled="admin.submitting" @click="closeForm">
              Tutup
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="mx-auto max-w-md">
          <p v-if="admin.error" class="mb-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
            {{ admin.error }}
          </p>

          <div>
            <label class="field-label">Peran Akun</label>
            <select v-model="form.role" class="field-input" :disabled="!!editing">
              <option value="ADMIN">Admin</option>
              <option value="PENGAJAR">Pengajar</option>
              <option value="ORANG_TUA">Orang Tua</option>
            </select>
          </div>

          <div class="mt-3">
            <label class="field-label">Nama Lengkap</label>
            <input v-model="form.namaLengkap" class="field-input" placeholder="Nama lengkap akun" />
          </div>

          <div class="mt-3">
            <label class="field-label">Email</label>
            <input v-model="form.email" type="email" class="field-input" placeholder="nama@contoh.id" />
          </div>

          <div class="mt-3">
            <label class="field-label">
              Password
              <span v-if="editing" class="font-normal text-slate-400">(kosongkan jika tidak diganti)</span>
            </label>
            <input v-model="form.password" type="password" class="field-input" placeholder="Minimal 6 karakter" />
          </div>

          <template v-if="form.role === 'PENGAJAR'">
            <div class="mt-3">
              <label class="field-label">NIP (opsional)</label>
              <input v-model="form.nip" class="field-input" placeholder="Nomor induk pengajar" />
            </div>
          </template>

          <template v-if="form.role === 'PENGAJAR' || form.role === 'ORANG_TUA'">
            <div class="mt-3">
              <label class="field-label">No. HP</label>
              <input v-model="form.noHp" class="field-input" placeholder="08xxxxxxxxxx" />
            </div>
          </template>

          <template v-if="form.role === 'ORANG_TUA'">
            <div class="mt-3">
              <label class="field-label">Alamat</label>
              <textarea v-model="form.alamat" rows="2" class="field-input" placeholder="Alamat wali santri" />
            </div>
          </template>

          <ion-button
            expand="block"
            shape="round"
            class="mt-5"
            :disabled="admin.submitting"
            @click="submit"
          >
            <ion-spinner v-if="admin.submitting" name="crescent" />
            <template v-else>{{ editing ? "Simpan Perubahan" : "Buat Akun" }}</template>
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  alertController,
  toastController,
} from "@ionic/vue";
import { useAuthStore } from "@/stores/auth";
import { useAdminStore } from "@/stores/admin";
import type { AdminUser, Role } from "@/types";

const auth = useAuthStore();
const admin = useAdminStore();

const showForm = ref(false);
const editing = ref<AdminUser | null>(null);
const form = reactive({
  role: "PENGAJAR" as Role,
  namaLengkap: "",
  email: "",
  password: "",
  nip: "",
  noHp: "",
  alamat: "",
});

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  PENGAJAR: "Pengajar",
  ORANG_TUA: "Orang Tua",
};

const roleBadges: Record<Role, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  PENGAJAR: "bg-indigo-100 text-indigo-700",
  ORANG_TUA: "bg-emerald-100 text-emerald-700",
};

function roleLabel(role: Role): string {
  return roleLabels[role];
}

function roleBadge(role: Role): string {
  return roleBadges[role];
}

function resetForm(): void {
  form.role = "PENGAJAR";
  form.namaLengkap = "";
  form.email = "";
  form.password = "";
  form.nip = "";
  form.noHp = "";
  form.alamat = "";
}

function openCreate(): void {
  admin.error = null;
  resetForm();
  editing.value = null;
  showForm.value = true;
}

function openEdit(user: AdminUser): void {
  admin.error = null;
  resetForm();
  editing.value = user;
  form.role = user.role;
  form.email = user.email;
  form.namaLengkap = user.namaLengkap ?? "";
  form.nip = user.pengajar?.nip ?? "";
  form.noHp = user.pengajar?.noHp ?? user.orangTua?.noHp ?? "";
  form.alamat = user.orangTua?.alamat ?? "";
  showForm.value = true;
}

function closeForm(): void {
  if (!admin.submitting) {
    admin.error = null;
    showForm.value = false;
  }
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

function validate(): string | null {
  if (!form.namaLengkap.trim() && form.role !== "ADMIN") {
    return "Nama lengkap wajib diisi";
  }
  if (!form.email.trim() || !form.email.includes("@")) {
    return "Email wajib diisi dengan format valid";
  }
  if (!editing.value && form.password.length < 6) {
    return "Password minimal 6 karakter";
  }
  if (editing.value && form.password && form.password.length < 6) {
    return "Password minimal 6 karakter";
  }
  return null;
}

async function submit(): Promise<void> {
  const fail = validate();
  if (fail) {
    await showToast(fail, "danger");
    return;
  }

  const payload: Record<string, unknown> = {
    role: form.role,
    namaLengkap: form.namaLengkap.trim() || null,
    email: form.email.trim(),
    nip: form.nip.trim() || null,
    noHp: form.noHp.trim() || null,
    alamat: form.alamat.trim() || null,
  };

  if (form.password) {
    payload.password = form.password;
  }

  let ok: boolean;
  if (editing.value) {
    const updated = await admin.updateUser(editing.value.id, payload);
    ok = !!updated;
  } else {
    const created = await admin.createUser(
      payload as { email: string; password: string; role: Role }
    );
    ok = !!created;
  }

  await showToast(
    ok ? (editing.value ? "Akun berhasil diperbarui" : "Akun baru berhasil dibuat") : admin.error ?? "Gagal menyimpan",
    ok ? "success" : "danger"
  );
  if (ok) {
    showForm.value = false;
  }
}

async function confirmDelete(user: AdminUser): Promise<void> {
  const alert = await alertController.create({
    header: "Hapus akun?",
    message: `Akun "${user.namaLengkap ?? user.email}" akan dihapus permanen.`,
    buttons: [
      { text: "Batal", role: "cancel" },
      {
        text: "Hapus",
        role: "destructive",
        handler: async () => {
          const ok = await admin.deleteUser(user.id);
          await showToast(
            ok ? "Akun berhasil dihapus" : admin.error ?? "Gagal menghapus akun",
            ok ? "success" : "danger"
          );
        },
      },
    ],
  });
  await alert.present();
}

onMounted(() => {
  void admin.fetchUsers();
});
</script>