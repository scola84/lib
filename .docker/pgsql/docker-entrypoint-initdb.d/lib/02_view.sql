\connect "scola"
CREATE TABLE "view_group" (
  "default_for" CHARACTER VARYING,
  "group_id" INTEGER NOT NULL,
  "view_id" INTEGER NOT NULL
);
CREATE TABLE "view_user" (
  "default_for" CHARACTER VARYING,
  "user_id" INTEGER NOT NULL,
  "view_id" INTEGER NOT NULL
);
CREATE TABLE "view" (
  "date_created" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" CHARACTER VARYING NOT NULL,
  "snippet" TEXT,
  "view_id" SERIAL,
  CONSTRAINT "pkey_view" PRIMARY KEY ("view_id")
);
CREATE INDEX "index_view_group_group" ON "view_group" ("group_id");
CREATE INDEX "index_view_group_view" ON "view_group" ("view_id");
CREATE INDEX "index_view_user_user" ON "view_user" ("user_id");
CREATE INDEX "index_view_user_view" ON "view_user" ("view_id");
ALTER TABLE "view_group" ADD CONSTRAINT "fkey_view_group_group_id" FOREIGN KEY ("group_id") REFERENCES "group" ("group_id") ON DELETE CASCADE;
ALTER TABLE "view_group" ADD CONSTRAINT "fkey_view_group_view_id" FOREIGN KEY ("view_id") REFERENCES "view" ("view_id") ON DELETE CASCADE;
ALTER TABLE "view_user" ADD CONSTRAINT "fkey_view_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE;
ALTER TABLE "view_user" ADD CONSTRAINT "fkey_view_user_view_id" FOREIGN KEY ("view_id") REFERENCES "view" ("view_id") ON DELETE CASCADE;
