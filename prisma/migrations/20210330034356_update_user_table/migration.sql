-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_stravaUserId_fkey";

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "stravaUserId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "stravaUserId" SET DATA TYPE BIGINT;

-- AddForeignKey
ALTER TABLE "Activity" ADD FOREIGN KEY ("stravaUserId") REFERENCES "User"("stravaUserId") ON DELETE CASCADE ON UPDATE CASCADE;
