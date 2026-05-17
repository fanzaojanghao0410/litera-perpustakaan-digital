import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PurchaseBookResponse {
  snap_token: string;
  client_key: string;
  order_id: string;
  order_id_db: string;
}

export function usePurchaseBook() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchaseBook = async (bookId: string) => {
    if (!user) {
      setError('You must be logged in to purchase a book');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke<PurchaseBookResponse>(
        'create-transaction',
        {
          body: {
            book_id: bookId,
            user_id: user.id,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkPurchased = async (bookId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('purchased_books' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - book not purchased
          return false;
        }
        throw error;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking purchased status:', err);
      return false;
    }
  };

  return {
    purchaseBook,
    checkPurchased,
    isLoading,
    error,
  };
}
