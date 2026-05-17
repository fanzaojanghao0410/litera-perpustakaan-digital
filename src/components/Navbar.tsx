import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Home, Search, MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

const navLinks = [
  { label: 'Beranda', to: '/', icon: Home },
  { label: 'Cari Buku', to: '/catalog', icon: Search },
  { label: 'Chat', to: '/community', icon: MessageCircle, requiresAuth: true },
  { label: 'Favorit', to: '/favorites', icon: Heart, requiresAuth: true },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="glass-nav px-6 sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo_litera.png" alt="Litera" className="h-8 w-8 object-contain" />
          <span className="font-heading text-xl font-bold text-[#2E5077]">Litera</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            if (link.requiresAuth && !user) return null;
            const Icon = link.icon;
            const active = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  active ? 'text-[#2E5077]' : 'text-[#4a7a9e] hover:text-[#2E5077]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="glass-button-outline h-9 gap-2">
                    <User className="h-4 w-4" /> {user.user_metadata?.full_name || 'Akun'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Pengaturan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/register">
                <Button className="apple-button h-9 px-6 font-medium">
                  Daftar
                </Button>
              </Link>
            )
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-[#4a7a9e] hover:text-[#2E5077]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#4DA1A9]/20 bg-white px-4 py-4 space-y-1">
          {navLinks.map((link) => {
            if (link.requiresAuth && !user) return null;
            const Icon = link.icon;
            const active = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-[#4DA1A9]/10 text-[#2E5077]' : 'text-[#4a7a9e] hover:text-[#2E5077] hover:bg-[#4DA1A9]/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          {user && (
            <>
              <Link to="/dashboard" className="block px-4 py-3 text-sm font-medium text-[#4a7a9e] hover:text-[#2E5077]" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link to="/settings" className="block px-4 py-3 text-sm font-medium text-[#4a7a9e] hover:text-[#2E5077]" onClick={() => setMobileOpen(false)}>Pengaturan</Link>
            </>
          )}
          <div className="pt-3 border-t border-[#4DA1A9]/20 mt-3">
            {user ? (
              <Button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="button-destructive w-full">
                Keluar
              </Button>
            ) : (
              <Link to="/login">
                <Button className="apple-button w-full">
                  Masuk
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
