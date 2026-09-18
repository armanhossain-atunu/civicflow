/*
  Warnings:

  - The values [PENDING_PAYMENT,UNDER_REVIEW,CANCELLED] on the enum `ComplaintStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[complaintId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gatewayTransactionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryId` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('SSL_COMMERZ', 'BKASH', 'NAGAD', 'STRIPE', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('COMPLAINT_SUBMISSION');

-- AlterEnum
BEGIN;
CREATE TYPE "ComplaintStatus_new" AS ENUM ('PAYMENT_PENDING', 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');
ALTER TABLE "public"."complaints" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "complaints" ALTER COLUMN "status" TYPE "ComplaintStatus_new" USING ("status"::text::"ComplaintStatus_new");
ALTER TABLE "complaint_status_histories" ALTER COLUMN "oldStatus" TYPE "ComplaintStatus_new" USING ("oldStatus"::text::"ComplaintStatus_new");
ALTER TABLE "complaint_status_histories" ALTER COLUMN "newStatus" TYPE "ComplaintStatus_new" USING ("newStatus"::text::"ComplaintStatus_new");
ALTER TYPE "ComplaintStatus" RENAME TO "ComplaintStatus_old";
ALTER TYPE "ComplaintStatus_new" RENAME TO "ComplaintStatus";
DROP TYPE "public"."ComplaintStatus_old";
ALTER TABLE "complaints" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'NOT_REQUIRED';

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_complaintId_fkey";

-- DropIndex
DROP INDEX "payments_complaintId_idx";

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "paymentAmount" DECIMAL(10,2),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "citizenId" TEXT NOT NULL,
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "gateway" TEXT,
ADD COLUMN     "gatewayTransactionId" TEXT,
ADD COLUMN     "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "method" "PaymentMethod" NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "purpose" "PaymentPurpose" NOT NULL DEFAULT 'COMPLAINT_SUBMISSION',
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transactionId" TEXT;

-- DropTable
DROP TABLE "Category";

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentRequired" BOOLEAN NOT NULL DEFAULT false,
    "paymentAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "complaints_paymentStatus_idx" ON "complaints"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "payments_complaintId_key" ON "payments"("complaintId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gatewayTransactionId_key" ON "payments"("gatewayTransactionId");

-- CreateIndex
CREATE INDEX "payments_citizenId_idx" ON "payments"("citizenId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "users_emailVerified_idx" ON "users"("emailVerified");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
