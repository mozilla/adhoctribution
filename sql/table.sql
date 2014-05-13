CREATE TABLE `contributions` (
  `logged_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logged_by` varchar(255) NOT NULL,
  `contributor_id` varchar(255) NOT NULL,
  `contribution_date` date NOT NULL,
  `moz_team` varchar(45) NOT NULL,
  `data_bucket` varchar(45) NOT NULL,
  `description` varchar(255) NOT NULL,
  `evidence` varchar(2000) DEFAULT NULL,
  UNIQUE KEY `no_dupes` (`contributor_id`,`contribution_date`,`moz_team`,`data_bucket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
