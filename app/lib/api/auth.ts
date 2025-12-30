import { api } from "./client";

export type StoredUser = { id: number; username: string; role: string };

export type LoginResponse = {
  message: string;
  user: StoredUser;
};

export async function login(
  username: string,
  password: string
): Promise<StoredUser> {
  const res = await api.post<LoginResponse>("/auth/login", {
    username,
    password,
  });
  return res.data.user;
}

export async function signup(
  username: string,
  password: string
): Promise<void> {
  await api.post("/auth/signup", { username, password });
}

const KEY = "user";

function hasStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export function getStoredUser(): StoredUser | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser) {
  if (!hasStorage()) return;
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  if (!hasStorage()) return;
  window.localStorage.removeItem(KEY);
}
