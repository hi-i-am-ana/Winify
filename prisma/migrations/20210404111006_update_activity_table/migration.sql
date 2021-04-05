/*
  Warnings:

  - Added the required column `elapsedTime` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "elapsedTime" INTEGER NOT NULL;
