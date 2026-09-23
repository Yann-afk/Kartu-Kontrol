<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Halo, {{ auth.namaLengkap }}</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="logout">Keluar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mx-auto max-w-4xl">
        <h2 class="text-lg font-bold text-slate-800">Pilih Anak</h2>
        <p class="text-sm text-slate-500">
          Pilih profil anak untuk melihat kartu kontrol hafalannya.
        </p>

        <div
          v-if="hafalan.loading && hafalan.anakList.length === 0"
          class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div
            v-for="i in 2"
            :key="i"
            class="h-24 animate-pulse rounded-xl bg-slate-200"
          />
        </div>

        <div
          v-else-if="hafalan.anakList.length === 0"
          class="mt-4 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400"
        >
          Belum ada data anak terdaftar. Hubungi Admin sekolah.
        </div>

        <div v-else class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PilihAnakCard
            v-for="anak in hafalan.anakList"
            :key="anak.id"
            :santri="anak"
            :active="hafalan.anakAktif?.id === anak.id"
            @select="hafalan.pilihAnak"
          />
        </div>

        <template v-if="anakAktif">
          <div class="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 class="text-lg font-bold text-slate-800">
              {{ anakAktif.namaLengkap }}
            </h3>
            <p class="text-sm text-slate-500">
              NIS {{ anakAktif.nis }}
              <template v-if="anakAktif.kelas">
                · {{ anakAktif.kelas.namaKelas }}
              </template>
            </p>

            <div class="mt-4 grid grid-cols-3 gap-3">
              <div class="rounded-xl bg-indigo-50 p-3 text-center">
                <p class="text-xl font-bold text-indigo-700">
                  {{ hafalan.feedMeta.total }}
                </p>
                <p class="text-xs font-medium text-indigo-400">Setoran</p>
              </div>
              <div class="rounded-xl bg-emerald-50 p-3 text-center">
                <p class="text-xl font-bold text-emerald-700">
                  {{ hafalan.feedSekolahCount }}
                </p>
                <p class="text-xs font-medium text-emerald-400">Sekolah</p>
              </div>
              <div class="rounded-xl bg-sky-50 p-3 text-center">
                <p class="text-xl font-bold text-sky-700">
                  {{ hafalan.feedRumahCount }}
                </p>
                <p class="text-xs font-medium text-sky-400">Rumah</p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2">
              <ion-button shape="round" size="small" @click="router.push('/orangtua/feed')">
                Feed
              </ion-button>
              <ion-button
                shape="round"
                size="small"
                fill="outline"
                @click="router.push('/orangtua/grafik')"
              >
                Grafik
              </ion-button>
              <ion-button
                shape="round"
                size="small"
                fill="outline"
                color="success"
                @click="showInput = true"
              >
                Setoran
              </ion-button>
            </div>

            <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ion-button shape="round" size="small" fill="outline" color="secondary" @click="router.push('/rekap')">
                Rekap
              </ion-button>
              <ion-button shape="round" size="small" fill="outline" color="tertiary" @click="router.push('/statistik')">
                Statistik
              </ion-button>
              <ion-button shape="round" size="small" fill="outline" color="success" @click="router.push('/pesan')">
                Pesan Guru
              </ion-button>
              <ion-button shape="round" size="small" fill="outline" color="medium" @click="router.push('/profil')">
                Profil
              </ion-button>
            </div>
          </div>

          <div class="mt-8">
            <h3 class="text-base font-bold text-slate-800">Setoran Terbaru</h3>
            <div class="mt-3 space-y-3">
              <KartuKontrolCard
                v-for="kartu in hafalan.feed.slice(0, 2)"
                :key="kartu.id"
                :kartu="kartu"
              />
              <p
                v-if="hafalan.feed.length === 0"
                class="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400"
              >
                Belum ada setoran untuk {{ anakAktif.namaLengkap }}.
              </p>
            </div>
          </div>
        </template>
      </div>
    </ion-content>

    <ion-modal :is-open="showInput" @did-dismiss="showInput = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Tambah Setoran Rumah</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="showInput = false">
              Tutup
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <InputSetoranForm
          :santri="anakAktif"
          :show-santri-select="false"
          :santri-options="hafalan.anakList"
          @submitted="onSubmitted"
        />
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { useAuthStore } from "@/stores/auth";
import { useHafalanStore } from "@/stores/hafalan";
import PilihAnakCard from "@/components/PilihAnakCard.vue";
import KartuKontrolCard from "@/components/KartuKontrolCard.vue";
import InputSetoranForm from "@/components/InputSetoranForm.vue";

const router = useRouter();
const auth = useAuthStore();
const hafalan = useHafalanStore();

const showInput = ref(false);

const anakAktif = computed(() => hafalan.anakAktif);

function logout(): void {
  auth.logout();
  hafalan.reset();
  void router.replace("/login");
}

function onSubmitted(): void {
  showInput.value = false;
}

onMounted(() => {
  void hafalan.fetchAnak().then(() => {
    if (hafalan.anakAktif) {
      void hafalan.fetchFeed(1);
    }
  });
});
</script>