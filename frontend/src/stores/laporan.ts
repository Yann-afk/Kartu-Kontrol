import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/api/axios";
import { extractError } from "@/utils/error";
import type { RekapData, StatistikData } from "@/types";

export interface RekapParams {
  kelasId?: string;
  santriId?: string;
  tanggalAwal?: string;
  tanggalAkhir?: string;
  page?: number;
  limit?: number;
}

export interface StatistikParams {
  kelasId?: string;
  santriId?: string;
  tanggalAwal?: string;
  tanggalAkhir?: string;
}

export const useLaporanStore = defineStore("laporan", () => {
  const rekap = ref<RekapData | null>(null);
  const statistik = ref<StatistikData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRekap(params: RekapParams): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get("/rekap", { params });
      rekap.value = res.data.data as RekapData;
    } catch (err) {
      error.value = extractError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatistik(params: StatistikParams): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get("/statistik", { params });
      statistik.value = res.data.data as StatistikData;
    } catch (err) {
      error.value = extractError(err);
    } finally {
      loading.value = false;
    }
  }

  function reset(): void {
    rekap.value = null;
    statistik.value = null;
    error.value = null;
  }

  return {
    rekap,
    statistik,
    loading,
    error,
    fetchRekap,
    fetchStatistik,
    reset,
  };
});