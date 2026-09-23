<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>Profil Saya</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-md space-y-4">
        <div
          class="hero-gradient from-indigo-600 via-violet-600 to-fuchsia-600 p-5"
        >
          <div class="flex items-center gap-4">
            <InitialsAvatar :name="nama" />
            <div class="min-w-0 flex-1 text-white">
              <p class="truncate text-lg font-bold">{{ nama || "—" }}</p>
              <p class="text-sm text-indigo-100">
                {{ roleLabel }} · {{ auth.profile?.email }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="auth.error" class="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {{ auth.error }}
        </div>

        <form class="space-y-4" @submit.prevent="simpan">
          <div>
            <label class="field-label" for="namaLengkap">Nama Lengkap</label>
            <input
              id="namaLengkap"
              v-model="form.namaLengkap"
              class="field-input"
              type="text"
              required
            />
          </div>

          <div>
            <label class="field-label" for="noHp">No. HP/WA</label>
            <input
              id="noHp"
              v-model="form.noHp"
              class="field-input"
              type="tel"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div v-if="auth.isPengajar">
            <label class="field-label" for="nip">NIP</label>
            <input
              id="nip"
              v-model="form.nip"
              class="field-input"
              type="text"
              placeholder="Nomor induk pengajar"
            />
          </div>

          <div v-if="auth.isOrangTua">
            <label class="field-label" for="alamat">Alamat</label>
            <textarea
              id="alamat"
              v-model="form.alamat"
              class="field-input min-h-24"
              placeholder="Alamat rumah"
            ></textarea>
          </div>

          <ion-button
            expand="block"
            type="submit"
            shape="round"
            class="btn-gradient"
            :disabled="menyimpan"
          >
            <ion-spinner v-if="menyimpan" name="crescent" class="mr-2" />
            Simpan Perubahan
          </ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { toastSukses } from "@/utils/toast";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import InitialsAvatar from "@/components/InitialsAvatar.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const menyimpan = ref(false);

const form = reactive({
  namaLengkap: "",
  noHp: "",
  nip: "",
  alamat: "",
});

const nama = computed(
  () => auth.profile?.namaLengkap ?? auth.user?.email ?? ""
);
const roleLabel = computed(() => {
  switch (auth.role) {
    case "PENGAJAR":
      return "Pengajar";
    case "ORANG_TUA":
      return "Orang Tua/Wali";
    default:
      return "Admin";
  }
});

onMounted(() => {
  if (!auth.profile && auth.isAuthenticated) {
    void auth.fetchMe();
  }
  const p = auth.profile?.profil;
  if (p) {
    form.namaLengkap = p.namaLengkap ?? "";
    form.noHp = p.noHp ?? "";
    if (auth.isPengajar) {
      form.nip = (p as { nip?: string | null }).nip ?? "";
    }
    if (auth.isOrangTua) {
      form.alamat = (p as { alamat?: string | null }).alamat ?? "";
    }
  }
});

async function simpan(): Promise<void> {
  menyimpan.value = true;
  try {
    const updated = await auth.updateProfil({
      namaLengkap: form.namaLengkap.trim(),
      noHp: form.noHp.trim() || null,
      ...(auth.isPengajar ? { nip: form.nip.trim() || null } : {}),
      ...(auth.isOrangTua ? { alamat: form.alamat.trim() || null } : {}),
    });
    if (updated) {
      await toastSukses("Profil berhasil diperbarui");
    }
  } finally {
    menyimpan.value = false;
  }
}
</script>