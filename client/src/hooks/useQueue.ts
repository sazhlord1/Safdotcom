import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { QueueState } from "../api/types";
import { useSocket } from "./useSocket";

export function useQueue(token: string | null) {
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket(token);

  // Fetch queue state
  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/queue/today");
      setQueueState(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "خطا در دریافت صف");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchQueue();
    }
  }, [token, fetchQueue]);

  // Listen for queue updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdated = () => {
      fetchQueue();
    };

    socket.on("queue:updated", handleQueueUpdated);

    return () => {
      socket.off("queue:updated", handleQueueUpdated);
    };
  }, [socket, fetchQueue]);

  // Queue actions
  const joinQueue = useCallback(async (microwaveId: number) => {
    try {
      await api.post("/queue/join", { microwaveId });
      await fetchQueue();
      return { success: true };
    } catch (err: any) {
      return { error: err.response?.data?.error || "خطا در پیوستن به صف" };
    }
  }, [fetchQueue]);

  const completeHeating = useCallback(async () => {
    try {
      await api.post("/queue/complete");
      await fetchQueue();
      return { success: true };
    } catch (err: any) {
      return { error: err.response?.data?.error || "خطا در تکمیل" };
    }
  }, [fetchQueue]);

  const leaveQueue = useCallback(async () => {
    try {
      await api.post("/queue/leave");
      await fetchQueue();
      return { success: true };
    } catch (err: any) {
      return { error: err.response?.data?.error || "خطا در خروج از صف" };
    }
  }, [fetchQueue]);

  // Swap actions
  const createSwapRequest = useCallback(
    async (message: string) => {
      try {
        await api.post("/swap/request", { message });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return {
          error: err.response?.data?.error || "خطا در ایجاد درخواست",
        };
      }
    },
    [fetchQueue]
  );

  const cancelSwapRequest = useCallback(
    async (offerId: number) => {
      try {
        await api.post("/swap/request/cancel", { offerId });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return { error: err.response?.data?.error || "خطا در لغو درخواست" };
      }
    },
    [fetchQueue]
  );

  const approveSwapRequest = useCallback(
    async (offerId: number) => {
      try {
        await api.post("/swap/approve", { offerId });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return {
          error: err.response?.data?.error || "خطا در تأیید درخواست",
        };
      }
    },
    [fetchQueue]
  );

  const rejectSwapRequest = useCallback(
    async (offerId: number) => {
      try {
        await api.post("/swap/reject", { offerId });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return {
          error: err.response?.data?.error || "خطا در رد درخواست",
        };
      }
    },
    [fetchQueue]
  );

  const confirmSwapRequest = useCallback(
    async (offerId: number, accepted: boolean) => {
      try {
        await api.post("/swap/confirm", { offerId, accepted });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return {
          error: err.response?.data?.error || "خطا در تأیید نهایی",
        };
      }
    },
    [fetchQueue]
  );

  return {
    queueState,
    loading,
    error,
    isConnected,
    fetchQueue,
    joinQueue,
    completeHeating,
    leaveQueue,
    createSwapRequest,
    cancelSwapRequest,
    approveSwapRequest,
    rejectSwapRequest,
    confirmSwapRequest,
  };
}
