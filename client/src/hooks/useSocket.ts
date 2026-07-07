import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("queue:subscribe");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.emit("queue:unsubscribe");
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  const subscribe = useCallback(() => {
    socketRef.current?.emit("queue:subscribe");
  }, []);

  const unsubscribe = useCallback(() => {
    socketRef.current?.emit("queue:unsubscribe");
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    subscribe,
    unsubscribe,
  };
}
