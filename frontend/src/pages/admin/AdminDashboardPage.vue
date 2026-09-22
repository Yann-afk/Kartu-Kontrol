<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Admin</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="logout">Keluar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-3xl">
        <h1 class="text-2xl font-bold text-slate-800">
          Halo, {{ auth.namaLengkap }}
        </h1>
        <p class="text-sm text-slate-500">
          Dashboard Admin — Manajemen master data sistem HafalTrack.
        </p>

        <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            v-for="card in menuItems"
            :key="card.title"
            class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
          >
            <p class="font-semibold text-slate-800">{{ card.title }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ card.desc }}</p>
            <span
              class="mt-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600"
            >
              Segera Hadir
            </span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";

const router = useRouter();
const auth = useAuthStore();
const hafalan = useHafalanStore();

const menuItems = [
  { title: "Manajemen User", desc: "Kelola akun Admin, Pengajar, dan Orang Tua." },
  { title: "Manajemen Santri", desc: "Kelola data santri dan relasi wali/kelas." },
  { title: "Manajemen Kelas", desc: "Kelola kelas/halaqoh dan pengajarnya." },
  { title: "Katalog Materi", desc: "Kelola daftar surah, juz, dan jumlah ayat." },
];

function logout(): void {
  auth.logout();
  hafalan.reset();
  void router.replace("/login");
}
</script>