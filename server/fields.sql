-- =========================
-- ROLES & USERS
-- =========================
CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar,
  "email" varchar UNIQUE,
  "password" varchar,
  "role_id" uuid,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

ALTER TABLE "users"
ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id");

-- =========================
-- ROLE PERMISSION SYSTEM
-- =========================

-- UI LEFT COLUMN (Modules)
CREATE TABLE "modules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar NOT NULL,
  "slug" varchar UNIQUE NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- UI HEADER (Read / Write / Create / Delete / Import / Export)
CREATE TABLE "permission_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "action" varchar UNIQUE NOT NULL
);

-- PERMISSION MATRIX (Checkboxes)
CREATE TABLE "role_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "role_id" uuid NOT NULL,
  "module_id" uuid NOT NULL,
  "action_id" uuid NOT NULL,
  "is_allowed" boolean DEFAULT false,
  "allow_all" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),

  UNIQUE ("role_id", "module_id", "action_id")
);

ALTER TABLE "role_permissions"
ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE;

ALTER TABLE "role_permissions"
ADD FOREIGN KEY ("module_id") REFERENCES "modules" ("id") ON DELETE CASCADE;

ALTER TABLE "role_permissions"
ADD FOREIGN KEY ("action_id") REFERENCES "permission_actions" ("id") ON DELETE CASCADE;
