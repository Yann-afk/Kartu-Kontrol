<template>
  <span
    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
    :class="colorClass"
  >
    {{ initials }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    color?: "indigo" | "violet" | "emerald" | "amber" | "sky";
  }>(),
  { color: "indigo" }
);

const colors: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-sky-100 text-sky-700",
};

const colorClass = computed(() => colors[props.color] ?? colors.indigo);

const initials = computed(() => {
  const cleaned = props.name.trim();
  if (!cleaned) {
    return "?";
  }
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
});
</script>