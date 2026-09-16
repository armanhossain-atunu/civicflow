-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "price" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Category_status_idx" ON "Category"("status");
