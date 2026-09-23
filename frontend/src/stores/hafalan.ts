import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/api/axios";
import { ANAK_AKTIF_KEY } from "@/constants/storage";
import { extractError } from "@/utils/error";
import { useAuthStore } from "@/stores/auth";
import type {
  CreateKartuKontrolPayload,
  FeedPage,
  JenisSetoran,
  KartuKontrol,
  Kelas,
  Materi,
  Pesan,
  Santri,
  SumberInput,
} from "@/types";

export const useHafalanStore = defineStore("hafalan", () => {
  const auth = useAuthStore();

  const anakList = ref<Santri[]>([]);
  const anakAktif = ref<Santri | null>(null);
  const santriList = ref<Santri[]>([]);
  const kelasList = ref<Kelas[]>([]);
  const materiList = ref<Materi[]>([]);
  const feed = ref<KartuKontrol[]>([]);
  const feedMeta = ref({ page: 1, limit: 20, total: 0 });

  const kelasFilterId = ref<string | null>(null);
  const santriFilterId = ref<string | null>(null);
  const sumberFilter = ref<SumberInput | "">("");
  const jenisFilter = ref<JenisSetoran | "">("");

  const loading = ref(false);
  const loadingMore = ref(false);
  const submitting = ref(false);
  const error = ref<string | null>(null);

  const pesanList = ref<Pesan[]>([]);
  const pesanLoading = ref(false);
  const pesanSubmitting = ref(false);
  const pesanError = ref<string | null>(null);

  const hasMore = computed(
    () => feedMeta.value.page * feedMeta.value.limit < feedMeta.value.total
  );
  const feedSekolahCount = computed(
    () => feed.value.filter((k) => k.sumberInput === "SEKOLAH").length
  );
  const feedRumahCount = computed(
    () => feed.value.filter((k) => k.sumberInput === "RUMAH").length
  );
  const totalAyatTersetor = computed(() =>
    feed.value.reduce((sum, k) => sum + (k.ayatSelesai - k.ayatMulai + 1), 0)
  );

  function resetFeed(): void {
    feed.value = [];
    feedMeta.value = { page: 1, limit: 20, total: 0 };
  }

  async function fetchAnak(): Promise<void> {
    try {
      const res = await api.get("/santri");
      anakList.value = res.data.data as Santri[];
      const savedId = localStorage.getItem(ANAK_AKTIF_KEY);
      const found =
        anakList.value.find((s) => s.id === savedId) ??
        anakList.value[0] ??
        null;
      anakAktif.value = found;
      if (found) {
        localStorage.setItem(ANAK_AKTIF_KEY, found.id);
      }
    } catch (err) {
      error.value = extractError(err);
    }
  }

  function pilihAnak(santri: Santri): void {
    anakAktif.value = santri;
    localStorage.setItem(ANAK_AKTIF_KEY, santri.id);
    resetFeed();
    void fetchFeed(1);
  }

  async function fetchSantri(): Promise<void> {
    try {
      const res = await api.get("/santri");
      santriList.value = res.data.data as Santri[];
    } catch (err) {
      error.value = extractError(err);
    }
  }

  async function fetchKelas(): Promise<void> {
    try {
      const res = await api.get("/kelas");
      kelasList.value = res.data.data as Kelas[];
    } catch (err) {
      error.value = extractError(err);
    }
  }

  async function fetchMateri(): Promise<void> {
    if (materiList.value.length > 0) {
      return;
    }
    try {
      const res = await api.get("/materi");
      materiList.value = res.data.data as Materi[];
    } catch (err) {
      error.value = extractError(err);
    }
  }

  async function fetchFeed(page = 1): Promise<void> {
    if (page === 1) {
      loading.value = true;
    } else {
      loadingMore.value = true;
    }
    error.value = null;
    try {
      const params: Record<string, unknown> = { page, limit: feedMeta.value.limit };

      if (santriFilterId.value) {
        params.santriId = santriFilterId.value;
      } else if (auth.isOrangTua && anakAktif.value) {
        params.santriId = anakAktif.value.id;
      }
      if (sumberFilter.value) {
        params.sumberInput = sumberFilter.value;
      }
      if (jenisFilter.value) {
        params.jenisSetoran = jenisFilter.value;
      }

      const res = await api.get("/kartu-kontrol", { params });
      const data = res.data.data as FeedPage;
      feed.value =
        page === 1 ? data.items : [...feed.value, ...data.items];
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

  async function tambahSetoran(
    payload: CreateKartuKontrolPayload
  ): Promise<KartuKontrol | null> {
    submitting.value = true;
    error.value = null;
    try {
      const res = await api.post("/kartu-kontrol", payload);
      const created = res.data.data as KartuKontrol;
      feed.value.unshift(created);
      feedMeta.value.total += 1;
      return created;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function verifikasiSetoran(id: string): Promise<KartuKontrol | null> {
    try {
      const res = await api.patch(`/kartu-kontrol/${id}/verify`);
      const updated = res.data.data as KartuKontrol;
      const index = feed.value.findIndex((k) => k.id === id);
      if (index !== -1) {
        feed.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = extractError(err);
      return null;
    }
  }

  function setSumberFilter(value: SumberInput | ""): void {
    sumberFilter.value = value;
    resetFeed();
    void fetchFeed(1);
  }

  function setJenisFilter(value: JenisSetoran | ""): void {
    jenisFilter.value = value;
    resetFeed();
    void fetchFeed(1);
  }

  function setKelasFilter(kelasId: string | null): void {
    kelasFilterId.value = kelasId;
    santriFilterId.value = null;
    resetFeed();
  }

  function setSantriFilter(santriId: string | null): void {
    santriFilterId.value = santriId;
    resetFeed();
    void fetchFeed(1);
  }

  async function fetchPesan(santriId: string): Promise<void> {
    pesanLoading.value = true;
    pesanError.value = null;
    try {
      const res = await api.get("/pesan", { params: { santriId } });
      pesanList.value = (res.data.data as { items: Pesan[] }).items;
    } catch (err) {
      pesanError.value = extractError(err);
    } finally {
      pesanLoading.value = false;
    }
  }

  async function kirimPesan(santriId: string, isi: string): Promise<boolean> {
    pesanSubmitting.value = true;
    pesanError.value = null;
    try {
      const res = await api.post("/pesan", { santriId, isi });
      pesanList.value.push(res.data.data as Pesan);
      return true;
    } catch (err) {
      pesanError.value = extractError(err);
      return false;
    } finally {
      pesanSubmitting.value = false;
    }
  }

  function reset(): void {
    anakList.value = [];
    anakAktif.value = null;
    santriList.value = [];
    kelasList.value = [];
    materiList.value = [];
    feed.value = [];
    feedMeta.value = { page: 1, limit: 20, total: 0 };
    kelasFilterId.value = null;
    santriFilterId.value = null;
    sumberFilter.value = "";
    jenisFilter.value = "";
    error.value = null;
  }

  return {
    anakList,
    anakAktif,
    santriList,
    kelasList,
    materiList,
    feed,
    feedMeta,
    kelasFilterId,
    santriFilterId,
    sumberFilter,
    jenisFilter,
    loading,
    loadingMore,
    submitting,
    error,
    pesanList,
    pesanLoading,
    pesanSubmitting,
    pesanError,
    hasMore,
    feedSekolahCount,
    feedRumahCount,
    totalAyatTersetor,
    fetchAnak,
    pilihAnak,
    fetchSantri,
    fetchKelas,
    fetchMateri,
    fetchFeed,
    muatLebih,
    tambahSetoran,
    verifikasiSetoran,
    setSumberFilter,
    setJenisFilter,
    setKelasFilter,
    setSantriFilter,
    fetchPesan,
    kirimPesan,
    reset,
  };
});
