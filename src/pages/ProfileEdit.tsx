import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useEnsureProfile } from '@/hooks/useSocial';
import { supabase } from '@/integrations/supabase/client';
import { uploadAvatar } from '@/integrations/supabase/storage';

const db = supabase as any;
const MAX_BIO = 280;

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function ProfileEdit() {
  useEnsureProfile();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useProfile(user?.id);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    setUsername(profile.username || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || null);
  }, [profile]);

  if (!authLoading && !user) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-heading text-xl font-bold text-foreground">Masuk dulu</h1>
        <p className="mt-2 text-sm text-muted-foreground">Kamu perlu masuk untuk mengedit profil.</p>
        <Link to="/login">
          <Button className="mt-5">Masuk</Button>
        </Link>
      </div>
    );
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) return toast.error('File harus berupa gambar');
    if (file.size > 3 * 1024 * 1024) return toast.error('Ukuran maksimal 3 MB');

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      setAvatarUrl(`${url}?v=${Date.now()}`);
      toast.success('Foto profil diunggah');
    } catch (err: any) {
      setPreview(null);
      toast.error(err.message || 'Gagal mengunggah foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const uname = username.trim().toLowerCase();
    if (uname && !/^[a-z0-9._]{3,20}$/.test(uname)) {
      toast.error('Username 3–20 karakter, hanya huruf, angka, titik, dan garis bawah');
      return;
    }

    setSaving(true);
    try {
      if (uname && uname !== (profile?.username || '')) {
        const { data: taken } = await db
          .from('profiles')
          .select('id')
          .eq('username', uname)
          .neq('id', user.id)
          .maybeSingle();
        if (taken) {
          toast.error('Username sudah dipakai akun lain');
          setSaving(false);
          return;
        }
      }

      const payload = {
        id: user.id,
        full_name: fullName.trim() || null,
        username: uname || null,
        bio: bio.trim().slice(0, MAX_BIO) || null,
        avatar_url: avatarUrl,
      };

      const { error } = await db.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      await supabase.auth.updateUser({
        data: { full_name: payload.full_name, avatar_url: payload.avatar_url },
      });

      qc.invalidateQueries({ queryKey: ['profile', user.id] });
      qc.invalidateQueries({ queryKey: ['profiles-search'] });
      toast.success('Profil berhasil diperbarui');
      navigate('/profile');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const shown = preview || avatarUrl;
  const name = fullName || username || 'Pembaca';

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 md:py-10">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Kembali">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Edit profil
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            Perbarui foto, nama, username, dan bio kamu.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-4 md:p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              {shown ? (
                <img
                  src={shown}
                  alt={`Foto profil ${name}`}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full bg-primary/10 font-heading text-2xl font-bold text-primary ring-2 ring-border">
                  {initials(name)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Ubah foto profil"
                className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatar}
              />
            </div>

            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-foreground">Foto profil</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Format JPG atau PNG, maksimal 3 MB. Gambar persegi terlihat paling rapi.
              </p>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setAvatarUrl(null);
                    setPreview(null);
                  }}
                >
                  Hapus foto
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama tampilan</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama kamu"
              maxLength={60}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                maxLength={20}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3–20 karakter. Hanya huruf kecil, angka, titik, dan garis bawah.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
              rows={4}
              placeholder="Ceritakan sedikit tentang kamu dan karyamu..."
              disabled={isLoading}
            />
            <p className="text-right text-xs text-muted-foreground">
              {bio.length}/{MAX_BIO}
            </p>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
            Batal
          </Button>
          <Button type="submit" variant="success" disabled={saving || uploading} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
