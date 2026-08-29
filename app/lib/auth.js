"use client";

import { useEffect, useState } from "react";
import { api, setToken } from "./api";

const KEY = "vrs_admin";

export async function login(email, password) {
  const res = await api("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(res.token);
  localStorage.setItem(KEY, JSON.stringify(res.admin));
  window.dispatchEvent(new Event("vrs-admin-auth"));
  return res.admin;
}

export function logout() {
  setToken(null);
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("vrs-admin-auth"));
}

export function getAdmin() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function useAdmin() {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setAdmin(getAdmin());
    setReady(true);
    const sync = () => setAdmin(getAdmin());
    window.addEventListener("vrs-admin-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("vrs-admin-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return { admin, ready, isLoggedIn: !!admin };
}
