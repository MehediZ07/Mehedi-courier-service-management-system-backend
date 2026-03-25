-- CreateEnum
CREATE TYPE "HubType" AS ENUM ('LOCAL', 'REGIONAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "LegType" AS ENUM ('DIRECT', 'PICKUP', 'HUB_TRANSFER', 'DELIVERY');

-- CreateEnum
CREATE TYPE "LegStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('ADDRESS', 'HUB');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('LEGACY_DIRECT', 'DIRECT', 'HUB_BASED');

-- AlterTable
ALTER TABLE "Courier" ADD COLUMN     "city" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "currentLegId" TEXT,
ADD COLUMN     "deliveryType" "DeliveryType";

-- CreateTable
CREATE TABLE "Hub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "hubType" "HubType" NOT NULL DEFAULT 'LOCAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentLeg" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "legNumber" INTEGER NOT NULL,
    "legType" "LegType" NOT NULL,
    "originType" "LocationType" NOT NULL,
    "originAddress" TEXT,
    "originHubId" TEXT,
    "destType" "LocationType" NOT NULL,
    "destAddress" TEXT,
    "destHubId" TEXT,
    "courierId" TEXT,
    "status" "LegStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "estimatedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentLeg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShipmentLeg_shipmentId_idx" ON "ShipmentLeg"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentLeg_courierId_idx" ON "ShipmentLeg"("courierId");

-- CreateIndex
CREATE INDEX "ShipmentLeg_status_idx" ON "ShipmentLeg"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentLeg_shipmentId_legNumber_key" ON "ShipmentLeg"("shipmentId", "legNumber");

-- CreateIndex
CREATE INDEX "Courier_city_idx" ON "Courier"("city");

-- AddForeignKey
ALTER TABLE "ShipmentLeg" ADD CONSTRAINT "ShipmentLeg_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLeg" ADD CONSTRAINT "ShipmentLeg_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLeg" ADD CONSTRAINT "ShipmentLeg_originHubId_fkey" FOREIGN KEY ("originHubId") REFERENCES "Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLeg" ADD CONSTRAINT "ShipmentLeg_destHubId_fkey" FOREIGN KEY ("destHubId") REFERENCES "Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;
