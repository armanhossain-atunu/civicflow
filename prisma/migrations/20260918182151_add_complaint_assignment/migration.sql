/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `complaint_assignments` table. All the data in the column will be lost.
  - Added the required column `assignedById` to the `complaint_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignedToId` to the `complaint_assignments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "complaint_assignments" DROP CONSTRAINT "complaint_assignments_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "complaint_assignments" DROP CONSTRAINT "complaint_assignments_complaintId_fkey";

-- DropIndex
DROP INDEX "complaint_assignments_assigneeId_idx";

-- AlterTable
ALTER TABLE "complaint_assignments" DROP COLUMN "assigneeId",
ADD COLUMN     "assignedById" TEXT NOT NULL,
ADD COLUMN     "assignedToId" TEXT NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "note" TEXT;

-- CreateIndex
CREATE INDEX "complaint_assignments_assignedToId_idx" ON "complaint_assignments"("assignedToId");

-- CreateIndex
CREATE INDEX "complaint_assignments_assignedById_idx" ON "complaint_assignments"("assignedById");

-- AddForeignKey
ALTER TABLE "complaint_assignments" ADD CONSTRAINT "complaint_assignments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_assignments" ADD CONSTRAINT "complaint_assignments_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_assignments" ADD CONSTRAINT "complaint_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
