\connect "scola"
CREATE TABLE "queue" (
  "database_name" CHARACTER VARYING,
  "database_query" TEXT,
  "date_created" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" CHARACTER VARYING NOT NULL,
  "options" JSON NOT NULL DEFAULT '{}'::JSON,
  "parent_id" INTEGER,
  "queue_id" SERIAL,
  "schedule_begin" TIMESTAMPTZ,
  "schedule_cron" CHARACTER VARYING,
  "schedule_end" TIMESTAMPTZ,
  "schedule_next" TIMESTAMPTZ,
  CONSTRAINT "pkey_queue" PRIMARY KEY ("queue_id")
);
CREATE TABLE "run" (
  "aggr_err" INTEGER NOT NULL DEFAULT 0,
  "aggr_ok" INTEGER NOT NULL DEFAULT 0,
  "aggr_total" INTEGER NOT NULL DEFAULT 0,
  "date_created" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" CHARACTER VARYING,
  "options" JSON,
  "queue_id" INTEGER NOT NULL,
  "reason" TEXT,
  "run_id" SERIAL,
  "status" CHARACTER VARYING NOT NULL DEFAULT 'pending'::CHARACTER,
  "task_id" INTEGER,
  CONSTRAINT "pkey_run" PRIMARY KEY ("run_id")
);
CREATE TABLE "task" (
  "date_created" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_queued" TIMESTAMPTZ,
  "date_started" TIMESTAMPTZ,
  "date_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "host" CHARACTER VARYING,
  "payload" JSON NOT NULL DEFAULT '{}'::JSON,
  "reason" TEXT,
  "result" JSON NOT NULL DEFAULT '{}'::JSON,
  "run_id" INTEGER NOT NULL,
  "status" CHARACTER VARYING NOT NULL DEFAULT 'pending'::CHARACTER,
  "task_id" SERIAL,
  CONSTRAINT "pkey_task" PRIMARY KEY ("task_id")
);
CREATE INDEX "index_queue_queue" ON "queue" ("parent_id");
CREATE INDEX "index_run_queue" ON "run" ("queue_id");
CREATE INDEX "index_run_task" ON "run" ("task_id");
CREATE INDEX "index_task_run" ON "task" ("run_id");
ALTER TABLE "queue" ADD CONSTRAINT "fkey_queue_parent_id" FOREIGN KEY ("parent_id") REFERENCES "queue" ("queue_id") ON DELETE SET NULL;
ALTER TABLE "run" ADD CONSTRAINT "fkey_run_queue_id" FOREIGN KEY ("queue_id") REFERENCES "queue" ("queue_id") ON DELETE CASCADE;
ALTER TABLE "run" ADD CONSTRAINT "fkey_run_task_id" FOREIGN KEY ("task_id") REFERENCES "task" ("task_id") ON DELETE SET NULL;
ALTER TABLE "task" ADD CONSTRAINT "fkey_task_run_id" FOREIGN KEY ("run_id") REFERENCES "run" ("run_id") ON DELETE CASCADE;