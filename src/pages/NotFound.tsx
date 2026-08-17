import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <p className="font-heading text-6xl font-bold text-primary md:text-7xl">404</p>

        <h1 className="mt-4 font-heading text-2xl font-bold text-foreground md:text-3xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Maaf, halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link to="/" className="flex-1">
            <Button className="w-full gap-2">
              <Home className="h-4 w-4" /> Beranda
            </Button>
          </Link>
          <Link to="/catalog" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Search className="h-4 w-4" /> Jelajahi katalog
            </Button>
          </Link>
        </div>

        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mt-2.5 w-full gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke halaman sebelumnya
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
