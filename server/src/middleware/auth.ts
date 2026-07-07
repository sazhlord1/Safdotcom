import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { prisma } from "../prisma/client";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    telegramId: number;
    isAdmin?: boolean;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "توکن احراز هویت یافت نشد" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = AuthService.verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "توکن نامعتبر است" });
    return;
  }

  // Check if user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    res.status(401).json({ error: "کاربر یافت نشد" });
    return;
  }

  req.user = {
    userId: payload.userId,
    telegramId: Number(payload.telegramId),
    isAdmin: user.isAdmin,
  };

  next();
};

export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: "شما دسترسی مدیریت ندارید" });
    return;
  }
  next();
};
