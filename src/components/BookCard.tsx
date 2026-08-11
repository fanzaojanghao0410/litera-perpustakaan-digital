import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Star } from 'lucide-react';
import type { Book } from '@/data/books';
import { useAuth } from '@/hooks/useAuth';
import { useAddFavorite, useRemoveFavorite, useIsFavorite } from '@/hooks/useBooks';

interface BookCardProps {
  book: Book;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

function BookCardBase({ book }: BookCardProps) {
  const { user } = useAuth();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { data: isFavorite } = useIsFavorite(user?.id, book.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (isFavorite) removeFavorite.mutate({ userId: user.id, bookId: book.id });
    else addFavorite.mutate({ userId: user.id, bookId: book.id });
  };

  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex flex-col rounded-xl outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
    >
      {/* Cover — rasio 3:4 dengan smart crop */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-border transition-shadow duration-200 group-hover:shadow-md">
        <img
          src={book.cover || '/logo_litera.png'}
          alt={`Sampul buku ${book.title}`}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />

        {/* Gradasi bawah untuk keterbacaan meta */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        {book.is_free ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-accent-foreground shadow-sm">
            Gratis
          </span>
        ) : (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-primary/90 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground shadow-sm">
            {formatPrice(book.price)}
          </span>
        )}

        {user && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-pressed={!!isFavorite}
            aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}
            className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-card/90 text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-destructive"
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="px-0.5 pt-1.5">
        <h3 className="font-heading text-[13px] font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-primary">
          {book.title}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{book.author_name}</p>

        <div className="mt-1 flex items-center gap-2.5 text-[10px] text-muted-foreground">
          {(book.total_reads ?? 0) > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Eye className="h-3 w-3" aria-hidden />
              {formatNumber(book.total_reads || 0)}
            </span>
          )}
          {(book.rating_avg ?? 0) > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
              {book.rating_avg.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export const BookCard = memo(BookCardBase);
