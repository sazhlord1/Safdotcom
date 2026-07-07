import { prisma } from "../prisma/client";
import { QueueService } from "./queue.service";

export class AdminService {
  /**
   * Get admin dashboard stats.
   */
  static async getDashboard() {
    const today = QueueService.getTodayDate();

    const allEntries = await prisma.queueEntry.findMany({
      where: { queueDate: today },
      include: { user: true },
    });

    const totalUsers = allEntries.length;
    const activeQueue = allEntries.filter(
      (e) => e.status === "WAITING" || e.status === "ACTIVE"
    ).length;
    const completed = allEntries.filter(
      (e) => e.status === "COMPLETED"
    ).length;

    // Calculate average wait time
    const completedEntries = allEntries.filter(
      (e) => e.status === "COMPLETED" && e.startedAt && e.completedAt
    );

    let avgWaitMinutes = 0;
    if (completedEntries.length > 0) {
      const totalWait = completedEntries.reduce((sum, entry) => {
        const wait =
          (entry.completedAt!.getTime() - entry.startedAt!.getTime()) / 60000;
        return sum + wait;
      }, 0);
      avgWaitMinutes = Math.round((totalWait / completedEntries.length) * 10) / 10;
    }

    // Peak usage time (hour with most entries joined)
    const hourCounts: Record<number, number> = {};
    allEntries.forEach((e) => {
      const hour = new Date(e.joinedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    const peakUsageTime = peakHour ? `${peakHour[0]}:00` : null;

    // Swap stats
    const swapOffers = await prisma.swapOffer.findMany({
      where: {
        queueEntry: { queueDate: today },
      },
    });

    const swapStats = {
      totalOffers: swapOffers.length,
      accepted: swapOffers.filter((o) => o.status === "ACCEPTED").length,
      rejected: swapOffers.filter((o) => o.status === "REJECTED").length,
      pending: swapOffers.filter((o) => o.status === "PENDING").length,
    };

    // Recent logs
    const recentLogs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    // Most active users (by entry count)
    const userCounts: Record<number, { user: any; count: number }> = {};
    allEntries.forEach((e) => {
      const uid = e.userId;
      if (!userCounts[uid]) {
        userCounts[uid] = { user: e.user, count: 0 };
      }
      userCounts[uid].count++;
    });
    const mostActiveUsers = Object.values(userCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      todayStats: {
        totalUsers,
        activeQueue,
        completed,
        avgWaitMinutes,
        queueLength: activeQueue,
        peakUsageTime,
      },
      swapStats,
      recentLogs,
      mostActiveUsers,
    };
  }

  /**
   * Remove a user from the queue (admin action).
   */
  static async removeUser(adminId: number, targetUserId: number) {
    const today = QueueService.getTodayDate();

    const entry = await prisma.queueEntry.findFirst({
      where: {
        userId: targetUserId,
        queueDate: today,
        status: { in: ["WAITING", "ACTIVE"] },
      },
    });

    if (!entry) {
      return { error: "کاربر در صف یافت نشد" };
    }

    await prisma.queueEntry.update({
      where: { id: entry.id },
      data: { status: "LEFT" },
    });

    await QueueService.logAction("ADMIN_REMOVE", adminId, {
      removedUserId: targetUserId,
      position: entry.position,
      microwaveId: entry.microwaveId,
    });

    await QueueService.recalculatePositions(today, entry.microwaveId);

    return { success: true };
  }

  /**
   * Manually reorder the queue.
   */
  static async reorderQueue(
    adminId: number,
    orderedIds: number[]
  ) {
    const today = QueueService.getTodayDate();

    // Verify all IDs belong to today's queue
    const entries = await prisma.queueEntry.findMany({
      where: {
        queueDate: today,
        id: { in: orderedIds },
      },
    });

    if (entries.length !== orderedIds.length) {
      return { error: "تعداد شناسه‌ها با صف مطابقت ندارد" };
    }

    // Update positions
    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.queueEntry.update({
        where: { id: orderedIds[i] },
        data: { position: i },
      });
    }

    await QueueService.logAction("ADMIN_REORDER", adminId, {
      order: orderedIds,
    });

    return { success: true };
  }

  /**
   * Reset today's queue.
   */
  static async resetQueue(adminId: number) {
    const today = QueueService.getTodayDate();

    await prisma.queueEntry.deleteMany({
      where: { queueDate: today },
    });

    await QueueService.logAction("ADMIN_RESET", adminId);

    return { success: true };
  }

  /**
   * Get audit logs with pagination.
   */
  static async getLogs(
    page: number = 1,
    limit: number = 50,
    action?: string
  ) {
    const where = action ? { action } : {};

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Export logs as CSV data.
   */
  static async exportLogs() {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    const headers = ["ID", "Action", "User", "Telegram ID", "Details", "Date"];
    const rows = logs.map((log) => [
      log.id.toString(),
      log.action,
      log.user
        ? `${log.user.firstName} ${log.user.lastName || ""}`.trim()
        : "N/A",
      log.user?.telegramId?.toString() || "N/A",
      JSON.stringify(log.details || {}),
      new Date(log.createdAt).toISOString(),
    ]);

    return { headers, rows };
  }
}
