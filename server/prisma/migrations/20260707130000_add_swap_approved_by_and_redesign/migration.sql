-- AlterEnum
ALTER TYPE "SwapStatus" ADD VALUE 'APPROVED' BEFORE 'ACCEPTED';

-- AlterTable
ALTER TABLE "swap_offers" ADD COLUMN "approvedByQueueEntryId" INTEGER;

-- AddForeignKey
ALTER TABLE "swap_offers" ADD CONSTRAINT "swap_offers_approvedByQueueEntryId_fkey" FOREIGN KEY ("approvedByQueueEntryId") REFERENCES "queue_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
