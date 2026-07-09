-- AlterTable
ALTER TABLE `housekeeping_tasks` ADD COLUMN `inspection_result` ENUM('CLEAN', 'DIRTY', 'INSPECTION') NULL;
