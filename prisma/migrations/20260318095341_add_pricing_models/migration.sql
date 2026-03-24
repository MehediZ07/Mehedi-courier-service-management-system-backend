/*
  Warnings:

  - Added the required column `deliveryCity` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupCity` to the `Shipment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('LOCAL', 'NATIONAL', 'INTERNATIONAL');

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "deliveryCity" TEXT NOT NULL,
ADD COLUMN     "pickupCity" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "regionType" "RegionType" NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "perKgPrice" DOUBLE PRECISION NOT NULL,
    "expressMult" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentPricing" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "regionType" "RegionType" NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "weightCharge" DOUBLE PRECISION NOT NULL,
    "priorityCharge" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_regionType_key" ON "Pricing"("regionType");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentPricing_shipmentId_key" ON "ShipmentPricing"("shipmentId");

-- AddForeignKey
ALTER TABLE "ShipmentPricing" ADD CONSTRAINT "ShipmentPricing_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
