-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "pendingSettlement" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "productPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
