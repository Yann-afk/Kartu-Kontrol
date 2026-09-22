import { isAxiosError } from "axios";

export function extractError(err: unknown): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)
      ?.message;
    if (message) {
      return message;
    }
    if (err.response) {
      return `Permintaan gagal (HTTP ${err.response.status})`;
    }
    return "Tidak dapat terhubung ke server, periksa koneksi Anda";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Terjadi kesalahan tidak terduga";
}
