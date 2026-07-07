import { Router } from "express";
import { QueueService } from "../services/queue.service";
import { SwapService } from "../services/swap.service";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

function serializeBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// Get today's queue
router.get("/today", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const queueState = await QueueService.getTodayQueue();

    const swapRequests = await SwapService.getSwapRequestsForQueue(
      QueueService.getTodayDate()
    );

    const mySwapRequests = await SwapService.getMySwapRequests(
      req.user!.userId
    );

    const requestsToApprove = await SwapService.getRequestsToApprove(
      req.user!.userId
    );

    const myEntry = queueState.queue.find(
      (e) => Number(e.user.telegramId) === req.user!.telegramId && e.status === "WAITING"
    );

    res.json(
      serializeBigInt({
        ...queueState,
        myEntry: myEntry || null,
        swapRequests,
        mySwapRequests,
        requestsToApprove,
      })
    );
  } catch (error) {
    console.error("Queue fetch error:", error);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// Join the queue
router.post("/join", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { microwaveId } = req.body;

    if (!microwaveId || (microwaveId !== 1 && microwaveId !== 2)) {
      res.status(400).json({ error: "شماره مایکرویو نامعتبر است" });
      return;
    }

    const result = await QueueService.joinQueue(
      req.user!.userId,
      microwaveId
    );

    if ("error" in result) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(
      serializeBigInt({
        entry: result.entry,
      })
    );
  } catch (error) {
    console.error("Queue join error:", error);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// Complete (finish heating)
router.post(
  "/complete",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await QueueService.completeUser(
        req.user!.userId
      );

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Queue complete error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Leave the queue
router.post(
  "/leave",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await QueueService.leaveQueue(
        req.user!.userId
      );

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Queue leave error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

export default router;
