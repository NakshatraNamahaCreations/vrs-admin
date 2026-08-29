"use client";

export const API_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5000";

const TOKEN_KEY = "vrs_admin_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch (err) {
    const wrapped = new Error("Can't reach the server. Is the backend running?");
    wrapped.cause = err;
    throw wrapped;
  }

  const raw = await res.text();
  let data = {};
  if (raw) {
    try { data = JSON.parse(raw); }
    catch { data = { error: raw }; }
  }

  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    if (res.status === 401 && typeof window !== "undefined") {
      // Session expired — bounce to login
      setToken(null);
      localStorage.removeItem("vrs_admin");
      window.location.href = "/login";
    }
    throw error;
  }
  return data;
}
