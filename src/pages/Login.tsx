import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error('Gagal masuk', { description: error.message });
    } else {
      toast.success('Berhasil masuk!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 px-4 py-12">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#2E5077] to-[#4DA1A9] bg-clip-text text-transparent">
              Selamat Datang Kembali
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Masuk ke akun Litera Anda untuk melanjutkan perjalanan membaca
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#4DA1A9]/10 dark:bg-[#4DA1A9]/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#2E5077] dark:text-[#4DA1A9]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Email</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Gunakan email Anda yang terdaftar</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#4DA1A9]/10 dark:bg-[#4DA1A9]/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#2E5077] dark:text-[#4DA1A9]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Aman</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Data Anda dilindungi dengan enkripsi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 lg:p-12 border border-slate-200 dark:border-slate-700">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Masuk</h2>
            <p className="text-slate-600 dark:text-slate-400">Silakan masukkan detail akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-slate-300 dark:border-slate-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Kata Sandi</Label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-slate-300 dark:border-slate-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-password-toggle"
                >
                  {showPassword ? (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l-3.29-3.29" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="apple-button w-full h-12 font-semibold"
              disabled={loading}
            >
              {loading ? (
                'Memproses...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Masuk
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Belum punya akun?{' '}
              <Link to="/register" className="text-[#4DA1A9] hover:text-[#2E5077] font-semibold">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
