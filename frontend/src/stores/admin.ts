import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/api/axios";
import { extractError } from "@/utils/error";
import type {
  AdminUser,
  CreateKartuKontrolPayload,
  DashboardStats,
  FeedPage,
  JenisSetoran,
  KartuKontrol,
  Kelas,
  Materi,
  Role,
  Santri,
  SumberInput,
  UpdateSetoranPayload,
} from "@/types";

export const useAdminStore = defineStore("admin", () => {
  const stats = ref<DashboardStats | null>(null);
  const users = ref<AdminUser[]>([]);
  const kelasList = ref<Kelas[]>([]);
  const santriList = ref<Santri[]>([]);
  const materiList = ref<Materi[]>([]);
  const feed = ref<KartuKontrol[]>([]);
  const feedMeta = ref({ page: 1, limit: 20, total: 0 });

  const loading = ref(false);
  const loadingMore = ref(false);
  const submitting = ref(false);
  const error = ref<string | null>(null);

  const hasMore = computed(
    () => feedMeta.value.page * feedMeta.value.limit < feedMeta.value.total
  );

  const pengajarOptions = computed(() =>
    users.value.filter((u) => u.role === "PENGAJAR" && u.pengajar)
  );
  const orangTuaOptions = computed(() =>
    users.value.filter((u) => u.role === "ORANG_TUA" && u.orangTua)
  );

  async function fetchStats(): Promise<boolean> {
    try {
      const res = await api.get("/admin/stats");
      stats.value = res.data.data as DashboardStats;
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  async function fetchUsers(): Promise<boolean> {
    try {
      const res = await api.get("/admin/users");
      users.value = res.data.data as AdminUser[];
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  async function createUser(payload: Partial<AdminUser> & { email: string; password: string; role: Role }): Promise<AdminUser | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.post("/admin/users", payload);
      const created = res.data.data as AdminUser;
      users.value = [...users.value, created];
      void fetchStats();
      return created;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function updateUser(id: string, payload: Record<string, unknown>): Promise<AdminUser | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.patch(`/admin/users/${id}`, payload);
      const updated = res.data.data as AdminUser;
      const index = users.value.findIndex((u) => u.id === id);
      if (index !== -1) {
        users.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function deleteUser(id: string): Promise<boolean> {
    try {
      await api.delete(`/admin/users/${id}`);
      users.value = users.value.filter((u) => u.id !== id);
      void fetchStats();
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  async function fetchKelas(): Promise<boolean> {
    try {
      const res = await api.get("/admin/kelas");
      kelasList.value = res.data.data as Kelas[];
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  async function createKelas(payload: { namaKelas: string; pengajarId: string }): Promise<Kelas | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.post("/admin/kelas", payload);
      const created = res.data.data as Kelas;
      kelasList.value = [...kelasList.value, created];
      void fetchStats();
      return created;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function updateKelas(id: string, payload: { namaKelas: string; pengajarId: string }): Promise<Kelas | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.patch(`/admin/kelas/${id}`, payload);
      const updated = res.data.data as Kelas;
      const index = kelasList.value.findIndex((k) => k.id === id);
      if (index !== -1) {
        kelasList.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function deleteKelas(id: string): Promise<boolean> {
    try {
      await api.delete(`/admin/kelas/${id}`);
      kelasList.value = kelasList.value.filter((k) => k.id !== id);
      void fetchStats();
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  async function fetchSantri(): Promise<boolean> {
    try {
      const res = await api.get("/admin/santri");
      santriList.value = res.data.data as Santri[];
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  async function createSantri(payload: { nis: string; namaLengkap: string; orangTuaId: string; kelasId: string }): Promise<Santri | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.post("/admin/santri", payload);
      const created = res.data.data as Santri;
      santriList.value = [...santriList.value, created];
      void fetchStats();
      return created;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function updateSantri(id: string, payload: { nis: string; namaLengkap: string; orangTuaId: string; kelasId: string }): Promise<Santri | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.patch(`/admin/santri/${id}`, payload);
      const updated = res.data.data as Santri;
      const index = santriList.value.findIndex((s) => s.id === id);
      if (index !== -1) {
        santriList.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function deleteSantri(id: string): Promise<boolean> {
    try {
      await api.delete(`/admin/santri/${id}`);
      santriList.value = santriList.value.filter((s) => s.id !== id);
      void fetchStats();
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  async function fetchMateri(): Promise<boolean> {
    try {
      const res = await api.get("/admin/materi");
      materiList.value = res.data.data as Materi[];
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  async function createMateri(payload: { namaSurah: string; noUrut?: number; juz: number; totalAyat: number }): Promise<Materi | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.post("/admin/materi", payload);
      const created = res.data.data as Materi;
      materiList.value = [...materiList.value, created];
      void fetchStats();
      return created;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function updateMateri(id: string, payload: { namaSurah?: string; noUrut?: number; juz?: number; totalAyat?: number }): Promise<Materi | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.patch(`/admin/materi/${id}`, payload);
      const updated = res.data.data as Materi;
      const index = materiList.value.findIndex((m) => m.id === id);
      if (index !== -1) {
        materiList.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function deleteMateri(id: string): Promise<boolean> {
    try {
      await api.delete(`/admin/materi/${id}`);
      materiList.value = materiList.value.filter((m) => m.id !== id);
      void fetchStats();
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  function resetFeed(): void {
    feed.value = [];
    feedMeta.value = { page: 1, limit: 20, total: 0 };
  }

  async function fetchFeed(
    page = 1,
    filters: { sumberInput?: SumberInput | ""; jenisSetoran?: JenisSetoran | "" } = {}
  ): Promise<void> {
    if (page === 1) {
      loading.value = true;
    } else {
      loadingMore.value = true;
    }
    error.value = null;
    try {
      const params: Record<string, unknown> = { page, limit: feedMeta.value.limit };
      if (filters.sumberInput) {
        params.sumberInput = filters.sumberInput;
      }
      if (filters.jenisSetoran) {
        params.jenisSetoran = filters.jenisSetoran;
      }
      const res = await api.get("/admin/kartu-kontrol", { params });
      const data = res.data.data as FeedPage;
      feed.value = page === 1 ? data.items : [...feed.value, ...data.items];
      feedMeta.value = { page: data.page, limit: data.limit, total: data.total };
    } catch (err) {
      error.value = extractError(err);
      if (page === 1) {
        feed.value = [];
      }
    } finally {
      if (page === 1) {
        loading.value = false;
      } else {
        loadingMore.value = false;
      }
    }
  }

  async function muatLebih(): Promise<void> {
    if (!hasMore.value || loadingMore.value) {
      return;
    }
    await fetchFeed(feedMeta.value.page + 1);
  }

  async function deleteSetoran(id: string): Promise<boolean> {
    try {
      await api.delete(`/kartu-kontrol/${id}`);
      feed.value = feed.value.filter((k) => k.id !== id);
      feedMeta.value.total = Math.max(0, feedMeta.value.total - 1);
      void fetchStats();
      return true;
    } catch (err) {
      error.value = extractError(err);
      return false;
    }
  }

  async function createSetoran(payload: CreateKartuKontrolPayload): Promise<KartuKontrol | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.post("/admin/kartu-kontrol", payload);
      const created = res.data.data as KartuKontrol;
      feed.value = [created, ...feed.value];
      feedMeta.value.total += 1;
      void fetchStats();
      return created;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function updateSetoran(id: string, payload: UpdateSetoranPayload): Promise<KartuKontrol | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.patch(`/admin/kartu-kontrol/${id}`, payload);
      const updated = res.data.data as KartuKontrol;
      const index = feed.value.findIndex((k) => k.id === id);
      if (index !== -1) {
        feed.value[index] = updated;
      }
      void fetchStats();
      return updated;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  function reset(): void {
    stats.value = null;
    users.value = [];
    kelasList.value = [];
    santriList.value = [];
    materiList.value = [];
    feed.value = [];
    feedMeta.value = { page: 1, limit: 20, total: 0 };
    error.value = null;
  }

  return {
    stats,
    users,
    kelasList,
    santriList,
    materiList,
    feed,
    feedMeta,
    loading,
    loadingMore,
    submitting,
    error,
    hasMore,
    pengajarOptions,
    orangTuaOptions,
    fetchStats,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchKelas,
    createKelas,
    updateKelas,
    deleteKelas,
    fetchSantri,
    createSantri,
    updateSantri,
    deleteSantri,
    fetchMateri,
    createMateri,
    updateMateri,
    deleteMateri,
    resetFeed,
    fetchFeed,
    muatLebih,
    deleteSetoran,
    createSetoran,
    updateSetoran,
    reset,
  };
});