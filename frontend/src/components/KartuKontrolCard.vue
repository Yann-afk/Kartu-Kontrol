<template>
  <div
    class="rounded-xl border-l-4 bg-white p-4 shadow-sm transition"
    :class="
      isSekolah
        ? 'border-l-emerald-500 ring-1 ring-emerald-100'
        : 'border-l-sky-500 ring-1 ring-sky-100'
    "
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span :class="isSekolah ? 'badge-sekolah' : 'badge-rumah'">
            {{ isSekolah ? "Sekolah" : "Rumah" }}
          </span>
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
            :class="
              kartu.jenisSetoran === 'ZIYADAH'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-indigo-100 text-indigo-700'
            "
          >
            {{ formatJenis }}
          </span>
          <span
            v-if="kartu.isVerifiedByPengajar"
            class="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-teal-700"
          >
            Terverifikasi
          </span>
          <span
            v-else-if="isRumah"
            class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700"
          >
            Menunggu Verifikasi
          </span>
        </div>

        <h3 class="mt-2.5 truncate font-bold text-slate-800">
          {{ kartu.materi.namaSurah }}
        </h3>
        <p class="text-sm text-slate-500">
          Ayat {{ kartu.ayatMulai }}–{{ kartu.ayatSelesai }} · Juz
          {{ kartu.materi.juz }} · {{ kartu.santri.namaLengkap }}
        </p>
      </div>

      <span
        v-if="kartu.nilai"
        class="shrink-0 rounded-lg px-2.5 py-1 text-sm font-extrabold text-white shadow"
        :class="nilaiColor"
      >
        {{ kartu.nilai }}
      </span>
    </div>

    <p
      v-if="kartu.catatan"
      class="mt-3 rounded-lg bg-slate-50 p-2.5 text-sm italic leading-relaxed text-slate-600"
    >
      "{{ kartu.catatan }}"
    </p>

    <div
      class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-400"
    >
      <span class="truncate">Disimak oleh {{ penyimakName }}</span>
      <span class="shrink-0 font-medium">{{ tanggalLabel }}</span>
    </div>

    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { KartuKontrol } from "@/types";

const props = defineProps<{
  kartu: KartuKontrol;
}>();

const isSekolah = computed(() => props.kartu.sumberInput === "SEKOLAH");
const isRumah = computed(() => props.kartu.sumberInput === "RUMAH");

const formatJenis = computed(() =>
  props.kartu.jenisSetoran === "ZIYADAH" ? "Ziyadah" : "Muroja'ah"
);

const penyimakName = computed(() => {
  const d = props.kartu.disimakOleh;
  return d.pengajar?.namaLengkap ?? d.orangTua?.namaLengkap ?? d.email;
});

const tanggalLabel = computed(() =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(props.kartu.tanggalSetoran)
  )
);

const nilaiColor = computed(() => {
  switch (props.kartu.nilai) {
    case "A":
      return "bg-emerald-500";
    case "B":
      return "bg-sky-500";
    case "C":
      return "bg-amber-500";
    case "D":
      return "bg-orange-500";
    default:
      return "bg-rose-500";
  }
});
</script>
