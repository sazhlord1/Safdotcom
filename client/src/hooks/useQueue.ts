import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { QueueState, SwapOffer, SwapRequest } from "../api/types";
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

    const handleQueueUpdated = (state: QueueState) => {
      setQueueState((prev) => {
        if (!prev) return state;
        return {
          ...state,
          myEntry: prev.myEntry,
          pendingRequests: prev.pendingRequests,
          approvedRequests: prev.approvedRequests,
          swapOffers: prev.swapOffers ?? [],
        };
      });
      setLoading(false);
    };

    const handleSwapNewOffer = () => {
      fetchQueue();
    };

    const handleSwapRequestReceived = () => {
      fetchQueue();
    };

    const handleSwapResponse = () => {
      fetchQueue();
    };

    socket.on("queue:updated", handleQueueUpdated);
    socket.on("swap:new-offer", handleSwapNewOffer);
    socket.on("swap:request-received", handleSwapRequestReceived);
    socket.on("swap:response", handleSwapResponse);

    return () => {
      socket.off("queue:updated", handleQueueUpdated);
      socket.off("swap:new-offer", handleSwapNewOffer);
      socket.off("swap:request-received", handleSwapRequestReceived);
      socket.off("swap:response", handleSwapResponse);
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
  const createSwapOffer = useCallback(
    async (message: string) => {
      try {
        await api.post("/swap/offer", { message });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return {
          error: err.response?.data?.error || "خطا در ایجاد پیشنهاد",
        };
      }
    },
    [fetchQueue]
  );

  const cancelSwapOffer = useCallback(
    async (offerId: number) => {
      try {
        await api.post("/swap/offer/cancel", { offerId });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return { error: err.response?.data?.error || "خطا در لغو پیشنهاد" };
      }
    },
    [fetchQueue]
  );

  const requestSwap = useCallback(
    async (offerId: number, message?: string) => {
      try {
        await api.post("/swap/request", { offerId, message });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return {
          error: err.response?.data?.error || "خطا در درخواست معاوضه",
        };
      }
    },
    [fetchQueue]
  );

  const respondToSwap = useCallback(
    async (requestId: number, accepted: boolean) => {
      try {
        await api.post("/swap/respond", { requestId, accepted });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return {
          error: err.response?.data?.error || "خطا در پاسخ به معاوضه",
        };
      }
    },
    [fetchQueue]
  );

  const confirmSwap = useCallback(
    async (requestId: number, accepted: boolean) => {
      try {
        await api.post("/swap/confirm", { requestId, accepted });
        await fetchQueue();
        return { success: true };
      } catch (err: any) {
        return {
          error: err.response?.data?.error || "خطا در تأیید معاوضه",
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
    createSwapOffer,
    cancelSwapOffer,
    requestSwap,
    respondToSwap,
    confirmSwap,
  };
}
