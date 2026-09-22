<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <div v-if="showSantriSelect">
      <label class="field-label">Pilih Santri</label>
      <select v-model="form.santriId" class="field-input" required>
        <option value="" disabled>-- Pilih santri --</option>
        <option v-for="s in santriOptions" :key="s.id" :value="s.id">
          {{ s.namaLengkap }}
          <template v-if="s.kelas"> ({{ s.kelas.namaKelas }})</template>
        </option>
      </select>
      <p v-if="fieldErrors.santriId" class="field-error">
        {{ fieldErrors.santriId }}
      </p>
    </div>

    <div>
      <label class="field-label">Materi (Surah)</label>
      <select v-model="form.materiId" class="field-input" required>
        <option value="" disabled>-- Pilih surah --</option>
        <option v-for="m in hafalan.materiList" :key="m.id" :value="m.id">
          {{ m.namaSurah }} (Juz {{ m.juz }} · {{ m.totalAyat }} ayat)
        </option>
      </select>
      <p v-if="fieldErrors.materiId" class="field-error">
        {{ fieldErrors.materiId }}
      </p>
    </div>

    <div>
      <label class="field-label">Jenis Setoran</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="j in jenisOptions"
          :key="j"
          type="button"
          class="chip-base"
          :class="form.jenisSetoran === j ? 'chip-active' : 'chip-inactive'"
          @click="form.jenisSetoran = j"
        >
          {{ j === "ZIYADAH" ? "Ziyadah (Baru)" : "Muroja'ah (Ulang)" }}
        </button>
      </div>
      <p v-if="auth.isOrangTua" class="mt-1 text-xs text-slate-400">
        Orang tua hanya dapat input Muroja'ah.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Ayat Mulai</label>
        <input
          v-model="form.ayatMulai"
          type="number"
          min="1"
          class="field-input"
          placeholder="1"
        />
        <p v-if="fieldErrors.ayatMulai" class="field-error">
          {{ fieldErrors.ayatMulai }}
        </p>
      </div>
      <div>
        <label class="field-label">Ayat Selesai</label>
        <input
          v-model="form.ayatSelesai"
          type="number"
          min="1"
          class="field-input"
          placeholder="7"
        />
        <p v-if="fieldErrors.ayatSelesai" class="field-error">
          {{ fieldErrors.ayatSelesai }}
        </p>
      </div>
    </div>

    <div v-if="!auth.isOrangTua">
      <label class="field-label">Nilai</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="n in nilaiOptions"
          :key="n"
          type="button"
          class="chip-base"
          :class="form.nilai === n ? 'chip-active' : 'chip-inactive'"
          @click="form.nilai = n"
        >
          {{ n }}
        </button>
      </div>
      <p v-if="fieldErrors.nilai" class="field-error">
        {{ fieldErrors.nilai }}
      </p>
    </div>

    <div>
      <label class="field-label">Catatan</label>
      <textarea
        v-model="form.catatan"
        rows="3"
        class="field-input resize-none"
        :placeholder="
          auth.isOrangTua
            ? 'Catatan orang tua tentang kelancaran anak...'
            : 'Feedback untuk santri...'
        "
      />
    </div>

    <div>
      <label class="field-label">Tanggal Setoran</label>
      <input v-model="form.tanggalSetoran" type="date" class="field-input" />
    </div>

    <p
      v-if="hafalan.error && !fieldErrorsHasValue"
      class="rounded-lg bg-red-50 p-2.5 text-sm font-medium text-red-600"
    >
      {{ hafalan.error }}
    </p>

    <ion-button
      class="ion-margin-top"
      type="submit"
      expand="block"
      shape="round"
      :disabled="hafalan.submitting"
    >
      <ion-spinner v-if="hafalan.submitting" name="crescent" />
      <template v-else>Simpan Setoran</template>
    </ion-button>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from "vue";
import { IonButton, IonSpinner, toastController } from "@ionic/vue";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import type {
  CreateKartuKontrolPayload,
  JenisSetoran,
  KartuKontrol,
  Santri,
} from "@/types";

const props = withDefaults(
  defineProps<{
    santri?: Santri | null;
    showSantriSelect?: boolean;
    santriOptions?: Santri[];
  }>(),
  {
    santri: null,
    showSantriSelect: false,
    santriOptions: () => [],
  }
);

const emit = defineEmits<{
  (e: "submitted", kartu: KartuKontrol): void;
}>();

const auth = useAuthStore();
const hafalan = useHafalanStore();

const nilaiOptions = ["A", "B", "C", "D", "Belum Lulus"];

const today = new Date().toISOString().slice(0, 10);

const form = reactive({
  santriId: props.santri?.id ?? "",
  materiId: "",
  jenisSetoran: (auth.isOrangTua ? "MUROJAAH" : "ZIYADAH") as JenisSetoran,
  ayatMulai: "1",
  ayatSelesai: "7",
  nilai: "",
  catatan: "",
  tanggalSetoran: today,
});

const fieldErrors = reactive<Record<string, string>>({});

const fieldErrorsHasValue = computed(
  () => Object.keys(fieldErrors).length > 0
);

const jenisOptions = computed<JenisSetoran[]>(() =>
  auth.isOrangTua ? ["MUROJAAH"] : ["ZIYADAH", "MUROJAAH"]
);

watch(
  () => props.santri,
  (value) => {
    if (value) {
      form.santriId = value.id;
    }
  },
  { immediate: true }
);

onMounted(() => {
  void hafalan.fetchMateri();
});

function validate(): boolean {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);

  if (!form.santriId) {
    fieldErrors.santriId = "Pilih santri terlebih dahulu";
  }
  if (!form.materiId) {
    fieldErrors.materiId = "Pilih materi surah";
  }

  const mulai = Number(form.ayatMulai);
  const selesai = Number(form.ayatSelesai);

  if (!Number.isInteger(mulai) || mulai < 1) {
    fieldErrors.ayatMulai = "Isi ayat mulai dengan benar";
  }
  if (!Number.isInteger(selesai) || selesai < 1) {
    fieldErrors.ayatSelesai = "Isi ayat selesai dengan benar";
  } else if (Number.isInteger(mulai) && selesai < mulai) {
    fieldErrors.ayatSelesai = "Tidak boleh kurang dari ayat mulai";
  }

  const materi = hafalan.materiList.find((m) => m.id === form.materiId);
  if (materi && Number.isInteger(selesai) && selesai > materi.totalAyat) {
    fieldErrors.ayatSelesai = `Maksimal ${materi.totalAyat} ayat`;
  }

  if (!auth.isOrangTua && !form.nilai) {
    fieldErrors.nilai = "Pilih nilai terlebih dahulu";
  }

  return Object.keys(fieldErrors).length === 0;
}

async function showToast(message: string, color: "success" | "danger") {
  const toast = await toastController.create({
    message,
    duration: 2200,
    color,
    position: "bottom",
  });
  await toast.present();
}

function resetForm(): void {
  form.materiId = "";
  form.jenisSetoran = auth.isOrangTua ? "MUROJAAH" : "ZIYADAH";
  form.ayatMulai = "1";
  form.ayatSelesai = "7";
  form.nilai = "";
  form.catatan = "";
  form.tanggalSetoran = today;
}

async function handleSubmit(): Promise<void> {
  if (!validate()) {
    return;
  }

  const payload: CreateKartuKontrolPayload = {
    santriId: form.santriId,
    materiId: form.materiId,
    jenisSetoran: form.jenisSetoran,
    ayatMulai: Number(form.ayatMulai),
    ayatSelesai: Number(form.ayatSelesai),
    nilai: auth.isOrangTua ? null : form.nilai || null,
    catatan: form.catatan.trim() || null,
    tanggalSetoran: form.tanggalSetoran
      ? new Date(form.tanggalSetoran).toISOString()
      : undefined,
  };

  const created = await hafalan.tambahSetoran(payload);
  if (created) {
    await showToast("Setoran hafalan berhasil disimpan", "success");
    resetForm();
    emit("submitted", created);
  } else {
    await showToast(hafalan.error ?? "Gagal menyimpan setoran", "danger");
  }
}
</script>
