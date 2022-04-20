USE `scola`;
CREATE TABLE `group` (
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `for_confirm` BOOLEAN,
  `for_register` BOOLEAN,
  `group_id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  CONSTRAINT `pkey_group` PRIMARY KEY (`group_id`)
);
CREATE TABLE `role` (
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires` INTEGER NOT NULL,
  `for_confirm` BOOLEAN,
  `for_register` BOOLEAN,
  `name` VARCHAR(255) NOT NULL,
  `permissions` JSON NOT NULL DEFAULT (json_object()),
  `require_confirm` BOOLEAN,
  `require_mfa` BOOLEAN,
  `role_id` INTEGER NOT NULL AUTO_INCREMENT,
  CONSTRAINT `pkey_role` PRIMARY KEY (`role_id`)
);
CREATE TABLE `user_group_role` (
  `group_id` INTEGER NOT NULL,
  `role_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL
);
CREATE TABLE `user_group` (
  `group_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL
);
CREATE TABLE `user_role` (
  `role_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL
);
CREATE TABLE `user_token` (
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_expires` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `group_id` INTEGER,
  `hash` VARCHAR(255),
  `permissions` JSON,
  `role_id` INTEGER,
  `token_id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  CONSTRAINT `pkey_user_token` PRIMARY KEY (`token_id`)
);
CREATE TABLE `user` (
  `auth_codes` TEXT,
  `auth_codes_confirmed` BOOLEAN,
  `auth_hotp_email` VARCHAR(255),
  `auth_hotp_email_confirmed` BOOLEAN,
  `auth_hotp_tel` VARCHAR(255),
  `auth_hotp_tel_confirmed` BOOLEAN,
  `auth_mfa` BOOLEAN,
  `auth_password` VARCHAR(255),
  `auth_totp` VARCHAR(255),
  `auth_totp_confirmed` BOOLEAN,
  `auth_webauthn` TEXT,
  `auth_webauthn_confirmed` BOOLEAN,
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `email` VARCHAR(255),
  `name` VARCHAR(255),
  `preferences` JSON NOT NULL DEFAULT (json_object()),
  `state_active` BOOLEAN,
  `state_compromised` BOOLEAN,
  `state_confirmed` BOOLEAN,
  `tel` VARCHAR(255),
  `user_id` INTEGER NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255),
  CONSTRAINT `pkey_user` PRIMARY KEY (`user_id`)
);
CREATE INDEX `index_user_group_role_group` ON `user_group_role` (`group_id`);
CREATE INDEX `index_user_group_role_role` ON `user_group_role` (`role_id`);
CREATE INDEX `index_user_group_role_user` ON `user_group_role` (`user_id`);
CREATE INDEX `index_user_group_group` ON `user_group` (`group_id`);
CREATE INDEX `index_user_group_user` ON `user_group` (`user_id`);
CREATE INDEX `index_user_role_role` ON `user_role` (`role_id`);
CREATE INDEX `index_user_role_user` ON `user_role` (`user_id`);
CREATE INDEX `index_user_token_group` ON `user_token` (`group_id`);
CREATE INDEX `index_user_token_role` ON `user_token` (`role_id`);
CREATE INDEX `index_user_token_user` ON `user_token` (`user_id`);
CREATE UNIQUE INDEX `index_user_token_hash` ON `user_token` (`hash`);
CREATE UNIQUE INDEX `index_user_email` ON `user` (`email`);
CREATE UNIQUE INDEX `index_user_tel` ON `user` (`tel`);
CREATE UNIQUE INDEX `index_user_username` ON `user` (`username`);
ALTER TABLE `user_group_role` ADD CONSTRAINT `fkey_user_group_role_group_id` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE;
ALTER TABLE `user_group_role` ADD CONSTRAINT `fkey_user_group_role_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE CASCADE;
ALTER TABLE `user_group_role` ADD CONSTRAINT `fkey_user_group_role_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;
ALTER TABLE `user_group` ADD CONSTRAINT `fkey_user_group_group_id` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE;
ALTER TABLE `user_group` ADD CONSTRAINT `fkey_user_group_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;
ALTER TABLE `user_role` ADD CONSTRAINT `fkey_user_role_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE CASCADE;
ALTER TABLE `user_role` ADD CONSTRAINT `fkey_user_role_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;
ALTER TABLE `user_token` ADD CONSTRAINT `fkey_user_token_group_id` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE SET NULL;
ALTER TABLE `user_token` ADD CONSTRAINT `fkey_user_token_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE SET NULL;
ALTER TABLE `user_token` ADD CONSTRAINT `fkey_user_token_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;
