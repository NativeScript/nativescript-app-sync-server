ALTER TABLE `apps` ADD `os` TINYINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `apps` ADD `platform` TINYINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `packages` ADD `is_disabled` TINYINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `packages` ADD `rollout` TINYINT  UNSIGNED  NOT NULL  DEFAULT 100;

CREATE TABLE `log_report_deploy` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `package_id` int(10) unsigned NOT NULL DEFAULT '0',
  `client_unique_id` varchar(100) NOT NULL DEFAULT '',
  `previous_label` varchar(20) NOT NULL DEFAULT '',
  `previous_deployment_key` varchar(64) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `log_report_download` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `package_id` int(10) unsigned NOT NULL DEFAULT '0',
  `client_unique_id` varchar(100) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

UPDATE `versions` SET `version` = '0.3.0' WHERE `type` = '1';