\connect "postgres";
CREATE TABLE "public"."user" (;
  "active" BOOLEAN,
  "backup_codes" CHARACTER VARYING,
  "created" TIMESTAMPTZ NOT NULL,
  "email" CHARACTER VARYING,
  "hotp_secret" CHARACTER VARYING,
  "locale" CHARACTER VARYING,
  "mfa" BOOLEAN,
  "name" CHARACTER VARYING,
  "oauth_provider" CHARACTER VARYING,
  "password" CHARACTER VARYING,
  "tel" CHARACTER VARYING,
  "totp_secret" CHARACTER VARYING,
  "updated" TIMESTAMPTZ NOT NULL,
  "user_id" INTEGER NOT NULL,
  "username" CHARACTER VARYING,
  "webauthn_credentials" CHARACTER VARYING,
  CONSTRAINT "pkey_user" PRIMARY KEY ("user_id");
);
CREATE UNIQUE INDEX "index_user_email" ON "user" ("email");
CREATE UNIQUE INDEX "index_user_tel" ON "user" ("tel");
CREATE UNIQUE INDEX "index_user_username" ON "user" ("username");
