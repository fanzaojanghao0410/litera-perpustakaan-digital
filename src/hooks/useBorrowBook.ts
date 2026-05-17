import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useBorrowBook() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const borrowBook = async (bookId: string, borrowDays: number) => {
    if (!user) {
      setError('You must be logged in to borrow a book');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + borrowDays);

      const { data, error: insertError } = await supabase
        .from('borrowings' as any)
        .insert({
          user_id: user.id,
          book_id: bookId,
          due_at: dueDate.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to borrow book';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkBorrowed = async (bookId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('borrowings' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        throw error;
      }

      // Check if due date has passed
      if (data) {
        const dueDate = new Date((data as any).due_at);
        const now = new Date();
        if (now > dueDate) {
          // Update status to overdue
          await supabase
            .from('borrowings' as any)
            .update({ status: 'overdue' })
            .eq('id', (data as any).id);
          return false;
        }
      }

      return !!data;
    } catch (err) {
      console.error('Error checking borrowed status:', err);
      return false;
    }
  };

  const getBorrowingInfo = async (bookId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('borrowings' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error getting borrowing info:', err);
      return null;
    }
  };

  return {
    borrowBook,
    checkBorrowed,
    getBorrowingInfo,
    isLoading,
    error,
  };
}
