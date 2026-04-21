-- Add a separate product title field and backfill existing rows.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS title varchar(220);

UPDATE products
SET title = COALESCE(NULLIF(TRIM(description), ''), name)
WHERE title IS NULL OR TRIM(title) = '';
