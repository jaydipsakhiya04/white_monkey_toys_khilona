-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('MONTHS_0_18', 'MONTHS_18_36', 'YEARS_3_5', 'YEARS_5_7', 'YEARS_7_9', 'YEARS_9_12', 'YEARS_12_14', 'YEARS_14_PLUS');

-- CreateEnum
CREATE TYPE "ExchangeReason" AS ENUM ('WRONG_ITEM', 'DAMAGED_ITEM');

-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledBy" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "ageGroups" "AgeGroup"[] DEFAULT ARRAY[]::"AgeGroup"[];

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "exchangeWindowDays" INTEGER NOT NULL DEFAULT 7;

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT,
    "linkUrl" TEXT,
    "ctaLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "customerId" TEXT,
    "reason" "ExchangeReason" NOT NULL,
    "details" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "status" "ExchangeStatus" NOT NULL DEFAULT 'REQUESTED',
    "adminNote" TEXT,
    "handledByName" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_isActive_sortOrder_idx" ON "Banner"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRequest_requestNumber_key" ON "ExchangeRequest"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRequest_orderItemId_key" ON "ExchangeRequest"("orderItemId");

-- CreateIndex
CREATE INDEX "ExchangeRequest_status_createdAt_idx" ON "ExchangeRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ExchangeRequest_orderId_idx" ON "ExchangeRequest"("orderId");

-- CreateIndex
CREATE INDEX "ExchangeRequest_customerId_idx" ON "ExchangeRequest"("customerId");

-- AddForeignKey
ALTER TABLE "ExchangeRequest" ADD CONSTRAINT "ExchangeRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRequest" ADD CONSTRAINT "ExchangeRequest_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRequest" ADD CONSTRAINT "ExchangeRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
