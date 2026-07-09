-- DropForeignKey
ALTER TABLE `folios` DROP FOREIGN KEY `folios_reservation_id_fkey`;

-- DropIndex
DROP INDEX `folios_reservation_id_key` ON `folios`;

-- AlterTable
ALTER TABLE `folios` ADD COLUMN `parent_folio_id` INTEGER NULL,
    ADD COLUMN `type` ENUM('MAIN', 'ADJUSTMENT') NOT NULL DEFAULT 'MAIN';

-- CreateIndex
CREATE INDEX `folios_reservation_id_idx` ON `folios`(`reservation_id`);

-- CreateIndex
CREATE INDEX `folios_parent_folio_id_idx` ON `folios`(`parent_folio_id`);

-- AddForeignKey
ALTER TABLE `folios` ADD CONSTRAINT `folios_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `folios` ADD CONSTRAINT `folios_parent_folio_id_fkey` FOREIGN KEY (`parent_folio_id`) REFERENCES `folios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
