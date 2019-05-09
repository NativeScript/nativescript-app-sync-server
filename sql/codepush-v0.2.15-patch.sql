
ALTER TABLE `apps` CHANGE `created_at` `created_at` TIMESTAMP  NULL;
ALTER TABLE `collaborators` CHANGE `created_at` `created_at` TIMESTAMP  NULL;
ALTER TABLE `deployments` CHANGE `created_at` `created_at` TIMESTAMP  NULL;
ALTER TABLE `deployments_history` CHANGE `created_at` `created_at` TIMESTAMP  NULL;
ALTER TABLE `deployments_versions` CHANGE `created_at` `created_at` TIMESTAMP  NULL;
ALTER TABLE `packages_diff` CHANGE `created_at` `created_at` TIMESTAMP  NULL;
ALTER TABLE `packages_metrics` CHANGE `created_at` `created_at` TIMESTAMP  NULL;
ALTER TABLE `user_tokens` CHANGE `expires_at` `expires_at` TIMESTAMP  NULL,CHANGE `created_at` `created_at` TIMESTAMP  NULL;
ALTER TABLE `users` CHANGE `created_at` `created_at` TIMESTAMP  NULL;

DROP PROCEDURE IF EXISTS schema_change;
CREATE PROCEDURE schema_change()
BEGIN
DECLARE  CurrentDatabase VARCHAR(100);
SELECT DATABASE() INTO CurrentDatabase;
IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema=CurrentDatabase AND table_name = 'packages' AND column_name = 'is_mandatory') THEN
    ALTER TABLE `packages` ADD `is_mandatory` TINYINT(3)  UNSIGNED  NOT NULL  DEFAULT '0';
END IF;
END;
CALL schema_change();
DROP PROCEDURE IF EXISTS schema_change;

ALTER TABLE `deployments_versions` DROP INDEX idx_did_appversion, ADD INDEX `idx_did_appversion` (`deployment_id`, `app_version`),ADD `deleted_at` TIMESTAMP  NULL;
ALTER TABLE `packages` ADD `deleted_at` TIMESTAMP  NULL;
ALTER TABLE `packages_metrics` DROP INDEX `udx_packageid`,ADD INDEX `idx_packageid` (`package_id`),ADD `deleted_at` TIMESTAMP  NULL;
ALTER TABLE `packages_diff` ADD `deleted_at` TIMESTAMP  NULL;
UPDATE `versions` SET `version` = '0.2.15' WHERE `type` = '1';
