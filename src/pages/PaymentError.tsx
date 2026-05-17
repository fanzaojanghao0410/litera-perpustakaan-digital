import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentError() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Pembayaran Gagal</h1>
        <p className="text-muted-foreground mb-6">
          Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi atau gunakan metode pembayaran lain.
        </p>

        <div className="glass-card p-4 mb-6 text-left">
          <p className="text-sm text-muted-foreground mb-1">Order ID</p>
          <p className="font-mono text-sm font-medium">{orderId || '-'}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link to={`/book/${searchParams.get('book_id')}`}>
            <Button className="w-full gap-2 button-success">
              <RefreshCw className="h-4 w-4" /> Coba Lagi
            </Button>
          </Link>
          <Link to="/catalog">
            <Button className="w-full gap-2 glass-button-outline">
              <Home className="h-4 w-4" /> Kembali ke Katalog
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
