/*
  Warnings:

  - Added the required column `elevation` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `averageSpeed` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "elevation" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "averageSpeed" DOUBLE PRECISION NOT NULL;
