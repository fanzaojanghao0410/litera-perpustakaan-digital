import { ReactNode, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import { BookCardSkeleton } from '@/components/ui/states';
import type { Book } from '@/data/books';
import { cn } from '@/lib/utils';

interface BookCarouselProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  books: Book[];
  isLoading?: boolean;
  viewAllTo?: string;
  className?: string;
}

/**
 * Baris buku horizontal ala aplikasi baca.
 * Scroll-snap di mobile, tombol panah di desktop.
 */
export function BookCarousel({
  title,
  subtitle,
  icon,
  books,
  isLoading,
  viewAllTo,
  className,
}: BookCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  if (!isLoading && books.length === 0) return null;

  return (
    <section className={cn('mb-7 md:mb-9', className)}>
      <div className="mb-2.5 flex items-end justify-between gap-3 px-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 font-heading text-base font-bold tracking-tight text-foreground md:text-lg">
            {icon}
            <span className="truncate">{title}</span>
          </h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              Lihat semua
            </Link>
          )}
          <div className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              aria-label={`Geser ${title} ke kiri`}
              onClick={() => scrollBy(-1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Geser ${title} ke kanan`}
              onClick={() => scrollBy(1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1"
      >
        {(isLoading ? Array.from({ length: 8 }) : books).map((item, i) => (
          <div
            key={isLoading ? i : (item as Book).id}
            className="w-[104px] shrink-0 snap-start sm:w-[124px] md:w-[140px]"
          >
            {isLoading ? <BookCardSkeleton /> : <BookCard book={item as Book} />}
          </div>
        ))}
      </div>
    </section>
  );
}
