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
      <div class="mx-auto max-w-4xl space-y-6">
        <div class="hero-gradient from-indigo-600 via-violet-600 to-fuchsia-600">
          <div class="flex items-center gap-4">
            <span
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black text-white shadow-inner ring-2 ring-white/40"
            >
              {{ initial }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold uppercase tracking-widest text-indigo-200">
                Panel Admin
              </p>
              <h1 class="truncate text-xl font-bold text-white sm:text-2xl">
                Halo, {{ auth.namaLengkap }}
              </h1>
              <p class="text-sm text-indigo-100">
                Pusat manajemen Kartu Kontrol Hafalan.
              </p>
            </div>
            <span
              v-if="admin.stats"
              class="hidden shrink-0 flex-col items-center rounded-2xl bg-white/15 px-4 py-2 ring-1 ring-white/30 sm:flex"
            >
              <span class="text-2xl font-black text-white">
                {{ admin.stats.setoranHariIni }}
              </span>
              <span class="text-[11px] font-bold uppercase tracking-wide text-indigo-100">
                Setoran hari ini
              </span>
            </span>
          </div>
        </div>

        <div v-if="!admin.stats" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div
            v-for="i in 6"
            :key="i"
            class="h-28 animate-pulse rounded-2xl bg-slate-200"
          />
        </div>

        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div
            v-for="stat in statCards"
            :key="stat.label"
            class="rounded-2xl p-4 shadow-lg transition hover:-translate-y-0.5"
            :class="stat.bg"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-white/80">
                  {{ stat.label }}
                </p>
                <p class="mt-1 text-2xl font-black text-white">
                  {{ stat.value }}
                </p>
                <p
                  v-if="stat.sub"
                  class="mt-0.5 text-xs font-semibold"
                  :class="stat.subClass ?? 'text-white/80'"
                >
                  {{ stat.sub }}
                </p>
              </div>
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/25 text-white"
              >
                <ion-icon :icon="stat.icon" />
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
              class="row-card"
              :class="card.rowRing"
              @click="open(card.route)"
            >
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md"
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
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                :class="card.chevronBg"
              >
                <ion-icon icon="chevron-forward" :class="card.iconColor" class="text-sm" />
              </span>
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
      subClass: "text-white/75",
      icon: peopleOutline,
      bg: "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/40",
    },
    {
      label: "Santri",
      value: s.totalSantri,
      sub: undefined,
      subClass: undefined,
      icon: personOutline,
      bg: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/40",
    },
    {
      label: "Kelas",
      value: s.totalKelas,
      sub: undefined,
      subClass: undefined,
      icon: schoolOutline,
      bg: "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/40",
    },
    {
      label: "Materi",
      value: s.totalMateri,
      sub: undefined,
      subClass: undefined,
      icon: bookOutline,
      bg: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/40",
    },
    {
      label: "Total Setoran",
      value: s.totalSetoran,
      sub: `${s.setoranHariIni} hari ini`,
      subClass: "text-white/75",
      icon: readerOutline,
      bg: "bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/40",
    },
    {
      label: "Belum Diverifikasi",
      value: s.setoranBelumDiverifikasi,
      sub: undefined,
      subClass: undefined,
      icon: hourglassOutline,
      bg: "bg-gradient-to-br from-orange-500 to-rose-600 shadow-orange-500/40",
    },
  ];
});

const menuItems = [
  {
    title: "Manajemen User",
    desc: "Akun Admin, Pengajar, dan Orang Tua.",
    route: "/admin/users",
    icon: peopleOutline,
    iconBg: "bg-gradient-to-br from-indigo-500 to-violet-600",
    iconColor: "text-white",
    chevronBg: "bg-indigo-100",
    rowRing: "border-l-indigo-500 ring-indigo-100 hover:ring-indigo-300",
  },
  {
    title: "Manajemen Santri",
    desc: "Data santri, wali, dan kelas.",
    route: "/admin/santri",
    icon: personOutline,
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    iconColor: "text-white",
    chevronBg: "bg-emerald-100",
    rowRing: "border-l-emerald-500 ring-emerald-100 hover:ring-emerald-300",
  },
  {
    title: "Manajemen Kelas",
    desc: "Kelas/halaqoh dan pengajarnya.",
    route: "/admin/kelas",
    icon: schoolOutline,
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    iconColor: "text-white",
    chevronBg: "bg-violet-100",
    rowRing: "border-l-violet-500 ring-violet-100 hover:ring-violet-300",
  },
  {
    title: "Katalog Materi",
    desc: "Surah, juz, dan jumlah ayat.",
    route: "/admin/materi",
    icon: bookOutline,
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    iconColor: "text-white",
    chevronBg: "bg-amber-100",
    rowRing: "border-l-amber-500 ring-amber-100 hover:ring-amber-300",
  },
  {
    title: "Semua Setoran",
    desc: "Seluruh data kartu kontrol setoran.",
    route: "/admin/setoran",
    icon: readerOutline,
    iconBg: "bg-gradient-to-br from-sky-500 to-blue-600",
    iconColor: "text-white",
    chevronBg: "bg-sky-100",
    rowRing: "border-l-sky-500 ring-sky-100 hover:ring-sky-300",
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