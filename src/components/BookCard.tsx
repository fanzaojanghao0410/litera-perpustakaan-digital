import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Eye, Star } from 'lucide-react';
import type { Book } from '@/data/books';
import { useAuth } from '@/hooks/useAuth';
import { useAddFavorite, useRemoveFavorite, useIsFavorite } from '@/hooks/useBooks';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const { user } = useAuth();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { data: isFavorite } = useIsFavorite(user?.id, book.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    if (isFavorite) {
      removeFavorite.mutate({ userId: user.id, bookId: book.id });
    } else {
      addFavorite.mutate({ userId: user.id, bookId: book.id });
    }
  };

  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex flex-col overflow-hidden bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        <img
          src={book.cover || '/logo_litera.png'}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {book.is_free && (
          <Badge className="absolute left-1.5 top-1.5 bg-green-600 text-white text-[10px] px-1.5 py-0 rounded-full border-0 h-4">Gratis</Badge>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute right-1.5 top-1.5 p-1 rounded-full bg-white/90 hover:bg-white shadow-sm border border-slate-200 transition-all"
          aria-label="Favorit"
        >
          <Heart className={`h-3 w-3 ${isFavorite ? 'fill-pink-500 text-pink-500' : 'text-slate-600'}`} />
        </button>
      </div>

      {/* Info - compact */}
      <div className="flex flex-1 flex-col p-2">
        <h3 className="font-heading text-[13px] font-semibold text-slate-900 line-clamp-2 leading-tight group-hover:text-slate-700 transition-colors">{book.title}</h3>
        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">{book.author_name}</p>

        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
          {(book.total_reads ?? 0) > 0 && (
            <div className="flex items-center gap-0.5">
              <Eye className="h-2.5 w-2.5" />
              <span>{formatNumber(book.total_reads || 0)}</span>
            </div>
          )}
          {(book.rating_avg ?? 0) > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span>{book.rating_avg.toFixed(1)}</span>
            </div>
          )}
          {!book.is_free && (
            <span className="ml-auto text-[10px] font-semibold text-[#2E5077]">{formatPrice(book.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
