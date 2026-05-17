import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="text-center max-w-lg">
        {/* 404 Number */}
        <h1 className="font-heading text-8xl md:text-9xl font-bold text-foreground mb-6">
          404
        </h1>

        {/* Message */}
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-muted-foreground text-base md:text-lg mb-8">
          Maaf, halaman yang Anda cari tidak tersedia.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link to="/" className="flex-1">
            <Button className="w-full gap-2 h-10 px-6 button-success">
              <Home className="h-4 w-4" /> Kembali ke Beranda
            </Button>
          </Link>
          <Link to="/catalog" className="flex-1">
            <Button className="w-full gap-2 h-10 px-6 glass-button-outline">
              <Search className="h-4 w-4" /> Jelajahi Katalog
            </Button>
          </Link>
        </div>

        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="w-full h-10 glass-button-outline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke halaman sebelumnya
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
