CREATE SCHEMA "app";

CREATE TABLE "app"."queue" (
  "id_queue" BIGSERIAL,
  "stat_count_run_busy" BIGINT NOT NULL DEFAULT 0,
  "stat_count_run_done" BIGINT NOT NULL DEFAULT 0,
  "stat_time_queue_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_queue_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "cleanup_after" VARCHAR(255),
  "description" TEXT,
  "name" VARCHAR(255) NOT NULL,
  "previous_condition" VARCHAR(255),
  "previous_id_queue" BIGINT,
  "scope" VARCHAR(255) NOT NULL,
  "trigger_condition" VARCHAR(255),
  "trigger_schedule" VARCHAR(255),
  "trigger_schedule_begin" TIMESTAMP,
  "trigger_schedule_end" TIMESTAMP,
  "trigger_selector_client" TEXT,
  "trigger_selector_query" TEXT,
  "trigger_time" TIMESTAMP,
  PRIMARY KEY ("id_queue")
);

CREATE TABLE "app"."queue_run" (
  "id_run" BIGSERIAL,
  "id_queue" BIGINT NOT NULL,
  "stat_count_item_failure" BIGINT NOT NULL DEFAULT 0,
  "stat_count_item_success" BIGINT NOT NULL DEFAULT 0,
  "stat_count_item_timeout" BIGINT NOT NULL DEFAULT 0,
  "stat_count_item_total" BIGINT NOT NULL DEFAULT 0,
  "stat_id_item_updated" BIGINT,
  "stat_time_item_first" TIMESTAMP,
  "stat_time_item_last" TIMESTAMP,
  "stat_time_run_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_run_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "cleanup_time" TIMESTAMP,
  "trigger_time" TIMESTAMP,
  PRIMARY KEY ("id_run"),
  FOREIGN KEY ("id_queue") REFERENCES "app"."queue" ("id_queue")
);

CREATE TABLE "app"."queue_item" (
  "id_item" BIGSERIAL,
  "id_queue" BIGINT NOT NULL,
  "id_run" BIGINT NOT NULL,
  "stat_time_item_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_item_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "cleanup_time" TIMESTAMP,
  "id" BIGINT,
  "name" VARCHAR(255),
  "status" VARCHAR(255) NOT NULL DEFAULT 'PENDING',
  "type" VARCHAR(255),
  PRIMARY KEY ("id_item"),
  FOREIGN KEY ("id_queue") REFERENCES "app"."queue" ("id_queue"),
  FOREIGN KEY ("id_run") REFERENCES "app"."queue_run" ("id_run")
);

CREATE TABLE "app"."queue_task" (
  "id_task" BIGSERIAL,
  "id_item" BIGINT,
  "id_queue" BIGINT NOT NULL,
  "id_run" BIGINT,
  "stat_time_task_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_task_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "cleanup_time" TIMESTAMP,
  "data" TEXT,
  "error" TEXT,
  "hash" CHAR(128),
  "name" VARCHAR(255) NOT NULL,
  "options" JSON,
  "status" VARCHAR(255) NOT NULL DEFAULT 'PENDING',
  "timeout_time" TIMESTAMP,
  PRIMARY KEY ("id_task"),
  FOREIGN KEY ("id_queue") REFERENCES "app"."queue" ("id_queue"),
  FOREIGN KEY ("id_item") REFERENCES "app"."queue_item" ("id_item"),
  FOREIGN KEY ("id_run") REFERENCES "app"."queue_run" ("id_run")
);

CREATE TABLE "app"."queue_task_control" (
  "id_queue" BIGINT NOT NULL,
  "stat_time_template_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_template_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "name" VARCHAR(255) NOT NULL,
  "options" JSON,
  "timeout_after" VARCHAR(255),
  PRIMARY KEY ("id_queue", "name"),
  FOREIGN KEY ("id_queue") REFERENCES "app"."queue" ("id_queue")
);