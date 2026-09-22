import {
  createRouter as createIonicRouter,
  createWebHistory,
} from "@ionic/vue-router";
import type { RouteRecordRaw } from "vue-router";
import { pinia } from "@/stores";
import { useAuthStore } from "@/stores/auth";
import type { Role } from "@/types";
import LoginPage from "@/pages/LoginPage.vue";
import DashboardPengajar from "@/pages/pengajar/DashboardPengajar.vue";
import RiwayatKelasPage from "@/pages/pengajar/RiwayatKelasPage.vue";
import DashboardAnak from "@/pages/orangtua/DashboardAnak.vue";
import FeedHafalanPage from "@/pages/orangtua/FeedHafalanPage.vue";
import GrafikPerkembanganPage from "@/pages/orangtua/GrafikPerkembanganPage.vue";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage.vue";

interface AppRouteMeta {
  requiresAuth?: boolean;
  guestOnly?: boolean;
  roles?: Role[];
}

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: { guestOnly: true } satisfies AppRouteMeta,
  },
  {
    path: "/pengajar",
    name: "dashboard-pengajar",
    component: DashboardPengajar,
    meta: { requiresAuth: true, roles: ["PENGAJAR"] } satisfies AppRouteMeta,
  },
  {
    path: "/pengajar/riwayat",
    name: "riwayat-kelas",
    component: RiwayatKelasPage,
    meta: { requiresAuth: true, roles: ["PENGAJAR"] } satisfies AppRouteMeta,
  },
  {
    path: "/orangtua",
    name: "dashboard-anak",
    component: DashboardAnak,
    meta: { requiresAuth: true, roles: ["ORANG_TUA"] } satisfies AppRouteMeta,
  },
  {
    path: "/orangtua/feed",
    name: "feed-hafalan",
    component: FeedHafalanPage,
    meta: { requiresAuth: true, roles: ["ORANG_TUA"] } satisfies AppRouteMeta,
  },
  {
    path: "/orangtua/grafik",
    name: "grafik-perkembangan",
    component: GrafikPerkembanganPage,
    meta: { requiresAuth: true, roles: ["ORANG_TUA"] } satisfies AppRouteMeta,
  },
  {
    path: "/admin",
    name: "dashboard-admin",
    component: AdminDashboardPage,
    meta: { requiresAuth: true, roles: ["ADMIN"] } satisfies AppRouteMeta,
  },
  {
    path: "/",
    redirect: () => {
      const auth = useAuthStore(pinia);
      return auth.isAuthenticated ? auth.berandaPath : "/login";
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createIonicRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore(pinia);
  const meta = to.meta as unknown as AppRouteMeta;

  if (meta.guestOnly && auth.isAuthenticated) {
    return auth.berandaPath;
  }
  if (meta.requiresAuth && !auth.isAuthenticated) {
    return "/login";
  }
  if (meta.roles && auth.role && !meta.roles.includes(auth.role)) {
    return auth.berandaPath;
  }
  return true;
});

export default router;
