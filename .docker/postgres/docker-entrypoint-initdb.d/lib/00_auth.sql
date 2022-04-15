\connect "scola"
CREATE TABLE "group" (
  "date_created" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "group_id" SERIAL,
  "name" CHARACTER VARYING NOT NULL,
  CONSTRAINT "pkey_group" PRIMARY KEY ("group_id")
);
CREATE TABLE "role" (
  "date_created" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires" INTEGER NOT NULL,
  "name" CHARACTER VARYING NOT NULL,
  "permissions" JSON NOT NULL DEFAULT '{}'::JSON,
  "role_id" SERIAL,
  CONSTRAINT "pkey_role" PRIMARY KEY ("role_id")
);
CREATE TABLE "user_group_role" (
  "group_id" INTEGER NOT NULL,
  "role_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL
);
CREATE TABLE "user_role" (
  "role_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL
);
CREATE TABLE "user_token" (
  "date_created" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_expires" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "group_id" INTEGER,
  "hash" CHARACTER VARYING,
  "permissions" JSON,
  "role_id" INTEGER,
  "token_id" SERIAL,
  "user_id" INTEGER NOT NULL,
  CONSTRAINT "pkey_user_token" PRIMARY KEY ("token_id")
);
CREATE TABLE "user" (
  "auth_codes" TEXT,
  "auth_codes_confirmed" BOOLEAN NOT NULL,
  "auth_hotp_email" CHARACTER VARYING,
  "auth_hotp_email_confirmed" BOOLEAN NOT NULL,
  "auth_hotp_tel" CHARACTER VARYING,
  "auth_hotp_tel_confirmed" BOOLEAN NOT NULL,
  "auth_mfa" BOOLEAN,
  "auth_password" CHARACTER VARYING,
  "auth_totp" CHARACTER VARYING,
  "auth_totp_confirmed" BOOLEAN NOT NULL,
  "auth_webauthn" TEXT,
  "auth_webauthn_confirmed" BOOLEAN NOT NULL,
  "date_created" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "email" CHARACTER VARYING,
  "name" CHARACTER VARYING,
  "preferences" JSON,
  "state_active" BOOLEAN,
  "state_compromised" BOOLEAN,
  "state_confirmed" BOOLEAN,
  "tel" CHARACTER VARYING,
  "user_id" SERIAL,
  "username" CHARACTER VARYING,
  CONSTRAINT "pkey_user" PRIMARY KEY ("user_id")
);
CREATE INDEX "index_user_group_role_group" ON "user_group_role" ("group_id");
CREATE INDEX "index_user_group_role_role" ON "user_group_role" ("role_id");
CREATE INDEX "index_user_group_role_user" ON "user_group_role" ("user_id");
CREATE INDEX "index_user_role_role" ON "user_role" ("role_id");
CREATE INDEX "index_user_role_user" ON "user_role" ("user_id");
CREATE INDEX "index_user_token_group" ON "user_token" ("group_id");
CREATE INDEX "index_user_token_role" ON "user_token" ("role_id");
CREATE INDEX "index_user_token_user" ON "user_token" ("user_id");
CREATE UNIQUE INDEX "index_user_token_hash" ON "user_token" ("hash");
CREATE UNIQUE INDEX "index_user_email" ON "user" ("email");
CREATE UNIQUE INDEX "index_user_tel" ON "user" ("tel");
CREATE UNIQUE INDEX "index_user_username" ON "user" ("username");
ALTER TABLE "user_group_role" ADD CONSTRAINT "fkey_user_group_role_group_id" FOREIGN KEY ("group_id") REFERENCES "group" ("group_id") ON DELETE CASCADE;
ALTER TABLE "user_group_role" ADD CONSTRAINT "fkey_user_group_role_role_id" FOREIGN KEY ("role_id") REFERENCES "role" ("role_id") ON DELETE CASCADE;
ALTER TABLE "user_group_role" ADD CONSTRAINT "fkey_user_group_role_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE;
ALTER TABLE "user_role" ADD CONSTRAINT "fkey_user_role_role_id" FOREIGN KEY ("role_id") REFERENCES "role" ("role_id") ON DELETE CASCADE;
ALTER TABLE "user_role" ADD CONSTRAINT "fkey_user_role_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE;
ALTER TABLE "user_token" ADD CONSTRAINT "fkey_user_token_group_id" FOREIGN KEY ("group_id") REFERENCES "group" ("group_id") ON DELETE SET NULL;
ALTER TABLE "user_token" ADD CONSTRAINT "fkey_user_token_role_id" FOREIGN KEY ("role_id") REFERENCES "role" ("role_id") ON DELETE SET NULL;
ALTER TABLE "user_token" ADD CONSTRAINT "fkey_user_token_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE;