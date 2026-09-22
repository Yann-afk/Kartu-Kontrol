<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition"
    :class="
      active
        ? 'border-indigo-500 shadow-md ring-2 ring-indigo-100'
        : 'border-slate-200 shadow-sm hover:border-indigo-300'
    "
    @click="emit('select', santri)"
  >
    <span
      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold"
      :class="active ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'"
    >
      {{ initials }}
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate font-semibold text-slate-800">
        {{ santri.namaLengkap }}
      </span>
      <span class="block text-sm text-slate-500">
        NIS {{ santri.nis }}
        <template v-if="santri.kelas"> · {{ santri.kelas.namaKelas }}</template>
      </span>
    </span>
    <span
      v-if="active"
      class="shrink-0 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white"
    >
      Aktif
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Santri } from "@/types";

const props = defineProps<{
  santri: Santri;
  active: boolean;
}>();

const emit = defineEmits<{
  (e: "select", santri: Santri): void;
}>();

const initials = computed(() =>
  props.santri.namaLengkap.trim().charAt(0).toUpperCase()
);
</script>
