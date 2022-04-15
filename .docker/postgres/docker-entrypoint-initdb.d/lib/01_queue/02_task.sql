\connect "postgres"
CREATE TABLE "public"."task" (
  "date_created" TIMESTAMPTZ NOT NULL,
  "date_queued" TIMESTAMPTZ NOT NULL,
  "date_started" TIMESTAMPTZ NOT NULL,
  "date_updated" TIMESTAMPTZ NOT NULL,
  "host" CHARACTER VARYING,
  "options" JSON,
  "reason" TEXT,
  "run_id" INTEGER,
  "status" CHARACTER VARYING NOT NULL DEFAULT 'pending'::CHARACTER,
  "task_id" INTEGER NOT NULL,
  CONSTRAINT "pkey_task" PRIMARY KEY ("task_id"),
  CONSTRAINT "fkey_task_run_id" FOREIGN KEY ("run_id") REFERENCES "run" ("run_id") ON DELETE SET NULL
);
