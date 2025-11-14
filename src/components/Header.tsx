import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Header = () => {
  return (
    <header className="bg-serene-secondary sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-white uppercase tracking-tight">
              <a href="/" className="hover:opacity-90 transition-opacity">
                Serene
              </a>
            </h1>
          </div>

          {/* Search Bar */}
          <form className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Buscar..."
                className="bg-white/90 border-0 pr-10 focus-visible:ring-serene-primary"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full hover:bg-transparent"
              >
                <Search className="h-5 w-5 text-serene-primary" />
              </Button>
            </div>
          </form>

          {/* User Icon */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <User className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
