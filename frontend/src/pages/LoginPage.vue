<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div
        class="mx-auto flex min-h-full max-w-sm flex-col justify-center py-16"
      >
        <div class="mb-8 text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-3xl font-black text-white shadow-lg"
          >
            H
          </div>
          <h1 class="text-3xl font-bold text-slate-800">HafalTrack</h1>
          <p class="mt-1 text-sm text-slate-500">
            Sistem Kartu Kontrol Hafalan Sekolah & Rumah
          </p>
        </div>

        <form
          class="space-y-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100"
          novalidate
          @submit.prevent="onSubmit"
        >
          <div>
            <label class="field-label" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="field-input"
              placeholder="email@sekolah.id"
              autocomplete="username"
              required
            />
          </div>
          <div>
            <label class="field-label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="field-input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>
          <p
            v-if="auth.error"
            class="rounded-lg bg-red-50 p-2.5 text-sm font-medium text-red-600"
          >
            {{ auth.error }}
          </p>
          <ion-button
            type="submit"
            expand="block"
            shape="round"
            :disabled="auth.loading"
          >
            <ion-spinner v-if="auth.loading" name="crescent" />
            <template v-else>
              <ion-icon slot="start" icon="logInOutline" />
              Masuk
            </template>
          </ion-button>
        </form>

        <div class="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p class="text-sm font-bold text-slate-700">Coba akun demo</p>
          <p class="mt-0.5 text-xs text-slate-400">
            Ketuk salah satu untuk mengisi email &amp; password secara otomatis.
          </p>
          <div class="mt-3 grid grid-cols-1 gap-2">
            <button
              v-for="d in demos"
              :key="d.email"
              type="button"
              class="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left ring-1 ring-slate-200 transition hover:ring-indigo-300 hover:shadow-sm active:scale-[0.98]"
              @click="isiDemo(d)"
            >
              <span class="flex items-center gap-2.5">
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow"
                  :class="d.color"
                >
                  {{ d.singkat }}
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold text-slate-800">
                    {{ d.label }}
                  </span>
                  <span class="block truncate text-xs text-slate-400">
                    {{ d.email }}
                  </span>
                </span>
              </span>
              <ion-icon
                icon="arrowForward"
                class="shrink-0 text-lg text-indigo-500"
              />
            </button>
          </div>
        </div>

        <div class="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4">
          <p class="text-center text-sm font-semibold text-indigo-900">
            Mau lewat aplikasi di HP?
          </p>
          <p class="mt-0.5 text-center text-xs text-slate-500">
            Unduh APK terbaru, instal, dan login di sana.
          </p>
          <a
            :href="APK_URL"
            class="btn-gradient mt-3 flex w-full justify-center"
          >
            <ion-icon :icon="downloadOutline" class="text-lg" />
            Unduh Aplikasi (APK)
          </a>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { IonButton, IonContent, IonIcon, IonPage, IonSpinner } from "@ionic/vue";
import { arrowForward, downloadOutline, logInOutline } from "ionicons/icons";
import { useAuthStore } from "@/stores/auth";

const APK_URL = "https://backend-eight-snowy-39.vercel.app/api/download/apk";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");

const demos = [
  {
    label: "Admin",
    email: "admin@hafaltrack.id",
    password: "password123",
    singkat: "AD",
    color: "bg-gradient-to-br from-indigo-500 to-violet-600",
  },
  {
    label: "Pengajar",
    email: "ustadz@hafaltrack.id",
    password: "password123",
    singkat: "PG",
    color: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    label: "Orang Tua",
    email: "supriyadi@hafaltrack.id",
    password: "password123",
    singkat: "OT",
    color: "bg-gradient-to-br from-sky-500 to-blue-600",
  },
];

function isiDemo(d: { email: string; password: string }): void {
  email.value = d.email;
  password.value = d.password;
}

async function onSubmit(): Promise<void> {
  const user = await auth.login(email.value, password.value);
  if (user) {
    await router.replace(auth.berandaPath);
  }
}
</script>