-- Ensure is_free column exists in chapters table
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- Ensure status column exists
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- Ensure word_count column exists
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

-- Ensure views column exists
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Ensure likes column exists
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Update existing chapters to have default values
UPDATE chapters SET is_free = false WHERE is_free IS NULL;
UPDATE chapters SET status = 'draft' WHERE status IS NULL;
UPDATE chapters SET word_count = 0 WHERE word_count IS NULL;
UPDATE chapters SET views = 0 WHERE views IS NULL;
UPDATE chapters SET likes = 0 WHERE likes IS NULL;
