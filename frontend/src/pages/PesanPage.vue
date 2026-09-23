<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" />
        </ion-buttons>
        <ion-title>Pesan Guru &amp; Orang Tua</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-2xl space-y-4">
        <div class="hero-gradient from-emerald-600 via-teal-600 to-cyan-600 p-5">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white"
            >
              <ion-icon icon="chatbubblesOutline" class="text-xl" />
            </span>
            <div>
              <p class="font-bold text-white">Pesan &amp; Catatan</p>
              <p class="text-sm text-emerald-100">
                Diskusi hafalan santri dengan {{ lawanAlias }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label class="field-label" for="santriPesan">Santri</label>
          <select
            id="santriPesan"
            v-model="santriId"
            class="field-select"
            @change="muatPesan()"
          >
            <option value="">Pilih santri…</option>
            <option
              v-for="s in options"
              :key="s.id"
              :value="s.id"
            >
              {{ s.namaLengkap }}{{ s.kelas ? " · " + s.kelas.namaKelas : "" }}
            </option>
          </select>
        </div>

        <p v-if="hafalan.pesanError" class="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {{ hafalan.pesanError }}
        </p>

        <div
          v-if="!santriId"
          class="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400"
        >
          Pilih santri untuk melihat atau mengirim pesan.
        </div>

        <template v-else>
          <div
            ref="threadEl"
            class="max-h-[55vh] space-y-3 overflow-y-auto rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
          >
            <div
              v-if="hafalan.pesanLoading"
              class="py-8 text-center text-sm text-slate-400"
            >
              Memuat pesan…
            </div>
            <p
              v-else-if="hafalan.pesanList.length === 0"
              class="py-8 text-center text-sm text-slate-400"
            >
              Belum ada percakapan untuk santri ini.
            </p>
            <div
              v-for="p in hafalan.pesanList"
              :key="p.id"
              class="flex"
              :class="p.senderUserId === auth.user?.id ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                :class="
                  p.senderUserId === auth.user?.id
                    ? 'rounded-br-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                    : 'rounded-bl-sm bg-slate-100 text-slate-800'
                "
              >
                <p class="text-[10px] opacity-70">{{ namaPengirim(p) }}</p>
                <p class="whitespace-pre-wrap break-words">{{ p.isi }}</p>
                <p class="mt-1 text-right text-[10px] opacity-60">
                  {{ jamPesan(p.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <form class="flex gap-2" @submit.prevent="kirim">
            <textarea
              v-model="isi"
              class="field-input min-h-12 flex-1"
              rows="2"
              placeholder="Tulis pesan / catatan…"
              :disabled="hafalan.pesanSubmitting"
            ></textarea>
            <ion-button
              shape="round"
              class="btn-gradient shrink-0"
              type="submit"
              :disabled="hafalan.pesanSubmitting || isi.trim() === ''"
            >
              <ion-spinner
                v-if="hafalan.pesanSubmitting"
                name="crescent"
                class="mr-1"
              />
              <ion-icon v-else icon="sendOutline" />
            </ion-button>
          </form>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";
import { useRoute } from "vue-router";
import { toastGagal } from "@/utils/toast";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { chatbubblesOutline, sendOutline } from "ionicons/icons";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import type { Pesan } from "@/types";

const auth = useAuthStore();
const hafalan = useHafalanStore();
const route = useRoute();

const santriId = ref("");
const isi = ref("");
const threadEl = ref<HTMLElement | null>(null);

const lawanAlias = computed(() => (auth.isPengajar ? "Orang Tua" : "Pengajar"));

const options = computed(() => {
  if (hafalan.anakList.length > 0 && auth.isOrangTua) {
    return hafalan.anakList;
  }
  return hafalan.santriList;
});

function namaPengirim(p: Pesan): string {
  const s = p.sender;
  if (!s) {
    return "Pengguna";
  }
  if (s.role === "PENGAJAR") {
    return s.pengajar?.namaLengkap ?? "Pengajar";
  }
  if (s.role === "ORANG_TUA") {
    return s.orangTua?.namaLengkap ?? "Orang Tua";
  }
  return "Admin";
}

function jamPesan(t: string): string {
  return new Date(t).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function muatPesan(): Promise<void> {
  if (!santriId.value) {
    return;
  }
  await hafalan.fetchPesan(santriId.value);
  await nextTick();
  scrollKeBawah();
}

function scrollKeBawah(): void {
  if (threadEl.value) {
    threadEl.value.scrollTop = threadEl.value.scrollHeight;
  }
}

async function kirim(): Promise<void> {
  const teks = isi.value.trim();
  if (!teks || !santriId.value) {
    return;
  }
  const ok = await hafalan.kirimPesan(santriId.value, teks);
  if (ok) {
    isi.value = "";
    await nextTick();
    scrollKeBawah();
  } else {
    await toastGagal("Gagal mengirim pesan");
  }
}

onMounted(() => {
  const qsantri =
    typeof route.query.santriId === "string" ? route.query.santriId : "";
  if (qsantri && options.value.some((s) => s.id === qsantri)) {
    santriId.value = qsantri;
    void muatPesan();
  }
  void hafalan.fetchSantri().catch(() => undefined);
  if (auth.isOrangTua && hafalan.anakList.length === 0) {
    void hafalan.fetchAnak().catch(() => undefined);
  }
});
</script>