-- CreateTable
CREATE TABLE "CODSettlement" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "settledBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CODSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantSettlement" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "settledBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CODSettlement_courierId_idx" ON "CODSettlement"("courierId");

-- CreateIndex
CREATE INDEX "MerchantSettlement_merchantId_idx" ON "MerchantSettlement"("merchantId");

-- AddForeignKey
ALTER TABLE "CODSettlement" ADD CONSTRAINT "CODSettlement_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSettlement" ADD CONSTRAINT "MerchantSettlement_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
