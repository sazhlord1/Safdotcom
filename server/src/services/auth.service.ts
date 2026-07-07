import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../prisma/client";
import { JwtPayload, TelegramInitData } from "../types";

export class AuthService {
  /**
   * Validate Telegram Mini App initData by checking HMAC-SHA256 signature.
   * The bot token is used as the secret key.
   */
  static validateInitData(initData: string): TelegramInitData | null {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) return null;

    // Remove hash from params before validation
    params.delete("hash");

    // Sort params alphabetically and build data-check-string
    const dataCheckString = Array.from(params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .sort((a, b) => a.localeCompare(b))
      .join("\n");

    // Create HMAC-SHA256 signature using bot token as key
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(config.botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) {
      return null;
    }

    // Check auth_date (must be within 24 hours)
    const authDate = parseInt(params.get("auth_date") || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return null;
    }

    // Reconstruct the data object
    const data: any = {};
    params.forEach((value, key) => {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    });
    data.hash = hash;

    return data as TelegramInitData;
  }

  /**
   * Authenticate user from Telegram initData and return JWT.
   */
  static async authenticate(
    initData: string
  ): Promise<{ token: string; user: any } | null> {
    const data = this.validateInitData(initData);

    if (!data?.user) return null;

    const { id, first_name, last_name, username, photo_url } = data.user;

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(id) },
      update: {
        firstName: first_name,
        lastName: last_name || null,
        username: username || null,
        photoUrl: photo_url || null,
      },
      create: {
        telegramId: BigInt(id),
        firstName: first_name,
        lastName: last_name || null,
        username: username || null,
        photoUrl: photo_url || null,
      },
    });

    // Generate JWT (convert BigInt to number for JSON serialization)
    const payload: JwtPayload = {
      userId: user.id,
      telegramId: Number(user.telegramId),
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "24h" });

    return { token, user };
  }

  /**
   * Verify a JWT token and return the payload.
   */
  static verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      return null;
    }
  }
}
