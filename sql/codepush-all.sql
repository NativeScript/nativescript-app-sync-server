CREATE DATABASE IF NOT EXISTS `codepush`;

GRANT SELECT,UPDATE,INSERT ON `codepush`.* TO 'codepush'@'%' IDENTIFIED BY '123456' WITH GRANT OPTION;

flush privileges;

use `codepush`;
CREATE TABLE IF NOT EXISTS `apps` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '',
  `uid` bigint(20) unsigned NOT NULL DEFAULT '0',
  `os` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `platform` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `is_use_diff_text` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`(12))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
INSERT INTO `apps` (`id`, `name`, `uid`, `os`, `platform`, `is_use_diff_text`, `updated_at`, `created_at`, `deleted_at`)
VALUES (2, 'Demo-ios', 2, 1, 3, 0, '2022-02-02 22:44:38', '2022-02-02 22:44:38', NULL);


CREATE TABLE IF NOT EXISTS `collaborators` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `appid` int(10) unsigned NOT NULL DEFAULT '0',
  `uid` bigint(20) unsigned NOT NULL DEFAULT '0',
  `roles` varchar(20) NOT NULL DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_appid` (`appid`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO `collaborators` (`id`, `appid`, `uid`, `roles`, `updated_at`, `created_at`, `deleted_at`)
VALUES (2, 2, 2, 'Owner', '2022-02-02 22:44:38', '2022-02-02 22:44:38', NULL);

CREATE TABLE IF NOT EXISTS `deployments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `appid` int(10) unsigned NOT NULL DEFAULT '0',
  `name` varchar(20) NOT NULL DEFAULT '',
  `description` varchar(500) NOT NULL DEFAULT '',
  `deployment_key` varchar(64) NOT NULL,
  `last_deployment_version_id` int(10) unsigned NOT NULL DEFAULT '0',
  `label_id` int(11) unsigned NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_appid` (`appid`),
  KEY `idx_deploymentkey` (`deployment_key`(40))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO `deployments` (`id`, `appid`, `name`, `description`, `deployment_key`, `last_deployment_version_id`, `label_id`, `updated_at`, `created_at`, `deleted_at`)
VALUES (1, 2, 'Production', '', 'sI6NnM7wMlsOb8cJuIPQjMG7T7TnGKIM9Vqsy', 1, 1, '2022-02-02 22:44:38', '2022-02-02 22:44:38', NULL),
       (2, 2, 'Staging', '', 'qOvNYy821eOwmqPbIJqwCLFM3j9DGKIM9Vqsy', 0, 0, '2022-02-02 22:44:38', '2022-02-02 22:44:38', NULL);


CREATE TABLE IF NOT EXISTS `deployments_history` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `deployment_id` int(11) unsigned NOT NULL DEFAULT '0',
  `package_id` int(10) unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deployment_id` (`deployment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO `deployments_history` (`id`, `deployment_id`, `package_id`, `created_at`, `deleted_at`)
VALUES ('1', '1', '1', '2022-02-02 23:33:18', NULL);


CREATE TABLE IF NOT EXISTS `deployments_versions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `deployment_id` int(11) unsigned NOT NULL DEFAULT '0',
  `app_version` varchar(100) NOT NULL DEFAULT '',
  `current_package_id` int(10) unsigned NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `min_version` bigint(20) unsigned NOT NULL DEFAULT '0',
  `max_version` bigint(20) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_did_minversion` (`deployment_id`,`min_version`),
  KEY `idx_did_maxversion` (`deployment_id`,`max_version`),
  KEY `idx_did_appversion` (`deployment_id`,`app_version`(30))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO `deployments_versions` (`id`, `deployment_id`, `app_version`, `current_package_id`, `updated_at`, `created_at`, `deleted_at`, `min_version`, `max_version`)
VALUES('1', '1', '1.0.22', '1', '2022-02-02 23:33:18', '2022-02-02 23:33:18', NULL, '1000000000000022', '1000000000000221');

CREATE TABLE IF NOT EXISTS `packages` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `deployment_version_id` int(10) unsigned NOT NULL DEFAULT '0',
  `deployment_id` int(10) unsigned NOT NULL DEFAULT '0',
  `description` varchar(500) NOT NULL DEFAULT '',
  `package_hash` varchar(64) NOT NULL DEFAULT '',
  `blob_url` varchar(255) NOT NULL DEFAULT '',
  `size` int(11) unsigned NOT NULL DEFAULT '0',
  `manifest_blob_url` varchar(255) NOT NULL DEFAULT '',
  `release_method` varchar(20) NOT NULL DEFAULT '',
  `label` varchar(20) NOT NULL DEFAULT '',
  `original_label` varchar(20) NOT NULL DEFAULT '',
  `original_deployment` varchar(20) NOT NULL DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `released_by` bigint(20) unsigned NOT NULL DEFAULT '0',
  `is_mandatory` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `is_disabled` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rollout` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deploymentid_label` (`deployment_id`,`label`(8)),
  KEY `idx_versions_id` (`deployment_version_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `packages` (`id`, `deployment_version_id`, `deployment_id`, `description`, `package_hash`, `blob_url`, `size`, `manifest_blob_url`, `release_method`, `label`, `original_label`, `original_deployment`, `updated_at`, `created_at`, `released_by`, `is_mandatory`, `is_disabled`, `rollout`, `deleted_at`)
VALUES('1', '1', '1', 'Stability and bug improvements', '9900ed2756469d8e5fdd033428759f61fd790f03d976f7f22508cebe2b6c5209', 'FqknIx9D93YD5V5gx8umcPlZ2o8e', '3213644', 'Fgco9ZpVS5y-PvjcIIzkDPb0eF6V', 'Upload', 'v1', '', '', '2022-02-02 23:33:18', '2022-02-02 23:33:18', '2', '0', '0', '100', NULL);

CREATE TABLE IF NOT EXISTS `packages_diff` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `package_id` int(11) unsigned NOT NULL DEFAULT '0',
  `diff_against_package_hash` varchar(64) NOT NULL DEFAULT '',
  `diff_blob_url` varchar(255) NOT NULL DEFAULT '',
  `diff_size` int(11) unsigned NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_packageid_hash` (`package_id`,`diff_against_package_hash`(40))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `packages_metrics` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `package_id` int(10) unsigned NOT NULL DEFAULT '0',
  `active` int(10) unsigned NOT NULL DEFAULT '0',
  `downloaded` int(10) unsigned NOT NULL DEFAULT '0',
  `failed` int(10) unsigned NOT NULL DEFAULT '0',
  `installed` int(10) unsigned NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_packageid` (`package_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO `packages_metrics` (`id`, `package_id`, `active`, `downloaded`, `failed`, `installed`, `updated_at`, `created_at`, `deleted_at`)
VALUES('1', '1', '0', '0', '0', '0', '2022-02-02 23:33:18', '2022-02-02 23:33:18', NULL);



CREATE TABLE IF NOT EXISTS `user_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uid` bigint(20) unsigned NOT NULL DEFAULT '0',
  `name` varchar(50) NOT NULL DEFAULT '',
  `tokens` varchar(64) NOT NULL DEFAULT '',
  `created_by` varchar(64) NOT NULL DEFAULT '',
  `description` varchar(500) NOT NULL DEFAULT '',
  `is_session` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uid` (`uid`),
  KEY `idx_tokens` (`tokens`) KEY_BLOCK_SIZE=16
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO `user_tokens` (`id`, `uid`, `name`, `tokens`, `created_by`, `description`, `is_session`, `expires_at`, `created_at`, `deleted_at`)
VALUES (1, 2, 'TestKey', 'WOBavdmnCI4mxQKS6IiCmVtLrwlRGKIM9Vqsy', 2, 'This key will be used to login via the CLI', 0, '2027-02-01 22:45:09', '2022-02-02 22:45:09', NULL);

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(11) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(100) NOT NULL DEFAULT '',
  `identical` varchar(10) NOT NULL DEFAULT '',
  `ack_code` varchar(10) NOT NULL DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `udx_identical` (`identical`),
  KEY `udx_username` (`username`),
  KEY `idx_email` (`email`) KEY_BLOCK_SIZE=20
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `users` (`id`, `username`, `password`, `email`, `identical`, `ack_code`, `updated_at`, `created_at`)
VALUES
	(2, 'nativescript', '$2a$12$9KegEUMtCSuc.Pg8cNE8PexXe1QP4hH8czw9w407KJWUwMWcM8TEa', 'test@nativescript.com', 'GKIM9Vqsy', '', '2022-02-02 22:46:08', '2022-02-02 22:44:12'),
	(3, 'colaborator', '$2a$12$9KegEUMtCSuc.Pg8cNE8PexXe1QP4hH8czw9w407KJWUwMWcM8TEa', 'colab@nativescript.com', 'GKIM9Vqsy1', '', '2022-02-02 22:46:08', '2022-02-02 22:44:12');
-- password is password123!
CREATE TABLE IF NOT EXISTS `versions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '1.DBversion',
  `version` varchar(10) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `udx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `versions` WRITE;
INSERT INTO `versions` (`id`, `type`, `version`)
VALUES
	(1,1,'0.5.0');
UNLOCK TABLES;

CREATE TABLE IF NOT EXISTS `log_report_deploy` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `status` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `package_id` int(10) unsigned NOT NULL DEFAULT '0',
  `client_unique_id` varchar(100) NOT NULL DEFAULT '',
  `previous_label` varchar(20) NOT NULL DEFAULT '',
  `previous_deployment_key` varchar(64) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `log_report_download` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `package_id` int(10) unsigned NOT NULL DEFAULT '0',
  `client_unique_id` varchar(100) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
