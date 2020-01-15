CREATE SCHEMA "app";

CREATE TYPE STATUS AS ENUM ('FAILURE', 'PENDING', 'SUCCESS', 'TIMEOUT');

CREATE TABLE "app"."queue" (
  "id_queue" BIGSERIAL,
  "stat_time_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "cleanup_action" VARCHAR(255),
  "cleanup_after" VARCHAR(255),
  "description" TEXT,
  "name" VARCHAR(255) NOT NULL,
  "scope" VARCHAR(255) NOT NULL,
  "selector_client" TEXT,
  "selector_query" TEXT,
  "trigger_id_queue" BIGINT,
  "trigger_schedule" VARCHAR(255),
  "trigger_schedule_begin" TIMESTAMP,
  "trigger_schedule_end" TIMESTAMP,
  "trigger_schedule_next" TIMESTAMP,
  PRIMARY KEY ("id_queue")
);

CREATE TABLE "app"."queue_group" (
  "id_queue" BIGINT NOT NULL,
  "id_group" BIGINT NOT NULL,
  PRIMARY KEY ("id_queue", "id_group")
);

CREATE TABLE "app"."queue_task" (
  "id_task" BIGSERIAL,
  "id_queue" BIGINT NOT NULL,
  "stat_time_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "assign_id_group" BIGINT,
  "assign_id_user" BIGINT,
  "name" VARCHAR(255) NOT NULL,
  "settings" JSON,
  "timeout_action" VARCHAR(255),
  "timeout_after" VARCHAR(255),
  PRIMARY KEY ("id_task"),
  FOREIGN KEY ("id_queue") REFERENCES "app"."queue" ("id_queue")
);

CREATE TABLE "app"."queue_run" (
  "id_run" BIGSERIAL,
  "id_queue" BIGINT NOT NULL,
  "stat_count_failure" BIGINT NOT NULL DEFAULT 0,
  "stat_count_success" BIGINT NOT NULL DEFAULT 0,
  "stat_count_timeout" BIGINT NOT NULL DEFAULT 0,
  "stat_count_total" BIGINT NOT NULL DEFAULT 0,
  "stat_time_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id_run"),
  FOREIGN KEY ("id_queue") REFERENCES "app"."queue" ("id_queue")
);

CREATE TABLE "app"."queue_run_item" (
  "id_item" BIGSERIAL,
  "id_queue" BIGINT NOT NULL,
  "id_run" BIGINT NOT NULL,
  "stat_time_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "name" VARCHAR(255) NOT NULL,
  "object_name" VARCHAR(255),
  "object_id" BIGINT,
  "status" STATUS NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY ("id_item"),
  FOREIGN KEY ("id_queue") REFERENCES "app"."queue" ("id_queue"),
  FOREIGN KEY ("id_run") REFERENCES "app"."queue_run" ("id_run")
);

CREATE TABLE "app"."queue_run_item_task" (
  "id_task" BIGSERIAL,
  "id_item" BIGINT,
  "id_queue" BIGINT,
  "id_run" BIGINT,
  "stat_time_created" TIMESTAMP NOT NULL DEFAULT NOW(),
  "stat_time_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "assign_id_group" BIGINT,
  "assign_id_user" BIGINT,
  "data_in" TEXT,
  "data_out" TEXT,
  "error" TEXT,
  "hash" CHAR(128),
  "name" VARCHAR(255) NOT NULL,
  "status" STATUS NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY ("id_task"),
  FOREIGN KEY ("id_queue") REFERENCES "app"."queue" ("id_queue"),
  FOREIGN KEY ("id_item") REFERENCES "app"."queue_run_item" ("id_item"),
  FOREIGN KEY ("id_run") REFERENCES "app"."queue_run" ("id_run")
);