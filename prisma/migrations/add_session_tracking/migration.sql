-- Add sessionId column to Visit table
ALTER TABLE "Visit" ADD COLUMN "sessionId" TEXT;

-- Create index on sessionId for faster queries
CREATE INDEX "Visit_sessionId_idx" ON "Visit"("sessionId");
