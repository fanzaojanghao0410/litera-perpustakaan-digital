import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Home, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [isLoading, setIsLoading] = useState(true);
  const [bookTitle, setBookTitle] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        const { data, error } = await supabase
          .from('orders' as any)
          .select('*')
          .eq('midtrans_order_id', orderId)
          .single();

        if (data && !error) {
          // Fetch book details separately
          const { data: bookData } = await supabase
            .from('books' as any)
            .select('title')
            .eq('id', (data as any).book_id)
          .single();
          
          setBookTitle((bookData as any)?.title || 'Buku');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Pembayaran Berhasil!</h1>
        <p className="text-muted-foreground mb-6">
          {isLoading ? 'Memuat detail...' : `Anda telah berhasil membeli "${bookTitle}"`}
        </p>

        <div className="glass-card p-4 mb-6 text-left">
          <p className="text-sm text-muted-foreground mb-1">Order ID</p>
          <p className="font-mono text-sm font-medium">{orderId || '-'}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/catalog">
            <Button className="w-full gap-2 button-success">
              <BookOpen className="h-4 w-4" /> Baca Buku
            </Button>
          </Link>
          <Link to="/">
            <Button className="w-full gap-2 glass-button-outline">
              <Home className="h-4 w-4" /> Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
