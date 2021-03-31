/*
  Warnings:

  - You are about to drop the column `accessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `accessTokenExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "accessToken",
DROP COLUMN "accessTokenExpiresAt",
DROP COLUMN "refreshToken",
ADD COLUMN     "stravaAccessToken" TEXT,
ADD COLUMN     "stravaAcTokExpiresAt" TIMESTAMP(3),
ADD COLUMN     "stravaRefreshToken" TEXT;
