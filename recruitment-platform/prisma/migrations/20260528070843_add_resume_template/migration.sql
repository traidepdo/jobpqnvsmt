-- AlterTable
ALTER TABLE `resumes` ADD COLUMN `templateId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `resume_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `htmlContent` LONGTEXT NOT NULL,
    `cssContent` LONGTEXT NOT NULL,
    `category` ENUM('BASIC', 'PROFESSIONAL', 'CREATIVE', 'MODERN', 'ACADEMIC') NOT NULL DEFAULT 'BASIC',
    `isPremium` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resume_templates_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `resumes` ADD CONSTRAINT `resumes_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `resume_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
