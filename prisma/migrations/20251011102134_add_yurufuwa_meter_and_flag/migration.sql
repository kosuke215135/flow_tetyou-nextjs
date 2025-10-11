-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "actionPlanGenerated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "yurufuwaMeter" DOUBLE PRECISION NOT NULL DEFAULT 0;
