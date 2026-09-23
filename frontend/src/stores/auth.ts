import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/api/axios";
import { TOKEN_KEY, USER_KEY, ANAK_AKTIF_KEY } from "@/constants/storage";
import { extractError } from "@/utils/error";
import { bindPushToAccount, unregisterPush } from "@/plugins/push";
import type { MeResponse, Role, UpdateProfilPayload, User } from "@/types";

function parseUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<User | null>(parseUser());
  const profile = ref<MeResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const role = computed<Role | null>(() => user.value?.role ?? null);
  const namaLengkap = computed(
    () => profile.value?.namaLengkap ?? user.value?.email ?? ""
  );
  const isPengajar = computed(() => role.value === "PENGAJAR");
  const isOrangTua = computed(() => role.value === "ORANG_TUA");
  const isAdmin = computed(() => role.value === "ADMIN");

  const berandaPath = computed(() => {
    switch (role.value) {
      case "ADMIN":
        return "/admin";
      case "PENGAJAR":
        return "/pengajar";
      case "ORANG_TUA":
        return "/orangtua";
      default:
        return "/login";
    }
  });

  async function login(email: string, password: string): Promise<User | null> {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post("/auth/login", { email, password });
      const data = res.data.data as { token: string; user: User };
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      error.value = extractError(err);
      return null;
    } finally {
      loading.value = false;
      if (isAuthenticated.value) {
        void bindPushToAccount();
      }
    }
  }

  async function fetchMe(): Promise<void> {
    if (!token.value) {
      return;
    }
    try {
      const res = await api.get("/auth/me");
      profile.value = res.data.data as MeResponse;
    } catch {
      profile.value = null;
    }
  }

  async function updateProfil(
    payload: UpdateProfilPayload
  ): Promise<MeResponse | null> {
    error.value = null;
    try {
      const res = await api.patch("/auth/me", payload);
      profile.value = res.data.data as MeResponse;
      return profile.value;
    } catch (err) {
      error.value = extractError(err);
      return null;
    }
  }

  function logout(): void {
    void unregisterPush(token.value ?? undefined);
    token.value = null;
    user.value = null;
    profile.value = null;
    error.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ANAK_AKTIF_KEY);
  }

  return {
    token,
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    role,
    namaLengkap,
    isPengajar,
    isOrangTua,
    isAdmin,
    berandaPath,
    login,
    fetchMe,
    updateProfil,
    logout,
  };
});
