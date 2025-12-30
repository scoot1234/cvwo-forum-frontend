import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as any;
    return (
      data?.error ||
      data?.message ||
      err.response?.statusText ||
      err.message ||
      "Request failed"
    );
  }
  if (err instanceof Error) return err.message;
  return "Request failed";
}
