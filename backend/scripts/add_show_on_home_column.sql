-- Run once on existing databases (e.g. Supabase SQL editor) if categories already exist without this column.
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT true;
