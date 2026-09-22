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
            <template v-else>Masuk</template>
          </ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { IonButton, IonContent, IonPage, IonSpinner } from "@ionic/vue";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");

async function onSubmit(): Promise<void> {
  const user = await auth.login(email.value, password.value);
  if (user) {
    await router.replace(auth.berandaPath);
  }
}
</script>