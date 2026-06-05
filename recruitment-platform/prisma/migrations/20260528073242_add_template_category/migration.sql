/*
  Warnings:

  - You are about to drop the column `isPremium` on the `resume_templates` table. All the data in the column will be lost.
  - You are about to drop the column `usageCount` on the `resume_templates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `resume_templates` DROP COLUMN `isPremium`,
    DROP COLUMN `usageCount`;
