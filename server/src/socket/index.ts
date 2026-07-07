import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "./events";
import { QueueService } from "../services/queue.service";
import { config } from "../config";

const QUEUE_ROOM = "queue:today";

function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export function setupSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl
        ? [config.clientUrl]
        : ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.SUBSCRIBE, async () => {
      socket.join(QUEUE_ROOM);
      console.log(`[Socket] ${socket.id} subscribed to queue`);

      const queueState = await QueueService.getTodayQueue();

      socket.emit(
        SOCKET_EVENTS.QUEUE_UPDATED,
        serializeBigInt(queueState)
      );
    });

    socket.on(SOCKET_EVENTS.UNSUBSCRIBE, () => {
      socket.leave(QUEUE_ROOM);
      console.log(`[Socket] ${socket.id} unsubscribed from queue`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  const broadcastQueueUpdate = async () => {
    const queueState = await QueueService.getTodayQueue();

    io.to(QUEUE_ROOM).emit(
      SOCKET_EVENTS.QUEUE_UPDATED,
      serializeBigInt(queueState)
    );
  };

  return {
    io,
    broadcastQueueUpdate,
  };
}
