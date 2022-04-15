\connect "postgres"
CREATE TABLE "public"."run" (
  "aggr_err" INTEGER NOT NULL DEFAULT 0,
  "aggr_ok" INTEGER NOT NULL DEFAULT 0,
  "aggr_total" INTEGER NOT NULL DEFAULT 0,
  "date_created" TIMESTAMPTZ NOT NULL,
  "date_updated" TIMESTAMPTZ NOT NULL,
  "name" CHARACTER VARYING,
  "options" JSON,
  "queue_id" INTEGER NOT NULL,
  "reason" TEXT,
  "run_id" INTEGER NOT NULL,
  "status" CHARACTER VARYING NOT NULL DEFAULT 'pending'::CHARACTER,
  "task_id" INTEGER,
  CONSTRAINT "pkey_run" PRIMARY KEY ("run_id"),
  CONSTRAINT "fkey_run_queue_id" FOREIGN KEY ("queue_id") REFERENCES "queue" ("queue_id") ON DELETE SET NULL
);
