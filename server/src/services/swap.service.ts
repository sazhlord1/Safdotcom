import { prisma } from "../prisma/client";
import { QueueService } from "./queue.service";

export class SwapService {
  /**
   * Create a swap offer for a user.
   */
  static async createOffer(userId: number, message: string) {
    const today = QueueService.getTodayDate();

    const entry = await prisma.queueEntry.findFirst({
      where: {
        userId,
        queueDate: today,
        status: "WAITING",
      },
    });

    if (!entry) {
      return { error: "شما باید در صف باشید تا پیشنهاد معاوضه بدهید" };
    }

    // Check if user already has an active offer
    const existingOffer = await prisma.swapOffer.findFirst({
      where: {
        queueEntryId: entry.id,
        status: "PENDING",
      },
    });

    if (existingOffer) {
      return { error: "شما قبلاً یک پیشنهاد معاوضه فعال دارید" };
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

    await QueueService.logAction("SWAP_OFFER_CREATED", userId, {
      offerId: offer.id,
      message,
      position: entry.position,
    });

    return { offer };
  }

  /**
   * Cancel a swap offer.
   */
  static async cancelOffer(userId: number, offerId: number) {
    const offer = await prisma.swapOffer.findUnique({
      where: { id: offerId },
      include: { queueEntry: true },
    });

    if (!offer) {
      return { error: "پیشنهاد یافت نشد" };
    }

    if (offer.queueEntry.userId !== userId) {
      return { error: "شما مجاز به لغو این پیشنهاد نیستید" };
    }

    await prisma.swapOffer.update({
      where: { id: offerId },
      data: { status: "CANCELLED" },
    });

    await QueueService.logAction("SWAP_OFFER_CANCELLED", userId, { offerId });

    return { success: true };
  }

  /**
   * Request a swap with another user.
   */
  static async requestSwap(requesterId: number, offerId: number, message?: string) {
    const today = QueueService.getTodayDate();

    const offer = await prisma.swapOffer.findUnique({
      where: { id: offerId },
      include: { queueEntry: true },
    });

    if (!offer) {
      return { error: "پیشنهاد یافت نشد" };
    }

    if (offer.status !== "PENDING") {
      return { error: "این پیشنهاد دیگر فعال نیست" };
    }

    // Can't swap with yourself
    if (offer.queueEntry.userId === requesterId) {
      return { error: "نمی‌توانید با خودتان معاوضه کنید" };
    }

    // Requester must be in queue and behind the offer owner
    const requesterEntry = await prisma.queueEntry.findFirst({
      where: {
        userId: requesterId,
        queueDate: today,
        status: "WAITING",
      },
    });

    if (!requesterEntry) {
      return { error: "شما باید در صف باشید" };
    }

    if (requesterEntry.microwaveId !== offer.queueEntry.microwaveId) {
      return { error: "فقط کاربران همان مایکرویو می‌توانند معاوضه کنند" };
    }

    if (requesterEntry.position <= offer.queueEntry.position) {
      return { error: "فقط کاربران پایین‌تر صف می‌توانند درخواست معاوضه بدهند" };
    }

    // Check if already requested
    const existingRequest = await prisma.swapRequest.findUnique({
      where: {
        swapOfferId_requesterId: {
          swapOfferId: offerId,
          requesterId,
        },
      },
    });

    if (existingRequest) {
      return { error: "شما قبلاً درخواست معاوضه ارسال کرده‌اید" };
    }

    const swapRequest = await prisma.swapRequest.create({
      data: {
        swapOfferId: offerId,
        requesterId,
        message: message || null,
      },
      include: {
        requester: true,
        swapOffer: {
          include: {
            queueEntry: { include: { user: true } },
          },
        },
      },
    });

    await QueueService.logAction("SWAP_REQUEST", requesterId, {
      offerId,
      requesterPosition: requesterEntry.position,
      offerOwnerPosition: offer.queueEntry.position,
    });

    return { swapRequest };
  }

  /**
   * Respond to a swap request (approve or reject).
   * On approval, status changes to APPROVED (waiting for requester confirmation).
   */
  static async respondToSwap(
    offerOwnerId: number,
    requestId: number,
    accepted: boolean
  ) {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: requestId },
      include: {
        swapOffer: {
          include: { queueEntry: true },
        },
        requester: true,
      },
    });

    if (!swapRequest) {
      return { error: "درخواست یافت نشد" };
    }

    if (swapRequest.swapOffer.queueEntry.userId !== offerOwnerId) {
      return { error: "شما مجاز به پاسخ به این درخواست نیستید" };
    }

    if (swapRequest.status !== "PENDING") {
      return { error: "این درخواست قبلاً پردازش شده است" };
    }

    if (accepted) {
      // Mark as APPROVED — wait for requester confirmation
      await prisma.swapRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
      });

      await QueueService.logAction("SWAP_APPROVED", offerOwnerId, {
        offerId: swapRequest.swapOfferId,
        requesterId: swapRequest.requesterId,
      });

      return { success: true, approved: true };
    } else {
      // Reject
      await prisma.swapRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });

      await QueueService.logAction("SWAP_REJECTED", offerOwnerId, {
        offerId: swapRequest.swapOfferId,
        requesterId: swapRequest.requesterId,
      });

      return { success: true, approved: false };
    }
  }

  /**
   * Requester confirms or rejects an approved swap.
   * If confirmed → positions swap.
   * If rejected → request goes back to PENDING.
   */
  static async confirmSwap(
    requesterId: number,
    requestId: number,
    accepted: boolean
  ) {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: requestId },
      include: {
        swapOffer: {
          include: { queueEntry: true },
        },
        requester: true,
      },
    });

    if (!swapRequest) {
      return { error: "درخواست یافت نشد" };
    }

    if (swapRequest.requesterId !== requesterId) {
      return { error: "شما مجاز به تأیید این درخواست نیستید" };
    }

    if (swapRequest.status !== "APPROVED") {
      return { error: "این درخواست هنوز تأیید نشده است" };
    }

    if (accepted) {
      // Perform the swap
      await QueueService.swapPositions(
        swapRequest.swapOffer.queueEntryId,
        swapRequest.requesterId
      );

      // Update swap request status
      await prisma.swapRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });

      // Close the offer
      await prisma.swapOffer.update({
        where: { id: swapRequest.swapOfferId },
        data: { status: "ACCEPTED" },
      });

      await QueueService.logAction("SWAP_CONFIRMED", requesterId, {
        offerId: swapRequest.swapOfferId,
        requesterId: swapRequest.requesterId,
      });

      return { success: true, swapped: true };
    } else {
      // Reject — request goes back to PENDING for others to see
      await prisma.swapRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });

      await QueueService.logAction("SWAP_CONFIRMATION_REJECTED", requesterId, {
        offerId: swapRequest.swapOfferId,
      });

      return { success: true, swapped: false };
    }
  }

  /**
   * Get active swap offers for a queue date.
   */
  static async getActiveOffers(queueDate: Date) {
    return prisma.swapOffer.findMany({
      where: {
        status: "PENDING",
        queueEntry: {
          queueDate,
          status: "WAITING",
        },
      },
      include: {
        queueEntry: { include: { user: true } },
        requests: {
          include: { requester: true },
        },
      },
    });
  }

  /**
   * Get pending swap requests for a user (where they are the offer owner).
   */
  static async getPendingRequests(userId: number) {
    return prisma.swapRequest.findMany({
      where: {
        swapOffer: {
          queueEntry: {
            userId,
          },
        },
        status: { in: ["PENDING", "APPROVED"] },
      },
      include: {
        requester: true,
        swapOffer: {
          include: {
            queueEntry: { include: { user: true } },
          },
        },
      },
    });
  }

  /**
   * Get approved swap requests awaiting requester confirmation.
   */
  static async getApprovedRequestsForRequester(userId: number) {
    return prisma.swapRequest.findMany({
      where: {
        requesterId: userId,
        status: "APPROVED",
      },
      include: {
        swapOffer: {
          include: {
            queueEntry: { include: { user: true } },
          },
        },
      },
    });
  }
}
