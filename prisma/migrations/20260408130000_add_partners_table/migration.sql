-- Create partners table
CREATE TABLE "partners" (
  "id"            TEXT NOT NULL,
  "slug"          TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "logo_url"      TEXT NOT NULL,
  "logo_url_dark" TEXT,
  "website_url"   TEXT,
  "category"      TEXT NOT NULL DEFAULT 'client',
  "active"        BOOLEAN NOT NULL DEFAULT true,
  "sort_order"    INTEGER NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- Unique index on slug
CREATE UNIQUE INDEX "partners_slug_key" ON "partners"("slug");
