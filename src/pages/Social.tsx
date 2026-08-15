import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

import { FollowButton } from '@/components/FollowButton';
import { EmptyState } from '@/components/ui/states';
import { useAuth } from '@/hooks/useAuth';
import { useEnsureProfile, useSearchProfiles, type Profile } from '@/hooks/useSocial';

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function Avatar({ profile, size = 44 }: { profile: Profile; size?: number }) {
  const name = profile.full_name || profile.username || 'Pembaca';
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={`Foto profil ${name}`}
        loading="lazy"
        decoding="async"
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary ring-1 ring-border"
    >
      {initials(name)}
    </div>
  );
}

export default function Social() {
  useEnsureProfile();
  const { user } = useAuth();
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(t);
  }, [term]);

  const { data: profiles = [], isLoading } = useSearchProfiles(debounced);
  const list = useMemo(() => profiles.filter((p) => p.id !== user?.id), [profiles, user?.id]);

  return (
    <div className="container mx-auto max-w-3xl px-4 pb-10 pt-4 md:px-6 md:pt-6">
      <h1 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
        Jelajahi Pembaca &amp; Penulis
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Temukan akun lain di Litera dan ikuti karya mereka.
      </p>

      <div className="sticky top-16 z-30 -mx-4 mt-4 bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-border bg-card px-4 focus-within:border-primary/50">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Cari nama atau username..."
            aria-label="Cari akun"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {isLoading ? (
        <ul className="mt-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-[68px] animate-pulse rounded-xl bg-muted" />
          ))}
        </ul>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Akun tidak ditemukan"
          description="Coba kata kunci lain, misalnya nama pena atau username."
        />
      ) : (
        <ul className="mt-3 space-y-2">
          {list.map((p) => (
            <li key={p.id}>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md">
                <Link to={`/profile/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar profile={p} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {p.full_name || p.username || 'Pembaca'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{p.username || p.id.slice(0, 8)}
                    </p>
                    {p.bio && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.bio}</p>
                    )}
                  </div>
                </Link>
                <FollowButton targetId={p.id} size="sm" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
