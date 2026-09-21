-- DropForeignKey
ALTER TABLE "complaint_assignments" DROP CONSTRAINT "complaint_assignments_assignedById_fkey";

-- DropForeignKey
ALTER TABLE "complaint_assignments" DROP CONSTRAINT "complaint_assignments_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "complaint_assignments" DROP CONSTRAINT "complaint_assignments_complaintId_fkey";

-- AddForeignKey
ALTER TABLE "complaint_assignments" ADD CONSTRAINT "complaint_assignments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_assignments" ADD CONSTRAINT "complaint_assignments_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_assignments" ADD CONSTRAINT "complaint_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
