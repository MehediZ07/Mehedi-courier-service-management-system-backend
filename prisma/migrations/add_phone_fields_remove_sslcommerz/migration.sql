-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN "pickupPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN "deliveryPhone" TEXT NOT NULL DEFAULT '';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('STRIPE', 'COD');
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;
