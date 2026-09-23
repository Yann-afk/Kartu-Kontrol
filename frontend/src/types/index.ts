export type Role = "ADMIN" | "PENGAJAR" | "ORANG_TUA";
export type SumberInput = "SEKOLAH" | "RUMAH";
export type JenisSetoran = "ZIYADAH" | "MUROJAAH";

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  id: string;
  email: string;
  role: Role;
  namaLengkap: string | null;
  createdAt: string;
  profil: PengajarProfil | OrangTuaProfil | null;
}

export interface PengajarProfil {
  id: string;
  namaLengkap: string;
  nip?: string | null;
  noHp?: string | null;
}

export interface OrangTuaProfil {
  id: string;
  namaLengkap: string;
  noHp?: string | null;
  alamat?: string | null;
}

export interface KelasRef {
  id: string;
  namaKelas: string;
}

export interface Santri {
  id: string;
  nis: string;
  namaLengkap: string;
  kelas?: KelasRef & {
    pengajar?: { id: string; namaLengkap: string } | null;
  };
  orangTua?: { id: string; namaLengkap: string } | null;
}

export interface Materi {
  id: string;
  namaSurah: string;
  juz: number;
  totalAyat: number;
}

export interface Kelas {
  id: string;
  namaKelas: string;
  pengajar: { id: string; namaLengkap: string };
  _count?: { santri: number };
}

export interface KartuKontrol {
  id: string;
  santriId: string;
  disimakOlehUserId: string;
  materiId: string;
  sumberInput: SumberInput;
  jenisSetoran: JenisSetoran;
  ayatMulai: number;
  ayatSelesai: number;
  nilai: string | null;
  catatan: string | null;
  tanggalSetoran: string;
  isVerifiedByPengajar: boolean;
  createdAt?: string;
  santri: {
    id: string;
    nis: string;
    namaLengkap: string;
    kelas: KelasRef;
  };
  materi: Materi;
  disimakOleh: {
    id: string;
    email: string;
    role: Role;
    pengajar?: { namaLengkap: string } | null;
    orangTua?: { namaLengkap: string } | null;
  };
}

export interface FeedPage {
  items: KartuKontrol[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateKartuKontrolPayload {
  santriId: string;
  materiId: string;
  jenisSetoran: JenisSetoran;
  ayatMulai: number;
  ayatSelesai: number;
  nilai?: string | null;
  catatan?: string | null;
  tanggalSetoran?: string;
}

export interface AdminPengajarDetail {
  id: string;
  namaLengkap: string;
  nip: string | null;
  noHp: string | null;
}

export interface AdminOrangTuaDetail {
  id: string;
  namaLengkap: string;
  noHp: string | null;
  alamat: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  namaLengkap: string | null;
  pengajar: AdminPengajarDetail | null;
  orangTua: AdminOrangTuaDetail | null;
}

export interface DashboardStats {
  users: Record<Role, number>;
  totalSantri: number;
  totalKelas: number;
  totalMateri: number;
  totalSetoran: number;
  setoranHariIni: number;
  setoranBelumDiverifikasi: number;
}
