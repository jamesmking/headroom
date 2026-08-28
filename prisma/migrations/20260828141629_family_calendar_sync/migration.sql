-- CreateTable
CREATE TABLE "FamilyEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FamilyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyCalendarSync" (
    "userId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "windowStart" DATE NOT NULL,
    "windowEnd" DATE NOT NULL,

    CONSTRAINT "FamilyCalendarSync_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "FamilyEvent_userId_date_idx" ON "FamilyEvent"("userId", "date");

-- AddForeignKey
ALTER TABLE "FamilyEvent" ADD CONSTRAINT "FamilyEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyCalendarSync" ADD CONSTRAINT "FamilyCalendarSync_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
