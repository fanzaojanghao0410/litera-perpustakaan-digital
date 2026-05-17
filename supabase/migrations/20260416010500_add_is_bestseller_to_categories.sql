-- Add is_bestseller column to categories table
-- Migration: 20260416010500_add_is_bestseller_to_categories.sql

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;

-- Mark main categories as bestseller
UPDATE public.categories SET is_bestseller = true WHERE slug IN (
  'fiksi',
  'nonfiksi',
  'buku-akademik',
  'buku-anak',
  'komik',
  'buku-agama',
  'buku-referensi',
  'buku-hobi',
  'buku-profesional',
  'buku-sastra',
  'buku-populer',
  'fantasi',
  'romance',
  'thriller',
  'horor',
  'misteri',
  'biografi',
  'sejarah',
  'buku-bisnis',
  'teknologi',
  'self-help',
  'motivasi-populer',
  'kuliner',
  'travel',
  'kesehatan',
  'parenting',
  'pendidikan',
  'agama',
  'spiritualitas',
  'novel',
  'cerpen',
  'puisi',
  'manga',
  'komik-humor',
  'bestseller',
  'inspirasi',
  'humor'
);
