import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, Heart, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
  { label: 'Beranda', to: '/', icon: Home },
  { label: 'Cari', to: '/catalog', icon: Search },
  { label: 'Chat', to: '/community', icon: MessageCircle, requiresAuth: true },
  { label: 'Favorit', to: '/favorites', icon: Heart, requiresAuth: true },
];

export function MobileTabBar() {
  const location = useLocation();
  const { user } = useAuth();

  const items = [
    ...tabs.filter((t) => !t.requiresAuth || user),
    user
      ? { label: 'Akun', to: '/dashboard', icon: User }
      : { label: 'Masuk', to: '/login', icon: User },
  ];

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {items.map(({ label, to, icon: Icon }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.4]' : ''}`} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
