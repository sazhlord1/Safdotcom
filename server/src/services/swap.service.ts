import { prisma } from "../prisma/client";
import { QueueService } from "./queue.service";

export class SwapService {
  /**
   * Create a swap request (by the person behind in queue).
   * The request is displayed next to their name.
   */
  static async createSwapRequest(userId: number, message: string) {
    const today = QueueService.getTodayDate();

    const entry = await prisma.queueEntry.findFirst({
      where: {
        userId,
        queueDate: today,
        status: "WAITING",
      },
    });

    if (!entry) {
      return { error: "شما باید در صف باشید" };
    }

    // Must be position 1 or later (not first in queue)
    if (entry.position === 0) {
      return { error: "نفر اول صف نمی‌تواند درخواست معاوضه بدهد" };
    }

    // Check if user already has an active request
    const existing = await prisma.swapOffer.findFirst({
      where: {
        queueEntryId: entry.id,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existing) {
      return { error: "شما قبلاً یک درخواست معاوضه فعال دارید" };
    }

    const offer = await prisma.swapOffer.create({
      data: {
        queueEntryId: entry.id,
        message,
      },
      include: {
        queueEntry: {
          include: { user: true },
        },
      },
    });

    await QueueService.logAction("SWAP_REQUEST_CREATED", userId, {
      offerId: offer.id,
      message,
      position: entry.position,
    });

    return { offer };
  }

  /**
   * Cancel a swap request (by the person who created it).
   */
  static async cancelSwapRequest(userId: number, offerId: number) {
    const offer = await prisma.swapOffer.findUnique({
      where: { id: offerId },
      include: { queueEntry: true },
    });

    if (!offer) {
      return { error: "درخواست یافت نشد" };
    }

    if (offer.queueEntry.userId !== userId) {
      return { error: "شما مجاز به لغو این درخواست نیستید" };
    }

    await prisma.swapOffer.update({
      where: { id: offerId },
      data: { status: "CANCELLED" },
    });

    await QueueService.logAction("SWAP_REQUEST_CANCELLED", userId, { offerId });

    return { success: true };
  }

  /**
   * Approve a swap request (by a person ahead in queue).
   * The approver's entry is recorded.
   */
  static async approveSwapRequest(approverUserId: number, offerId: number) {
    const today = QueueService.getTodayDate();

    const offer = await prisma.swapOffer.findUnique({
      where: { id: offerId },
      include: { queueEntry: true },
    });

    if (!offer) {
      return { error: "درخواست یافت نشد" };
    }

    if (offer.status !== "PENDING") {
      return { error: "این درخواست دیگر فعال نیست" };
    }

    // Approver must be the person who created the request? No, approver is someone ahead
    // Check if approver is the same person
    if (offer.queueEntry.userId === approverUserId) {
      return { error: "نمی‌توانید درخواست خودتان را تأیید کنید" };
    }

    // Approver must be in queue and AHEAD of the requester
    const approverEntry = await prisma.queueEntry.findFirst({
      where: {
        userId: approverUserId,
        queueDate: today,
        status: "WAITING",
      },
    });

    if (!approverEntry) {
      return { error: "شما باید در صف باشید" };
    }

    if (approverEntry.microwaveId !== offer.queueEntry.microwaveId) {
      return { error: "فقط کاربران همان مایکرویو می‌توانند معاوضه کنند" };
    }

    if (approverEntry.position >= offer.queueEntry.position) {
      return { error: "فقط کاربران بالاتر صف می‌توانند درخواست را تأیید کنند" };
    }

    // Check if someone else already approved this request
    if (offer.approvedByQueueEntryId) {
      return { error: "این درخواست قبلاً تأیید شده است" };
    }

    // Approve: set the approver's entry
    const updatedOffer = await prisma.swapOffer.update({
      where: { id: offerId },
      data: {
        status: "APPROVED",
        approvedByQueueEntryId: approverEntry.id,
      },
      include: {
        queueEntry: { include: { user: true } },
        approvedByQueueEntry: { include: { user: true } },
      },
    });

    await QueueService.logAction("SWAP_REQUEST_APPROVED", approverUserId, {
      offerId,
      requesterId: offer.queueEntry.userId,
      requesterPosition: offer.queueEntry.position,
      approverPosition: approverEntry.position,
    });

    return { offer: updatedOffer };
  }

  /**
   * Reject a swap request (by a person ahead in queue).
   */
  static async rejectSwapRequest(rejectorUserId: number, offerId: number) {
    const today = QueueService.getTodayDate();

    const offer = await prisma.swapOffer.findUnique({
      where: { id: offerId },
      include: { queueEntry: true },
    });

    if (!offer) {
      return { error: "درخواست یافت نشد" };
    }

    if (offer.status !== "PENDING") {
      return { error: "این درخواست دیگر فعال نیست" };
    }

    if (offer.queueEntry.userId === rejectorUserId) {
      return { error: "نمی‌توانید درخواست خودتان را رد کنید" };
    }

    // Just mark as rejected - request stays for others to see
    await prisma.swapOffer.update({
      where: { id: offerId },
      data: { status: "REJECTED" },
    });

    await QueueService.logAction("SWAP_REQUEST_REJECTED", rejectorUserId, {
      offerId,
    });

    return { success: true };
  }

  /**
   * Final confirmation by the requester.
   * If confirmed → positions swap.
   * If rejected → request goes back to PENDING for others.
   */
  static async confirmSwapRequest(
    requesterUserId: number,
    offerId: number,
    accepted: boolean
  ) {
    const offer = await prisma.swapOffer.findUnique({
      where: { id: offerId },
      include: {
        queueEntry: true,
        approvedByQueueEntry: true,
      },
    });

    if (!offer) {
      return { error: "درخواست یافت نشد" };
    }

    if (offer.queueEntry.userId !== requesterUserId) {
      return { error: "شما مجاز به تأیید این درخواست نیستید" };
    }

    if (offer.status !== "APPROVED") {
      return { error: "این درخواست هنوز تأیید نشده است" };
    }

    if (!offer.approvedByQueueEntry) {
      return { error: "اطلاعات تأییدکننده یافت نشد" };
    }

    if (accepted) {
      // Perform the swap
      await QueueService.swapPositions(
        offer.queueEntryId,
        offer.approvedByQueueEntryId!
      );

      // Mark as accepted
      await prisma.swapOffer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" },
      });

      await QueueService.logAction("SWAP_CONFIRMED", requesterUserId, {
        offerId,
        requesterPosition: offer.queueEntry.position,
        approverPosition: offer.approvedByQueueEntry.position,
      });

      return { success: true, swapped: true };
    } else {
      // Reject — request goes back to PENDING for others to see
      await prisma.swapOffer.update({
        where: { id: offerId },
        data: {
          status: "PENDING",
          approvedByQueueEntryId: null,
        },
      });

      await QueueService.logAction("SWAP_CONFIRMATION_REJECTED", requesterUserId, {
        offerId,
      });

      return { success: true, swapped: false };
    }
  }

  /**
   * Get all pending swap requests for a queue date.
   * These are displayed next to the requester's name.
   */
  static async getSwapRequestsForQueue(queueDate: Date) {
    return prisma.swapOffer.findMany({
      where: {
        status: { in: ["PENDING", "APPROVED"] },
        queueEntry: {
          queueDate,
          status: "WAITING",
        },
      },
      include: {
        queueEntry: { include: { user: true } },
        approvedByQueueEntry: {
          include: { user: true },
        },
      },
    });
  }

  /**
   * Get my swap requests (pending and approved).
   */
  static async getMySwapRequests(userId: number) {
    const today = QueueService.getTodayDate();

    return prisma.swapOffer.findMany({
      where: {
        queueEntry: {
          userId,
          queueDate: today,
        },
        status: { in: ["PENDING", "APPROVED"] },
      },
      include: {
        queueEntry: { include: { user: true } },
        approvedByQueueEntry: {
          include: { user: true },
        },
      },
    });
  }

  /**
   * Get swap requests I can approve (where I'm ahead and they're behind).
   */
  static async getRequestsToApprove(userId: number) {
    const today = QueueService.getTodayDate();

    const myEntries = await prisma.queueEntry.findMany({
      where: {
        userId,
        queueDate: today,
        status: "WAITING",
      },
    });

    if (myEntries.length === 0) return [];

    const myMicrowaveIds = myEntries.map((e) => e.microwaveId);

    // Find requests from people behind me in the same microwave
    const requests = await prisma.swapOffer.findMany({
      where: {
        status: "PENDING",
        queueEntry: {
          queueDate: today,
          status: "WAITING",
          microwaveId: { in: myMicrowaveIds },
        },
      },
      include: {
        queueEntry: { include: { user: true } },
      },
    });

    // Filter to only requests where the requester is behind me
    return requests.filter((req) => {
      const myEntry = myEntries.find(
        (e) => e.microwaveId === req.queueEntry.microwaveId
      );
      return myEntry && req.queueEntry.position > myEntry.position;
    });
  }
}
