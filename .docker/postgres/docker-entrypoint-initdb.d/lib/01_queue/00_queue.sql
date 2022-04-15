\connect "postgres"
CREATE TABLE "public"."queue" (
  "database_name" CHARACTER VARYING,
  "database_query" TEXT,
  "date_created" TIMESTAMPTZ NOT NULL,
  "date_updated" TIMESTAMPTZ NOT NULL,
  "name" CHARACTER VARYING NOT NULL,
  "options" JSON,
  "parent_id" INTEGER,
  "queue_id" INTEGER NOT NULL,
  "schedule_begin" TIMESTAMPTZ,
  "schedule_cron" CHARACTER VARYING,
  "schedule_end" TIMESTAMPTZ,
  "schedule_next" TIMESTAMPTZ,
  CONSTRAINT "pkey_queue" PRIMARY KEY ("queue_id")
);
