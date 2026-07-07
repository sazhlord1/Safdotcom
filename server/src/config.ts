import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  botToken: process.env.BOT_TOKEN || "",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "",
  queue: {
    startHour: parseInt(process.env.QUEUE_START_HOUR || "20", 10),
    startMinute: parseInt(process.env.QUEUE_START_MINUTE || "0", 10),
    endHour: parseInt(process.env.QUEUE_END_HOUR || "23", 10),
    endMinute: parseInt(process.env.QUEUE_END_MINUTE || "45", 10),
  },
} as const;
