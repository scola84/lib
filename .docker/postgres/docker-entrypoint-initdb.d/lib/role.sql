\connect "queue"
CREATE TABLE "public"."role" (
  "date_created" TIMESTAMPTZ NOT NULL,
  "date_updated" TIMESTAMPTZ NOT NULL,
  "expires" INTEGER NOT NULL,
  "name" CHARACTER VARYING NOT NULL,
  "permissions" JSON NOT NULL,
  "role_id" INTEGER NOT NULL,
  CONSTRAINT "pkey_role" PRIMARY KEY ("role_id")
);
