import { prisma } from "../prisma/client";
import { config } from "../config";

export class QueueService {
  static getTodayDate(): Date {
    const tehran = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Tehran",
      })
    );

    return new Date(
      Date.UTC(
        tehran.getFullYear(),
        tehran.getMonth(),
        tehran.getDate()
      )
    );
  }

  static isQueueOpen(): boolean {
    const tehran = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Tehran",
      })
    );

    const currentMinutes =
      tehran.getHours() * 60 + tehran.getMinutes();

    const startMinutes =
      config.queue.startHour * 60 + config.queue.startMinute;

    const endMinutes =
      config.queue.endHour * 60 + config.queue.endMinute;

    return (
      currentMinutes >= startMinutes &&
      currentMinutes < endMinutes
    );
  }

  static getQueueCloseTime(): string {
    const tehran = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Tehran",
      })
    );

    tehran.setHours(
      config.queue.endHour,
      config.queue.endMinute,
      0,
      0
    );

    return tehran.toISOString();
  }

  static async getTodayQueue() {
    const today = this.getTodayDate();

    const entries = await prisma.queueEntry.findMany({
      where: {
        queueDate: today,
      },
      orderBy: {
        position: "asc",
      },
      include: {
        user: true,
      },
    });

    return {
      queue: entries,
      queueOpen: this.isQueueOpen(),
      queueCloseTime: this.getQueueCloseTime(),
      now: new Date().toISOString(),
    };
  }

  static async joinQueue(userId: number, microwaveId: number) {
    const today = this.getTodayDate();

    if (!this.isQueueOpen()) {
      return {
        error: "زمان پیوستن به صف به پایان رسیده است",
      };
    }

    if (microwaveId !== 1 && microwaveId !== 2) {
      return {
        error: "شماره مایکرویو نامعتبر است",
      };
    }

    const existing = await prisma.queueEntry.findFirst({
      where: {
        userId,
        queueDate: today,
        status: {
          notIn: ["LEFT", "COMPLETED"],
        },
      },
    });

    if (existing) {
      return {
        error: "شما قبلاً در صف امروز حضور دارید",
      };
    }

    const last = await prisma.queueEntry.findFirst({
      where: {
        queueDate: today,
        microwaveId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const position = last ? last.position + 1 : 0;

    const entry = await prisma.queueEntry.create({
      data: {
        queueDate: today,
        position,
        microwaveId,
        status: "WAITING",
        userId,
      },
      include: {
        user: true,
      },
    });

    await this.logAction("JOIN", userId, {
      position,
      microwaveId,
    });

    return { entry };
  }

  static async completeUser(userId: number) {
    const today = this.getTodayDate();

    const entry = await prisma.queueEntry.findFirst({
      where: {
        userId,
        queueDate: today,
        status: "WAITING",
        position: 0,
      },
    });

    if (!entry) {
      return {
        error: "نوبت شما نیست",
      };
    }

    const microwaveId = entry.microwaveId;

    await prisma.queueEntry.update({
      where: {
        id: entry.id,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await this.logAction("COMPLETE", userId, {
      position: entry.position,
      microwaveId,
    });

    await this.recalculatePositions(today, microwaveId);

    return {
      success: true,
    };
  }

  static async leaveQueue(userId: number) {
    const today = this.getTodayDate();

    const entry = await prisma.queueEntry.findFirst({
      where: {
        userId,
        queueDate: today,
        status: "WAITING",
      },
    });

    if (!entry) {
      return {
        error: "شما در صف نیستید",
      };
    }

    const microwaveId = entry.microwaveId;

    await prisma.queueEntry.update({
      where: {
        id: entry.id,
      },
      data: {
        status: "LEFT",
      },
    });

    await this.logAction("LEAVE", userId, {
      position: entry.position,
      microwaveId,
    });

    await this.recalculatePositions(today, microwaveId);

    return {
      success: true,
    };
  }

  static async recalculatePositions(queueDate: Date, microwaveId: number) {
    const entries = await prisma.queueEntry.findMany({
      where: {
        queueDate,
        microwaveId,
        status: {
          in: ["WAITING", "ACTIVE"],
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    // Use sentinel positions (original + 10000) to avoid unique constraint collisions
    // during the transaction, then assign final sequential positions.
    const updates = entries.map((entry, i) => {
      const needsUpdate = entry.position !== i;
      return {
        id: entry.id,
        sentinelPos: entry.position + 10000,
        finalPos: i,
        needsUpdate,
      };
    });

    const toUpdate = updates.filter((u) => u.needsUpdate);
    if (toUpdate.length === 0) return;

    await prisma.$transaction(
      toUpdate.map((u) =>
        prisma.queueEntry.update({
          where: { id: u.id },
          data: { position: u.sentinelPos },
        })
      )
    );

    await prisma.$transaction(
      toUpdate.map((u) =>
        prisma.queueEntry.update({
          where: { id: u.id },
          data: { position: u.finalPos },
        })
      )
    );
  }

  static async swapPositions(entryId1: number, entryId2: number) {
    const entry1 = await prisma.queueEntry.findUnique({
      where: {
        id: entryId1,
      },
    });

    const entry2 = await prisma.queueEntry.findUnique({
      where: {
        id: entryId2,
      },
    });

    if (!entry1 || !entry2) {
      return {
        error: "یکی از ورودی‌ها یافت نشد",
      };
    }

    if (entry1.microwaveId !== entry2.microwaveId) {
      return {
        error: "امکان جابجایی بین مایکرویوها وجود ندارد",
      };
    }

    if (
      entry1.status !== "WAITING" ||
      entry2.status !== "WAITING"
    ) {
      return {
        error: "فقط کاربران در حال انتظار قابل جابجایی هستند",
      };
    }

    await prisma.$transaction([
      prisma.queueEntry.update({
        where: {
          id: entry1.id,
        },
        data: {
          position: entry2.position,
        },
      }),
      prisma.queueEntry.update({
        where: {
          id: entry2.id,
        },
        data: {
          position: entry1.position,
        },
      }),
    ]);

    return {
      success: true,
    };
  }

  static async logAction(
    action: string,
    userId?: number,
    details?: any
  ) {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || null,
        details,
      },
    });
  }
}
