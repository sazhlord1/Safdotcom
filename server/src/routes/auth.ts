import { Router } from "express";
import { AuthService } from "../services/auth.service";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { prisma } from "../prisma/client";

const router = Router();

// تبدیل BigInt به String برای JSON
const serializeUser = (user: any) => ({
  ...user,
  telegramId: user.telegramId.toString(),
});

// Validate Telegram initData and return JWT
router.post("/validate", async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({
        error: "initData لازم است",
      });
    }

    const result = await AuthService.authenticate(initData);

    if (!result) {
      return res.status(401).json({
        error: "احراز هویت ناموفق بود",
      });
    }

    return res.json({
      token: result.token,
      user: serializeUser(result.user),
    });
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({
      error: "خطای سرور",
    });
  }
});

// Get current user profile
router.get(
  "/me",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user!.userId,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: "کاربر یافت نشد",
        });
      }

      return res.json({
        user: serializeUser(user),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "خطای سرور",
      });
    }
  }
);

export default router;
