import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="glass-nav border-t border-[#4DA1A9]/20 px-6 py-12 mt-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-4 mb-5">
              <img src="/logo_litera.png" alt="Litera" className="h-20 w-20 object-contain" />
              <span className="font-heading text-2xl font-bold text-[#2E5077]">Litera</span>
            </Link>
            <p className="text-sm text-[#4a7a9e] leading-relaxed max-w-[280px]">
              Platform perpustakaan digital modern untuk akses buku dari mana saja.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold text-[#2E5077] mb-4">Jelajahi</h4>
            <div className="flex flex-col gap-3">
              <Link to="/catalog" className="text-sm text-[#4a7a9e] hover:text-[#2E5077] transition-colors">Katalog Buku</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold text-[#2E5077] mb-4">Fitur</h4>
            <div className="flex flex-col gap-3">
              <Link to="/upload" className="text-sm text-[#4a7a9e] hover:text-[#2E5077] transition-colors">Upload Buku</Link>
              <Link to="/dashboard" className="text-sm text-[#4a7a9e] hover:text-[#2E5077] transition-colors">Dashboard</Link>
              <Link to="/admin/books" className="text-sm text-[#4a7a9e] hover:text-[#2E5077] transition-colors">Manajemen Buku</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold text-[#2E5077] mb-4">Tentang</h4>
            <div className="flex flex-col gap-3">
              <span className="text-sm text-[#4a7a9e]">Tentang Kami</span>
              <span className="text-sm text-[#4a7a9e]">Kontak</span>
              <span className="text-sm text-[#4a7a9e]">Kebijakan Privasi</span>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-[#4DA1A9]/20 text-center">
          <p className="text-sm text-[#4a7a9e]">© 2026 Litera. Platform perpustakaan digital Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}
