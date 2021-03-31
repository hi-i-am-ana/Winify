/*
  Warnings:

  - You are about to drop the column `start_date` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `start_date_local` on the `Activity` table. All the data in the column will be lost.
  - Added the required column `startDate` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDateLocal` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "start_date",
DROP COLUMN "start_date_local",
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDateLocal" TIMESTAMP(3) NOT NULL;
