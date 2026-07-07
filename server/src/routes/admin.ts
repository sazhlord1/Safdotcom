import { Router } from "express";
import { AdminService } from "../services/admin.service";
import { authMiddleware, adminMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// All admin routes require auth + admin check
router.use(authMiddleware);
router.use(adminMiddleware);

// Get dashboard stats
router.get("/dashboard", async (req: AuthenticatedRequest, res) => {
  try {
    const dashboard = await AdminService.getDashboard();
    res.json(dashboard);
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// Remove a user from queue
router.post("/remove-user", async (req: AuthenticatedRequest, res) => {
  try {
    const { targetUserId } = req.body;

    const result = await AdminService.removeUser(
      req.user!.userId,
      targetUserId
    );

    if ("error" in result) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Admin remove error:", error);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// Reorder the queue
router.post("/reorder", async (req: AuthenticatedRequest, res) => {
  try {
    const { orderedIds } = req.body;

    const result = await AdminService.reorderQueue(
      req.user!.userId,
      orderedIds
    );

    if ("error" in result) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Admin reorder error:", error);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// Reset today's queue
router.post("/reset", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await AdminService.resetQueue(req.user!.userId);
    res.json(result);
  } catch (error) {
    console.error("Admin reset error:", error);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// Get audit logs
router.get("/logs", async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string | undefined;

    const result = await AdminService.getLogs(page, limit, action);
    res.json(result);
  } catch (error) {
    console.error("Admin logs error:", error);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// Export logs as CSV
router.get("/export", async (req: AuthenticatedRequest, res) => {
  try {
    const { headers, rows } = await AdminService.exportLogs();

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=microwave-queue-logs.csv"
    );
    res.send("\uFEFF" + csv); // BOM for Excel UTF-8
  } catch (error) {
    console.error("Admin export error:", error);
    res.status(500).json({ error: "خطای سرور" });
  }
});

export default router;
