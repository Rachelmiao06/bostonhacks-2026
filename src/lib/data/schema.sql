-- T Party database (Tiger Data / PostgreSQL + TimescaleDB). Safe to run again.
-- Run with: node --env-file=.env.local scripts/db-setup.mjs

-- One row per MBTA alert. resolved_at is stamped when the alert disappears from MBTA's feed.
CREATE TABLE IF NOT EXISTS outages (
  alert_id      text PRIMARY KEY,
  facility_id   text,
  kind          text NOT NULL,
  station_id    text,
  station_name  text NOT NULL,
  lines         text[] NOT NULL DEFAULT '{}',
  header        text NOT NULL,
  cause         text NOT NULL,
  started_at    timestamptz NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz
);
CREATE INDEX IF NOT EXISTS outages_facility_idx ON outages (facility_id);

-- Time series: one row per open outage per sync. Powers "open outages over time".
CREATE TABLE IF NOT EXISTS outage_observations (
  observed_at timestamptz NOT NULL,
  alert_id    text NOT NULL,
  facility_id text,
  kind        text NOT NULL,
  UNIQUE (observed_at, alert_id)
);
SELECT create_hypertable('outage_observations', by_range('observed_at'), if_not_exists => TRUE);

-- One row per rider per quest. Photos are never stored here, only whether one was attached.
CREATE TABLE IF NOT EXISTS submissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id       text NOT NULL REFERENCES outages (alert_id),
  user_id        text NOT NULL,
  text           text NOT NULL DEFAULT '',
  has_photo      boolean NOT NULL DEFAULT false,
  ai_status      text NOT NULL DEFAULT 'not_checked',   -- not_checked | needs_revision | reviewed
  ai_feedback    jsonb,
  revision_count integer NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'draft',         -- draft | completed
  handed_off     boolean NOT NULL DEFAULT false,        -- rider opened the official MBTA form; NOT proof of submission
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz,
  UNIQUE (alert_id, user_id)
);
CREATE INDEX IF NOT EXISTS submissions_user_idx ON submissions (user_id);

-- Where a row came from: 'live' = seen by our own sync, 'archive' = loaded once from MBTA's public alert archive.
ALTER TABLE outages ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'live';
CREATE INDEX IF NOT EXISTS outages_resolved_idx ON outages (resolved_at);

-- How we know when an outage ended:
--   'mbta_archive' = MBTA's own close time (exact).
--   'detected'     = we noticed it missing from the live feed; the true time lies between last_seen_at and resolved_at.
ALTER TABLE outages ADD COLUMN IF NOT EXISTS resolved_source text;
UPDATE outages SET resolved_source = CASE WHEN source = 'archive' THEN 'mbta_archive' ELSE 'detected' END
WHERE resolved_at IS NOT NULL AND resolved_source IS NULL;

-- One row per AI check, to cap how often one rider or one network address can call it.
CREATE TABLE IF NOT EXISTS review_calls (
  called_at timestamptz NOT NULL DEFAULT now(),
  user_id   text NOT NULL,
  ip_hash   text NOT NULL   -- SHA-256 of the address, never the address itself
);
CREATE INDEX IF NOT EXISTS review_calls_time_idx ON review_calls (called_at);
