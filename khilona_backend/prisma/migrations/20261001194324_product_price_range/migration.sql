-- DropIndex
DROP INDEX "Product_price_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "maxPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "minPrice" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_minPrice_idx" ON "Product"("minPrice");
