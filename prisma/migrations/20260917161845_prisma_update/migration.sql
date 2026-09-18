/*
  Warnings:

  - You are about to drop the column `categoryId` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `categoryName` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `complaints` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_locationId_fkey";

-- DropIndex
DROP INDEX "idx_complaint_categoryId";

-- DropIndex
DROP INDEX "idx_complaint_departmentId";

-- AlterTable
ALTER TABLE "complaints" DROP COLUMN "categoryId",
DROP COLUMN "departmentId",
DROP COLUMN "locationId",
ADD COLUMN     "categoryName" TEXT NOT NULL,
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL;

-- DropTable
DROP TABLE "departments";

-- DropTable
DROP TABLE "locations";

-- CreateIndex
CREATE INDEX "idx_complaint_categoryName" ON "complaints"("categoryName");

-- CreateIndex
CREATE INDEX "complaints_department_idx" ON "complaints"("department");

-- CreateIndex
CREATE INDEX "complaints_location_idx" ON "complaints"("location");
