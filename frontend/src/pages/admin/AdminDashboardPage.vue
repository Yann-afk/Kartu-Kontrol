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
      <div class="mx-auto max-w-4xl space-y-8">
        <div class="flex items-center gap-4">
          <span
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl font-black text-white shadow-lg"
          >
            {{ initial }}
          </span>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">
              Halo, {{ auth.namaLengkap }}
            </h1>
            <p class="text-sm text-slate-500">
              Pusat manajemen Sistem Kartu Kontrol Hafalan.
            </p>
          </div>
        </div>

        <div v-if="!admin.stats" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div
            v-for="i in 6"
            :key="i"
            class="h-24 animate-pulse rounded-2xl bg-slate-200"
          />
        </div>

        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div
            v-for="stat in statCards"
            :key="stat.label"
            class="rounded-2xl p-4 shadow-sm ring-1"
            :class="stat.bg"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-semibold" :class="stat.text">
                  {{ stat.label }}
                </p>
                <p class="mt-1 text-2xl font-bold" :class="stat.text">
                  {{ stat.value }}
                </p>
                <p
                  v-if="stat.sub"
                  class="mt-0.5 text-xs font-medium"
                  :class="stat.subClass ?? stat.text"
                >
                  {{ stat.sub }}
                </p>
              </div>
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70"
              >
                <ion-icon :icon="stat.icon" :class="stat.text" />
              </span>
            </div>
          </div>
        </div>

        <section>
          <h2 class="text-lg font-bold text-slate-800">Menu Manajemen</h2>
          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              v-for="card in menuItems"
              :key="card.route"
              type="button"
              class="flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:ring-indigo-300"
              @click="open(card.route)"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                :class="card.iconBg"
              >
                <ion-icon :icon="card.icon" :class="card.iconColor" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold text-slate-800">
                  {{ card.title }}
                </span>
                <span class="mt-0.5 block text-sm text-slate-500">
                  {{ card.desc }}
                </span>
              </span>
              <ion-icon icon="chevron-forward" class="shrink-0 text-slate-300" />
            </button>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import {
  bookOutline,
  hourglassOutline,
  peopleOutline,
  personOutline,
  readerOutline,
  schoolOutline,
} from "ionicons/icons";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import { useAdminStore } from "@/stores/admin";

const router = useRouter();
const auth = useAuthStore();
const hafalan = useHafalanStore();
const admin = useAdminStore();

const initial = computed(() =>
  (auth.namaLengkap ?? "A").trim().charAt(0).toUpperCase()
);

const statCards = computed(() => {
  const s = admin.stats;
  if (!s) {
    return [];
  }
  return [
    {
      label: "Akun Pengguna",
      value: s.users.ADMIN + s.users.PENGAJAR + s.users.ORANG_TUA,
      sub: `${s.users.PENGAJAR} pengajar · ${s.users.ORANG_TUA} wali`,
      subClass: undefined,
      icon: peopleOutline,
      bg: "bg-indigo-50 ring-indigo-100",
      text: "text-indigo-700",
    },
    {
      label: "Santri",
      value: s.totalSantri,
      sub: undefined,
      subClass: undefined,
      icon: personOutline,
      bg: "bg-emerald-50 ring-emerald-100",
      text: "text-emerald-700",
    },
    {
      label: "Kelas",
      value: s.totalKelas,
      sub: undefined,
      subClass: undefined,
      icon: schoolOutline,
      bg: "bg-violet-50 ring-violet-100",
      text: "text-violet-700",
    },
    {
      label: "Materi",
      value: s.totalMateri,
      sub: undefined,
      subClass: undefined,
      icon: bookOutline,
      bg: "bg-amber-50 ring-amber-100",
      text: "text-amber-700",
    },
    {
      label: "Total Setoran",
      value: s.totalSetoran,
      sub: `${s.setoranHariIni} hari ini`,
      icon: readerOutline,
      bg: "bg-sky-50 ring-sky-100",
      text: "text-sky-700",
      subClass: "text-slate-400",
    },
    {
      label: "Belum Diverifikasi",
      value: s.setoranBelumDiverifikasi,
      sub: undefined,
      subClass: undefined,
      icon: hourglassOutline,
      bg: "bg-orange-50 ring-orange-100",
      text: "text-orange-700",
    },
  ];
});

const menuItems = [
  {
    title: "Manajemen User",
    desc: "Akun Admin, Pengajar, dan Orang Tua.",
    route: "/admin/users",
    icon: peopleOutline,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    title: "Manajemen Santri",
    desc: "Data santri, wali, dan kelas.",
    route: "/admin/santri",
    icon: personOutline,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Manajemen Kelas",
    desc: "Kelas/halaqoh dan pengajarnya.",
    route: "/admin/kelas",
    icon: schoolOutline,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    title: "Katalog Materi",
    desc: "Surah, juz, dan jumlah ayat.",
    route: "/admin/materi",
    icon: bookOutline,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Semua Setoran",
    desc: "Seluruh data kartu kontrol setoran.",
    route: "/admin/setoran",
    icon: readerOutline,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
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