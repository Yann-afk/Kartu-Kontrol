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
      <div class="mx-auto max-w-4xl">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">
              Halo, {{ auth.namaLengkap }}
            </h1>
            <p class="text-sm text-slate-500">
              Pusat manajemen HafalTrack.
            </p>
          </div>
        </div>

        <div v-if="!admin.stats" class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div
            v-for="i in 6"
            :key="i"
            class="h-20 animate-pulse rounded-xl bg-slate-200"
          />
        </div>

        <div v-else class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Akun Pengguna</p>
            <p class="mt-1 text-xl font-bold text-slate-800">
              {{ admin.stats.users.ADMIN + admin.stats.users.PENGAJAR + admin.stats.users.ORANG_TUA }}
            </p>
            <p class="mt-0.5 text-xs text-slate-400">
              {{ admin.stats.users.PENGAJAR }} pengajar · {{ admin.stats.users.ORANG_TUA }} wali
            </p>
          </div>
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Santri</p>
            <p class="mt-1 text-xl font-bold text-slate-800">
              {{ admin.stats.totalSantri }}
            </p>
          </div>
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Kelas</p>
            <p class="mt-1 text-xl font-bold text-slate-800">
              {{ admin.stats.totalKelas }}
            </p>
          </div>
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Materi</p>
            <p class="mt-1 text-xl font-bold text-slate-800">
              {{ admin.stats.totalMateri }}
            </p>
          </div>
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Total Setoran</p>
            <p class="mt-1 text-xl font-bold text-slate-800">
              {{ admin.stats.totalSetoran }}
            </p>
            <p class="mt-0.5 text-xs text-slate-400">
              {{ admin.stats.setoranHariIni }} hari ini
            </p>
          </div>
          <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p class="text-xs font-medium text-slate-500">Belum Diverifikasi</p>
            <p class="mt-1 text-xl font-bold text-amber-600">
              {{ admin.stats.setoranBelumDiverifikasi }}
            </p>
          </div>
        </div>

        <h2 class="mt-8 text-lg font-bold text-slate-800">Menu Manajemen</h2>
        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            v-for="card in menuItems"
            :key="card.route"
            type="button"
            class="flex items-center justify-between rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:ring-indigo-300"
            @click="open(card.route)"
          >
            <div>
              <p class="font-semibold text-slate-800">{{ card.title }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ card.desc }}</p>
            </div>
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
            >
              &rarr;
            </span>
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import { useAdminStore } from "@/stores/admin";

const router = useRouter();
const auth = useAuthStore();
const hafalan = useHafalanStore();
const admin = useAdminStore();

const menuItems = [
  { title: "Manajemen User", desc: "Akun Admin, Pengajar, dan Orang Tua.", route: "/admin/users" },
  { title: "Manajemen Santri", desc: "Data santri, wali, dan kelas.", route: "/admin/santri" },
  { title: "Manajemen Kelas", desc: "Kelas/halaqoh dan pengajarnya.", route: "/admin/kelas" },
  { title: "Katalog Materi", desc: "Surah, juz, dan jumlah ayat.", route: "/admin/materi" },
  { title: "Semua Setoran", desc: "Seluruh data kartu kontrol setoran.", route: "/admin/setoran" },
];

function open(route: string): void {
  void router.push(route);
}

function logout(): void {
  auth.logout();
  hafalan.reset();
  admin.reset();
  void router.replace("/login");
}

onMounted(() => {
  void admin.fetchStats();
});
</script>