/*
  Warnings:

  - You are about to drop the column `actionPlanGenerated` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `yurufuwaScore` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `yurufuwaMeter` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notes" DROP COLUMN "actionPlanGenerated",
DROP COLUMN "yurufuwaScore",
ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentNoteId" TEXT,
ADD COLUMN     "question" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "yurufuwaMeter";

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_parentNoteId_fkey" FOREIGN KEY ("parentNoteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
