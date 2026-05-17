import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Bell, Shield, Palette, CreditCard, LogOut, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    newBooks: true,
    recommendations: false,
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          full_name: formData.name,
          phone: formData.phone,
        },
      });

      if (error) throw error;

      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="glass-card p-6 lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-foreground">{formData.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{formData.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium">
                <User className="h-4 w-4" /> Profil
              </Link>
              <Link to="/settings/notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-4 w-4" /> Notifikasi
              </Link>
              <Link to="/settings/security" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <Shield className="h-4 w-4" /> Keamanan
              </Link>
              <Link to="/settings/appearance" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <Palette className="h-4 w-4" /> Tampilan
              </Link>
              <Link to="/settings/billing" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <CreditCard className="h-4 w-4" /> Tagihan
              </Link>
            </nav>

            <div className="mt-6 pt-6 border-t border-white/10">
              <Button onClick={handleSignOut} className="button-destructive w-full justify-start gap-3">
                <LogOut className="h-4 w-4" /> Keluar
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-foreground">Profil</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nama Lengkap</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    className="glass-input h-10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masukkan email"
                    type="email"
                    className="glass-input h-10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nomor Telepon</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Masukkan nomor telepon"
                    type="tel"
                    className="glass-input h-10"
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={loading} className="w-full gap-2 button-success h-10 px-6">
                  <Save className="h-4 w-4" />
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-foreground">Notifikasi</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <h3 className="font-medium text-foreground">Notifikasi Email</h3>
                    <p className="text-sm text-muted-foreground">Terima update via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <h3 className="font-medium text-foreground">Notifikasi Push</h3>
                    <p className="text-sm text-muted-foreground">Terima notifikasi browser</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <h3 className="font-medium text-foreground">Buku Baru</h3>
                    <p className="text-sm text-muted-foreground">Notifikasi saat ada buku baru</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.newBooks}
                    onChange={(e) => setNotifications({ ...notifications, newBooks: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <h3 className="font-medium text-foreground">Rekomendasi</h3>
                    <p className="text-sm text-muted-foreground">Rekomendasi buku berdasarkan preferensi</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.recommendations}
                    onChange={(e) => setNotifications({ ...notifications, recommendations: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-foreground">Informasi Akun</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-muted-foreground">ID Pengguna</span>
                  <span className="font-mono text-foreground">{user?.id?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium text-foreground capitalize">{user?.user_metadata?.role || 'User'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-500">Aktif</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Terdaftar Sejak</span>
                  <span className="font-medium text-foreground">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
