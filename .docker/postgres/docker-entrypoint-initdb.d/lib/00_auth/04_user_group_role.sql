\connect "postgres"
CREATE TABLE "public"."user_group_role" (
  "group_id" INTEGER NOT NULL,
  "role_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  CONSTRAINT "fkey_user_group_role_group_id" FOREIGN KEY ("group_id") REFERENCES "group" ("group_id") ON DELETE SET NULL,
  CONSTRAINT "fkey_user_group_role_role_id" FOREIGN KEY ("role_id") REFERENCES "role" ("role_id") ON DELETE SET NULL,
  CONSTRAINT "fkey_user_group_role_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE SET NULL
);
