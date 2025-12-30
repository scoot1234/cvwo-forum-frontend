import { useEffect, useState } from "react";
import type { StoredUser } from "../api/auth";
import { clearStoredUser, getStoredUser, setStoredUser } from "../api/auth";

export function useAuthUser() {
  const [mounted, setMounted] = useState(false);
  const [user, setUserState] = useState<StoredUser | null>(null);

  useEffect(() => {
    setMounted(true);
    setUserState(getStoredUser());
  }, []);

  function setUser(u: StoredUser) {
    setStoredUser(u);
    setUserState(u);
  }

  function logout() {
    clearStoredUser();
    setUserState(null);
  }

  return { mounted, user, setUser, logout };
}
