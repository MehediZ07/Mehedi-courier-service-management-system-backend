-- Add aggregated analytics tables

-- PageViewStat: Aggregated page views by hour
CREATE TABLE "PageViewStat" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "userRole" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageViewStat_pkey" PRIMARY KEY ("id")
);

-- DailyVisitor: Unique visitors per day
CREATE TABLE "DailyVisitor" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "date" DATE NOT NULL,
    "pages" TEXT[],
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyVisitor_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for PageViewStat
CREATE UNIQUE INDEX "PageViewStat_page_date_hour_userRole_key" ON "PageViewStat"("page", "date", "hour", "userRole");

-- Create indexes for PageViewStat
CREATE INDEX "PageViewStat_date_idx" ON "PageViewStat"("date");
CREATE INDEX "PageViewStat_page_idx" ON "PageViewStat"("page");

-- Create unique constraint for DailyVisitor
CREATE UNIQUE INDEX "DailyVisitor_sessionId_key" ON "DailyVisitor"("sessionId");

-- Create indexes for DailyVisitor
CREATE INDEX "DailyVisitor_date_idx" ON "DailyVisitor"("date");
CREATE INDEX "DailyVisitor_userId_idx" ON "DailyVisitor"("userId");
