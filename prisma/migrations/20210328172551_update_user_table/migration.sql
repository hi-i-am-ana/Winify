/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[stravaActivityId]` on the table `Activity`. If there are existing duplicate values, the migration will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePictureUrl" TEXT,
ADD COLUMN     "activityReadScope" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "refreshToken" TEXT,
ALTER COLUMN "stravaUserId" DROP NOT NULL,
ALTER COLUMN "lastname" DROP NOT NULL,
ALTER COLUMN "firstname" DROP NOT NULL,
ALTER COLUMN "active" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Activity.stravaActivityId_unique" ON "Activity"("stravaActivityId");
