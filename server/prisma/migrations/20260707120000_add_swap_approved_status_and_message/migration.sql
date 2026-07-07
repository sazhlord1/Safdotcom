-- AlterEnum
ALTER TYPE "SwapRequestStatus" ADD VALUE 'APPROVED' BEFORE 'ACCEPTED';

-- AlterTable
ALTER TABLE "swap_requests" ADD COLUMN "message" TEXT;
