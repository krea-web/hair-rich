-- Hair Rich · Reviews admin extensions
-- Adds optional author display name (since reviews may be imported from
-- external sources like Google) and a priority_sort column to let the
-- admin control which reviews appear first on the public site.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS priority_sort int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS reviews_public_sort_idx
  ON reviews (is_public, priority_sort DESC, created_at DESC);
