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

// Create a swap offer
router.post(
  "/offer",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        res.status(400).json({ error: "پیام معاوضه لازم است" });
        return;
      }

      const result = await SwapService.createOffer(
        req.user!.userId,
        message.trim()
      );

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json(serializeBigInt({ offer: result.offer }));
    } catch (error) {
      console.error("Swap offer error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Cancel a swap offer
router.post(
  "/offer/cancel",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.body;

      const result = await SwapService.cancelOffer(req.user!.userId, offerId);

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Swap cancel error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Request a swap
router.post(
  "/request",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId, message } = req.body;

      const result = await SwapService.requestSwap(
        req.user!.userId,
        offerId,
        message
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

// Respond to a swap request
router.post(
  "/respond",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { requestId, accepted } = req.body;

      const result = await SwapService.respondToSwap(
        req.user!.userId,
        requestId,
        accepted
      );

      if ("error" in result) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json(serializeBigInt(result));
    } catch (error) {
      console.error("Swap respond error:", error);
      res.status(500).json({ error: "خطای سرور" });
    }
  }
);

// Confirm or reject an approved swap (requester's final decision)
router.post(
  "/confirm",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { requestId, accepted } = req.body;

      const result = await SwapService.confirmSwap(
        req.user!.userId,
        requestId,
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

export default router;
