\connect "queue"
CREATE TABLE "public"."user_role" (
  "role_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  CONSTRAINT "fkey_user_role_role_id" FOREIGN KEY ("role_id") REFERENCES "role" ("role_id") ON DELETE CASCADE,
  CONSTRAINT "fkey_user_role_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE
);
