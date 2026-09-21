-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_citizenId_fkey";

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
