-- AlterTable
ALTER TABLE "queue_entries" ADD COLUMN "microwaveId" INTEGER NOT NULL DEFAULT 1;

-- DropIndex
DROP INDEX IF EXISTS "queue_entries_queueDate_position_key";

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_queueDate_position_microwaveId_key" ON "queue_entries"("queueDate", "position", "microwaveId");

-- CreateIndex
CREATE INDEX "queue_entries_queueDate_microwaveId_idx" ON "queue_entries"("queueDate", "microwaveId");
