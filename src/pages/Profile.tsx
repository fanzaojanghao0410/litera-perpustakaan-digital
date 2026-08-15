import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, PenLine, Settings as SettingsIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/FollowButton';
import { EmptyState } from '@/components/ui/states';
import { useAuth } from '@/hooks/useAuth';
import {
  useAuthorBooks,
  useEnsureProfile,
  useFollowStats,
  useProfile,
} from '@/hooks/useSocial';

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="min-w-[76px] text-center">
      <p className="font-heading text-base font-bold text-foreground md:text-lg">{value}</p>
      <p className="text-[11px] text-muted-foreground md:text-xs">{label}</p>
    </div>
  );
}

export default function Profile() {
  useEnsureProfile();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const targetId = id || user?.id;
  const isSelf = !!targetId && targetId === user?.id;

  const { data: profile, isLoading } = useProfile(targetId);
  const { data: stats } = useFollowStats(targetId);
  const { data: books = [], isLoading: booksLoading } = useAuthorBooks(targetId, isSelf);

  if (!targetId) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Belum masuk"
          description="Masuk untuk melihat profil dan karya kamu."
          action={
            <Button className="apple-button rounded-full px-5" onClick={() => navigate('/login')}>
              Masuk
            </Button>
          }
        />
      </div>
    );
  }

  const name =
    profile?.full_name ||
    profile?.username ||
    (isSelf ? (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] : null) ||
    'Pembaca';
  const username = profile?.username || targetId.slice(0, 8);

  const totalReads = books.reduce((s, b: any) => s + (b.total_reads || 0), 0);
  const published = books.filter((b: any) => b.status === 'published');
  const ranked = [...books].sort((a: any, b: any) => (b.total_reads || 0) - (a.total_reads || 0));

  return (
    <div className="pb-10">
      {/* Banner */}
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-muted md:h-44">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt=""
            aria-hidden
            className="h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
        )}
      </div>

      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        <div className="-mt-10 flex flex-col items-center text-center md:-mt-14 md:flex-row md:items-end md:gap-5 md:text-left">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`Foto profil ${name}`}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-background md:h-28 md:w-28"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 font-heading text-xl font-bold text-primary ring-4 ring-background md:h-28 md:w-28 md:text-2xl">
              {initials(name)}
            </div>
          )}

          <div className="mt-2 min-w-0 flex-1 md:mt-0 md:pb-2">
            <h1 className="truncate font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {isLoading ? 'Memuat...' : name}
            </h1>
            <p className="truncate text-sm text-muted-foreground">@{username}</p>
          </div>

          <div className="mt-3 flex items-center gap-2 md:mt-0 md:pb-2">
            {isSelf ? (
              <>
                <Link to="/settings">
                  <Button variant="outline" className="h-9 gap-2 rounded-full px-4 text-sm">
                    <SettingsIcon className="h-4 w-4" /> Edit profil
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button className="apple-button h-9 gap-2 rounded-full px-4 text-sm">
                    <PenLine className="h-4 w-4" /> Kelola karya
                  </Button>
                </Link>
              </>
            ) : (
              <FollowButton targetId={targetId} />
            )}
          </div>
        </div>

        {profile?.bio && (
          <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground md:text-left">
            {profile.bio}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 md:justify-start md:gap-6 md:px-6">
          <Stat value={published.length} label="Karya" />
          <span aria-hidden className="h-8 w-px bg-border" />
          <Stat value={(stats?.followers ?? 0).toLocaleString('id-ID')} label="Pengikut" />
          <span aria-hidden className="h-8 w-px bg-border" />
          <Stat value={(stats?.following ?? 0).toLocaleString('id-ID')} label="Mengikuti" />
          <span aria-hidden className="h-8 w-px bg-border" />
          <Stat value={totalReads.toLocaleString('id-ID')} label="Pembaca" />
        </div>

        {/* Karya */}
        <h2 className="mt-7 font-heading text-base font-bold tracking-tight text-foreground md:text-lg">
          {isSelf ? 'Karya saya' : `Karya ${name}`}
        </h2>

        {booksLoading ? (
          <ul className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-[104px] animate-pulse rounded-xl bg-muted" />
            ))}
          </ul>
        ) : books.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="Belum ada karya"
            description={isSelf ? 'Mulai tulis karya pertamamu di Litera.' : 'Akun ini belum menerbitkan karya.'}
            action={
              isSelf ? (
                <Link to="/dashboard">
                  <Button className="apple-button rounded-full px-5">Mulai menulis</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {books.map((b: any) => {
              const rank = ranked.findIndex((r: any) => r.id === b.id) + 1;
              return (
                <li key={b.id}>
                  <Link
                    to={`/book/${b.id}`}
                    className="flex gap-3 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md"
                  >
                    <img
                      src={b.cover_url || '/placeholder.png'}
                      alt={`Sampul ${b.title}`}
                      loading="lazy"
                      decoding="async"
                      className="h-[104px] w-[78px] shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="line-clamp-2 flex-1 text-sm font-semibold leading-tight text-foreground">
                          {b.title}
                        </p>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          #{rank}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.synopsis}</p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {(b.total_reads || 0).toLocaleString('id-ID')} pembaca
                        {b.status !== 'published' && ' · draf'}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
