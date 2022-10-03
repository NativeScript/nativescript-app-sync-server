GRANT SELECT,UPDATE,INSERT ON `codepush`.* TO 'codepush'@'%' IDENTIFIED BY '123456' WITH GRANT OPTION;

flush privileges;
use `codepush`;

INSERT INTO `apps` (`id`, `name`, `uid`, `os`, `platform`, `is_use_diff_text`, `updated_at`, `created_at`, `deleted_at`)
VALUES (2, 'Demo-ios', 2, 1, 3, 0, '2022-02-02 22:44:38', '2022-02-02 22:44:38', NULL);

INSERT INTO `collaborators` (`id`, `appid`, `uid`, `roles`, `updated_at`, `created_at`, `deleted_at`)
VALUES (2, 2, 2, 'Owner', '2022-02-02 22:44:38', '2022-02-02 22:44:38', NULL);

INSERT INTO `deployments` (`id`, `appid`, `name`, `description`, `deployment_key`, `last_deployment_version_id`, `label_id`, `updated_at`, `created_at`, `deleted_at`)
VALUES (1, 2, 'Production', '', 'sI6NnM7wMlsOb8cJuIPQjMG7T7TnGKIM9Vqsy', 1, 1, '2022-02-02 22:44:38', '2022-02-02 22:44:38', NULL),
       (2, 2, 'Staging', '', 'qOvNYy821eOwmqPbIJqwCLFM3j9DGKIM9Vqsy', 0, 0, '2022-02-02 22:44:38', '2022-02-02 22:44:38', NULL);

INSERT INTO `deployments_history` (`id`, `deployment_id`, `package_id`, `created_at`, `deleted_at`)
VALUES ('1', '1', '1', '2022-02-02 23:33:18', NULL);

INSERT INTO `deployments_versions` (`id`, `deployment_id`, `app_version`, `current_package_id`, `updated_at`, `created_at`, `deleted_at`, `min_version`, `max_version`)
VALUES('1', '1', '1.0.22', '1', '2022-02-02 23:33:18', '2022-02-02 23:33:18', NULL, '1000000000000022', '1000000000000221');

INSERT INTO `packages` (`id`, `deployment_version_id`, `deployment_id`, `description`, `package_hash`, `blob_url`, `size`, `manifest_blob_url`, `release_method`, `label`, `original_label`, `original_deployment`, `updated_at`, `created_at`, `released_by`, `is_mandatory`, `is_disabled`, `rollout`, `deleted_at`)
VALUES('1', '1', '1', 'Stability and bug improvements', '9900ed2756469d8e5fdd033428759f61fd790f03d976f7f22508cebe2b6c5209', 'FqknIx9D93YD5V5gx8umcPlZ2o8e', '3213644', 'Fgco9ZpVS5y-PvjcIIzkDPb0eF6V', 'Upload', 'v1', '', '', '2022-02-02 23:33:18', '2022-02-02 23:33:18', '2', '0', '0', '100', NULL);

INSERT INTO `packages_metrics` (`id`, `package_id`, `active`, `downloaded`, `failed`, `installed`, `updated_at`, `created_at`, `deleted_at`)
VALUES('1', '1', '0', '0', '0', '0', '2022-02-02 23:33:18', '2022-02-02 23:33:18', NULL);

INSERT INTO `user_tokens` (`id`, `uid`, `name`, `tokens`, `created_by`, `description`, `is_session`, `expires_at`, `created_at`, `deleted_at`)
VALUES (1, 2, 'TestKey', 'WOBavdmnCI4mxQKS6IiCmVtLrwlRGKIM9Vqsy', 2, 'This key will be used to login via the CLI', 0, '2027-02-01 22:45:09', '2022-02-02 22:45:09', NULL);

INSERT INTO `users` (`id`, `username`, `password`, `email`, `identical`, `ack_code`, `updated_at`, `created_at`)
VALUES
	(2, 'nativescript', '$2a$12$9KegEUMtCSuc.Pg8cNE8PexXe1QP4hH8czw9w407KJWUwMWcM8TEa', 'test@nativescript.com', 'GKIM9Vqsy', '', '2022-02-02 22:46:08', '2022-02-02 22:44:12'),
	(3, 'colaborator', '$2a$12$9KegEUMtCSuc.Pg8cNE8PexXe1QP4hH8czw9w407KJWUwMWcM8TEa', 'colab@nativescript.com', 'GKIM9Vqsy1', '', '2022-02-02 22:46:08', '2022-02-02 22:44:12');
-- password is password123!

