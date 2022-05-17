USE `scola`;
CREATE TABLE `view_group` (
  `default_for` VARCHAR(255),
  `group_id` INTEGER NOT NULL,
  `view_id` INTEGER NOT NULL
);
CREATE TABLE `view_user` (
  `default_for` VARCHAR(255),
  `user_id` INTEGER NOT NULL,
  `view_id` INTEGER NOT NULL
);
CREATE TABLE `view` (
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `name` VARCHAR(255) NOT NULL,
  `snippet` TEXT,
  `view_id` INTEGER NOT NULL AUTO_INCREMENT,
  CONSTRAINT `pkey_view` PRIMARY KEY (`view_id`)
);
CREATE INDEX `index_view_group_group` ON `view_group` (`group_id`);
CREATE INDEX `index_view_group_view` ON `view_group` (`view_id`);
CREATE INDEX `index_view_user_user` ON `view_user` (`user_id`);
CREATE INDEX `index_view_user_view` ON `view_user` (`view_id`);
CREATE UNIQUE INDEX `index_view_view` ON `view` (`name`);
ALTER TABLE `view_group` ADD CONSTRAINT `fkey_view_group_group_id` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE;
ALTER TABLE `view_group` ADD CONSTRAINT `fkey_view_group_view_id` FOREIGN KEY (`view_id`) REFERENCES `view` (`view_id`) ON DELETE CASCADE;
ALTER TABLE `view_user` ADD CONSTRAINT `fkey_view_user_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;
ALTER TABLE `view_user` ADD CONSTRAINT `fkey_view_user_view_id` FOREIGN KEY (`view_id`) REFERENCES `view` (`view_id`) ON DELETE CASCADE;
