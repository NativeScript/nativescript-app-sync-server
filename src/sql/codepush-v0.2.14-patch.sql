DROP TABLE IF EXISTS `versions`;
CREATE TABLE `versions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '1.DBversion',
  `version` varchar(10) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `udx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `versions` WRITE;
INSERT INTO `versions` (`id`, `type`, `version`)
VALUES
    (1,1,'0.2.14');
UNLOCK TABLES;

ALTER TABLE `packages` ADD `is_mandatory` TINYINT(3)  UNSIGNED  NOT NULL  DEFAULT '0';
