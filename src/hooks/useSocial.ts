import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string | null;
}

const db = supabase as any;

/** Pastikan baris profil untuk user yang sedang login tersedia. */
export function useEnsureProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await db.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (cancelled || data) return;
      const meta = (user.user_metadata || {}) as Record<string, string>;
      await db.from('profiles').insert({
        id: user.id,
        full_name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Pembaca',
        username: (user.email?.split('@')[0] || `user${user.id.slice(0, 6)}`).toLowerCase(),
        avatar_url: meta.avatar_url || null,
      });
      qc.invalidateQueries({ queryKey: ['profile', user.id] });
    })();
    return () => {
      cancelled = true;
    };
  }, [user, qc]);
}

export function useProfile(userId?: string) {
  return useQuery<Profile | null>({
    queryKey: ['profile', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
      return (data as Profile) ?? null;
    },
  });
}

export function useSearchProfiles(term: string) {
  const q = term.trim();
  return useQuery<Profile[]>({
    queryKey: ['profiles-search', q],
    staleTime: 30_000,
    queryFn: async () => {
      let query = db.from('profiles').select('*').limit(30);
      if (q) query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
      const { data } = await query;
      return (data as Profile[]) || [];
    },
  });
}

export interface FollowStats {
  followers: number;
  following: number;
}

export function useFollowStats(userId?: string) {
  return useQuery<FollowStats>({
    queryKey: ['follow-stats', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const [f1, f2] = await Promise.all([
        db.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        db.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);
      return { followers: f1.count || 0, following: f2.count || 0 };
    },
  });
}

/** Daftar id akun yang diikuti user login — satu query untuk semua tombol follow. */
export function useFollowingIds() {
  const { user } = useAuth();
  return useQuery<string[]>({
    queryKey: ['following-ids', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await db.from('user_follows').select('following_id').eq('follower_id', user!.id);
      return (data || []).map((r: any) => r.following_id as string);
    },
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetId, isFollowing }: { targetId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Silakan masuk terlebih dahulu');
      if (user.id === targetId) throw new Error('Tidak bisa mengikuti akun sendiri');

      if (isFollowing) {
        const { error } = await db
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetId);
        if (error) throw error;
      } else {
        const { error } = await db
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: targetId });
        if (error) throw error;
      }
      return !isFollowing;
    },
    onMutate: async ({ targetId, isFollowing }) => {
      await qc.cancelQueries({ queryKey: ['following-ids', user?.id] });
      const prev = qc.getQueryData<string[]>(['following-ids', user?.id]) || [];
      qc.setQueryData<string[]>(
        ['following-ids', user?.id],
        isFollowing ? prev.filter((id) => id !== targetId) : [...prev, targetId]
      );
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['following-ids', user?.id], ctx.prev);
      toast.error(err?.message || 'Gagal memperbarui status mengikuti');
    },
    onSuccess: (nowFollowing, { targetId }) => {
      toast.success(nowFollowing ? 'Mulai mengikuti' : 'Berhenti mengikuti');
      qc.invalidateQueries({ queryKey: ['follow-stats', targetId] });
      qc.invalidateQueries({ queryKey: ['follow-stats', user?.id] });
    },
  });
}

export interface AuthorBook {
  id: string;
  title: string;
  cover_url: string | null;
  synopsis: string | null;
  status: string;
  total_reads: number;
  total_chapters: number;
  created_at: string;
}

export function useAuthorBooks(userId?: string, includeDrafts = false) {
  return useQuery<AuthorBook[]>({
    queryKey: ['author-books', userId, includeDrafts],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      let query = db
        .from('books')
        .select('id, title, cover_url, synopsis, status, total_reads, total_chapters, created_at')
        .eq('uploader_id', userId)
        .order('created_at', { ascending: false });
      if (!includeDrafts) query = query.eq('status', 'published');
      const { data } = await query;
      return (data as AuthorBook[]) || [];
    },
  });
}
