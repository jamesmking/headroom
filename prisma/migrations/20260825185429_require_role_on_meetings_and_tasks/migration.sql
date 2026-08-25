-- Make `roleId` required on Meeting and Task.
--
-- Prisma only generates the SET NOT NULL, which fails outright if any row
-- still has a NULL role. The three steps in front of it make the migration
-- safe to run against data that predates the requirement.
--
-- Orphaned rows go into an explicit "Unassigned" role rather than being
-- folded into whichever role happens to be first. Silently relabelling a
-- meeting as "Team A" would destroy the fact that it was never categorised;
-- an obvious bucket keeps that visible and can be re-filed and then deleted
-- (`deleteEmptyRole` allows removing a role once nothing points at it).

-- 1. One "Unassigned" role for each user that actually has orphaned rows.
INSERT INTO "Role" ("id", "userId", "name", "shortName", "colour", "description", "active", "sortOrder", "createdAt", "updatedAt")
SELECT
    'role_unassigned_' || u."id",
    u."id",
    'Unassigned',
    'UNA',
    -- Deliberately the neutral ink tone, so it never reads as a real role.
    '#5a6874',
    'Created automatically for meetings and tasks that predate roles being required. Move them to a real role, then delete this one.',
    true,
    (SELECT COALESCE(MAX(r."sortOrder"), -1) + 1 FROM "Role" r WHERE r."userId" = u."id"),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User" u
WHERE EXISTS (SELECT 1 FROM "Meeting" m WHERE m."userId" = u."id" AND m."roleId" IS NULL)
   OR EXISTS (SELECT 1 FROM "Task" t WHERE t."userId" = u."id" AND t."roleId" IS NULL)
ON CONFLICT ("id") DO NOTHING;

-- 2. Point every orphaned row at its owner's Unassigned role.
UPDATE "Meeting" SET "roleId" = 'role_unassigned_' || "userId" WHERE "roleId" IS NULL;
UPDATE "Task"    SET "roleId" = 'role_unassigned_' || "userId" WHERE "roleId" IS NULL;

-- 3. Fail loudly rather than silently truncating if anything was missed.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Meeting" WHERE "roleId" IS NULL)
    OR EXISTS (SELECT 1 FROM "Task" WHERE "roleId" IS NULL) THEN
        RAISE EXCEPTION 'Rows with a NULL roleId remain after backfill; aborting.';
    END IF;
END $$;

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_roleId_fkey";

-- AlterTable
ALTER TABLE "Meeting" ALTER COLUMN "roleId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "roleId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
