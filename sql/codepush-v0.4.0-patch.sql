ALTER TABLE `deployments_versions` ADD `min_version` BIGINT(20)  UNSIGNED  NOT NULL  DEFAULT '0';
ALTER TABLE `deployments_versions` ADD `max_version` BIGINT(20)  UNSIGNED  NOT NULL  DEFAULT '0';
ALTER TABLE `deployments_versions` ADD INDEX `idx_did_min_version` (`deployment_id`, `min_version`);
ALTER TABLE `deployments_versions` ADD INDEX `idx_did_maxversion` (`deployment_id`, `max_version`);
ALTER TABLE `deployments_versions` CHANGE `app_version` `app_version` VARCHAR(100)  CHARACTER SET utf8  COLLATE utf8_general_ci  NOT NULL  DEFAULT '';
ALTER TABLE `deployments_versions` DROP INDEX `idx_did_appversion`;
ALTER TABLE `deployments_versions` ADD INDEX `idx_did_appversion` (`deployment_id`, `app_version` (30));

UPDATE `versions` SET `version` = '0.4.0' WHERE `type` = '1';