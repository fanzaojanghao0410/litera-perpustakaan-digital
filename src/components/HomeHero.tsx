import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '@/data/books';

interface HomeHeroProps {
  books: Book[];
  isLoading?: boolean;
}

/**
 * Hero editorial ala aplikasi baca: satu karya unggulan bergantian otomatis,
 * dengan latar sampul yang di-blur agar terasa sinematik namun tetap ringan.
 */
export function HomeHero({ books, isLoading }: HomeHeroProps) {
  const slides = books.slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (isLoading) {
    return (
      <div className="px-4 md:px-6">
        <div className="h-[210px] w-full animate-pulse rounded-2xl bg-muted md:h-[260px]" />
      </div>
    );
  }

  if (slides.length === 0) return null;
  const book = slides[Math.min(index, slides.length - 1)];

  return (
    <div className="px-4 md:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-xl"
          style={{ backgroundImage: `url(${book.cover || '/logo_litera.png'})` }}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />

        <div className="relative flex items-center gap-4 p-4 md:gap-7 md:p-7">
          <Link to={`/book/${book.id}`} className="shrink-0">
            <img
              src={book.cover || '/logo_litera.png'}
              alt={`Sampul ${book.title}`}
              className="h-[150px] w-[112px] rounded-xl object-cover shadow-lg ring-1 ring-border md:h-[200px] md:w-[150px]"
              loading="eager"
              decoding="async"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Sorotan Litera
            </p>
            <h2 className="mt-1.5 line-clamp-2 font-heading text-xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
              {book.title}
            </h2>
            <p className="mt-1 truncate text-xs text-muted-foreground md:text-sm">
              oleh {book.author_name}
            </p>
            <p className="mt-2 hidden line-clamp-3 text-sm leading-relaxed text-muted-foreground md:block">
              {book.synopsis}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-4">
              <Link
                to={`/read/${book.id}`}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:text-sm"
              >
                Baca sekarang
              </Link>
              <Link
                to={`/book/${book.id}`}
                className="rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted md:text-sm"
              >
                Detail
              </Link>
            </div>

            {slides.length > 1 && (
              <div className="mt-3 flex items-center gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Tampilkan sorotan ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-6 bg-primary' : 'w-1.5 bg-border'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
