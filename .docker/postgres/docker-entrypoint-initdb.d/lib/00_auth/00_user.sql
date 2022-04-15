\connect "postgres"
CREATE TABLE "public"."user" (
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
  "date_created" TIMESTAMPTZ NOT NULL,
  "date_updated" TIMESTAMPTZ NOT NULL,
  "email" CHARACTER VARYING,
  "name" CHARACTER VARYING,
  "preferences" JSON,
  "state_active" BOOLEAN,
  "state_compromised" BOOLEAN,
  "state_confirmed" BOOLEAN,
  "tel" CHARACTER VARYING,
  "user_id" INTEGER NOT NULL,
  "username" CHARACTER VARYING,
  CONSTRAINT "pkey_user" PRIMARY KEY ("user_id")
);
CREATE UNIQUE INDEX "index_user_email" ON "user" ("email");
CREATE UNIQUE INDEX "index_user_tel" ON "user" ("tel");
CREATE UNIQUE INDEX "index_user_username" ON "user" ("username");
