ALTER TABLE `apps` ADD `is_use_diff_text` TINYINT(3)  UNSIGNED  NOT NULL  DEFAULT '0';

UPDATE `versions` SET `version` = '0.5.0' WHERE `type` = '1';