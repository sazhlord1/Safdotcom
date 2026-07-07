import { Router } from "express";
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

// Create a swap request (by person behind in queue)
router.post(
  "/request",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        res.status(400).json({ error: "پیام معاوضه لازم است" });
        return;
      }

      const result = await SwapService.createSwapRequest(
        req.user!.userId,
        message.trim()
      );

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json(serializeBigInt(result));
    } catch (error) {
      console.error("Swap request error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Cancel a swap request
router.post(
  "/request/cancel",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.body;

      const result = await SwapService.cancelSwapRequest(
        req.user!.userId,
        offerId
      );

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Swap cancel error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Approve a swap request (by person ahead in queue)
router.post(
  "/approve",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.body;

      const result = await SwapService.approveSwapRequest(
        req.user!.userId,
        offerId
      );

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json(serializeBigInt(result));
    } catch (error) {
      console.error("Swap approve error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Reject a swap request (by person ahead in queue)
router.post(
  "/reject",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.body;

      const result = await SwapService.rejectSwapRequest(
        req.user!.userId,
        offerId
      );

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Swap reject error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Final confirmation by requester
router.post(
  "/confirm",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId, accepted } = req.body;

      const result = await SwapService.confirmSwapRequest(
        req.user!.userId,
        offerId,
        accepted
      );

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Swap confirm error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Get my swap requests
router.get(
  "/my-requests",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const requests = await SwapService.getMySwapRequests(req.user!.userId);
      res.json(serializeBigInt(requests));
    } catch (error) {
      console.error("Get my requests error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Get requests I can approve
router.get(
  "/to-approve",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const requests = await SwapService.getRequestsToApprove(req.user!.userId);
      res.json(serializeBigInt(requests));
    } catch (error) {
      console.error("Get to approve error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

export default router;
