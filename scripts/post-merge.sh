#!/bin/bash
# post-merge-setup.sh — runs automatically after every task merge.
# Rules:
#   - Non-interactive: stdin is /dev/null. No prompts.
#   - Idempotent: safe to run multiple times.
#   - Fail-fast: `set -e` aborts on first error.
set -e

echo "→ Installing dependencies..."
pnpm install --frozen-lockfile

echo "→ Applying schema migrations..."
# drizzle-kit push cannot run non-interactively in this version of drizzle-kit
# (v0.31.x throws when it detects no TTY, even with --force). We apply pending
# changes via idempotent psql SQL instead. Add a block here for every new
# structural change merged by a task agent.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'

-- ── listing_views: unique constraint (task: view-dedup analytics) ────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listing_views_listing_id_visitor_key_bucket_key_unique'
  ) THEN
    DELETE FROM listing_views WHERE id NOT IN (
      SELECT MIN(id) FROM listing_views
      GROUP BY listing_id, visitor_key, bucket_key
    );
    ALTER TABLE listing_views
      ADD CONSTRAINT listing_views_listing_id_visitor_key_bucket_key_unique
      UNIQUE (listing_id, visitor_key, bucket_key);
  END IF;
END $$;

-- ── listings: availability_status column (task: availability badge) ──────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'availability_status'
  ) THEN
    ALTER TABLE listings
      ADD COLUMN availability_status text NOT NULL DEFAULT 'available';
  END IF;
END $$;

-- ── page_events table (task: landing page analytics / meta pixel) ────────────
CREATE TABLE IF NOT EXISTS page_events (
  id         serial PRIMARY KEY,
  event_type text NOT NULL,
  page       text NOT NULL,
  meta       jsonb,
  visitor_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

SQL

echo "→ All migrations applied."
