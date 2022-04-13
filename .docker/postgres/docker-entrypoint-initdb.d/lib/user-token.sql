\connect "queue"
CREATE TABLE "public"."user_token" (
  "date_created" TIMESTAMPTZ NOT NULL,
  "date_expires" TIMESTAMPTZ NOT NULL,
  "date_updated" TIMESTAMPTZ NOT NULL,
  "group_id" INTEGER,
  "hash" CHARACTER VARYING,
  "permissions" JSON,
  "role_id" INTEGER,
  "token_id" INTEGER NOT NULL,
  "user_id" INTEGER,
  CONSTRAINT "pkey_user_token" PRIMARY KEY ("token_id"),
  CONSTRAINT "fkey_user_token_group_id" FOREIGN KEY ("group_id") REFERENCES "group" ("group_id") ON DELETE CASCADE,
  CONSTRAINT "fkey_user_token_role_id" FOREIGN KEY ("role_id") REFERENCES "role" ("role_id") ON DELETE CASCADE,
  CONSTRAINT "fkey_user_token_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "index_user_token_hash" ON "user_token" ("hash");
