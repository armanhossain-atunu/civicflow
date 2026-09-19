/*
  Warnings:

  - A unique constraint covering the columns `[merchantInvoice]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "merchantInvoice" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_merchantInvoice_key" ON "payments"("merchantInvoice");
