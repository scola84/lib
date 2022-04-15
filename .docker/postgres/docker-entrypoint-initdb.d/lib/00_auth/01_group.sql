\connect "postgres"
CREATE TABLE "public"."group" (
  "date_created" TIMESTAMPTZ NOT NULL,
  "date_updated" TIMESTAMPTZ NOT NULL,
  "group_id" INTEGER NOT NULL,
  "name" CHARACTER VARYING NOT NULL,
  CONSTRAINT "pkey_group" PRIMARY KEY ("group_id")
);
