-- Add delete policy to allow authenticated users to delete books
-- Migration: 20260416011000_add_delete_policy_fix.sql

DROP POLICY IF EXISTS "Uploaders can delete own books" ON public.books;

CREATE POLICY "Uploaders can delete own books" ON public.books FOR DELETE USING (
  auth.uid() IS NOT NULL
);
