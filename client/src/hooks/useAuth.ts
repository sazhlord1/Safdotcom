import { useState, useEffect, useCallback } from "react";
import api, { setAuthToken, getAuthToken } from "../api/client";
import { QueueUser, AuthResponse } from "../api/types";

declare global {
  interface Window {
    Telegram?: any;
  }
}

export function useAuth() {
  const [user, setUser] = useState<QueueUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithTelegram = useCallback(async () => {
    console.log("========== LOGIN ==========");

    try {
      setLoading(true);
      setError(null);

      console.log("window.Telegram =", window.Telegram);

      if (!window.Telegram) {
        throw new Error("window.Telegram is undefined");
      }

      const tg = window.Telegram.WebApp;

      console.log("WebApp =", tg);

      tg.ready();
      tg.expand();

      console.log("initData =", tg.initData);
      console.log("initDataUnsafe =", tg.initDataUnsafe);

      if (!tg.initData) {
        throw new Error("Telegram initData is empty");
      }

      console.log("API =", import.meta.env.VITE_API_URL);

      console.log("Sending request...");

      const response = await api.post<AuthResponse>(
        "/auth/validate",
        {
          initData: tg.initData,
        }
      );

      console.log("SUCCESS");
      console.log(response.data);

      setAuthToken(response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
    } catch (e: any) {
      console.error("================ ERROR ================");
      console.error(e);
      console.error(e.response);
      console.error(e.response?.data);
      console.error("=======================================");

      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const existingToken = getAuthToken();

    if (!existingToken) return;

    setLoading(true);
    setToken(existingToken);

    api
      .get("/auth/me")
      .then((r) => {
        setUser(r.data.user);
      })
      .catch(() => {
        setAuthToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    loginWithTelegram,
    logout: () => {
      setUser(null);
      setToken(null);
      setAuthToken(null);
    },
  };
}
