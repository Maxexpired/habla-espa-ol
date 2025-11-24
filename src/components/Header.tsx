import { Search, User, LogOut, Shield, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import sereneLogo from "@/assets/serene-logo.png";

export const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="gradient-hero sticky top-0 z-50 shadow-elegant border-b border-serene-accent/20 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center transition-transform duration-300 hover:scale-105">
              <img 
                src={sereneLogo} 
                alt="Serene Logo" 
                className="h-12 sm:h-14 md:h-16 w-auto drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              />
            </a>
          </div>

          {/* Search Bar */}
          <form className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-6 xl:mx-8">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Buscar..."
                className="glass-effect border-white/20 text-white placeholder:text-white/60 pr-10 focus-visible:ring-serene-accent focus-visible:border-serene-accent transition-smooth"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full hover:bg-transparent"
              >
                <Search className="h-5 w-5 text-serene-accent" />
              </Button>
            </div>
          </form>

          {/* User Menu */}
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 transition-smooth"
                  >
                    <User className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass-effect backdrop-blur-lg border-white/20">
                  <DropdownMenuItem onClick={() => navigate("/perfil")}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="button-hover shadow-glow"
                onClick={() => navigate("/auth")}
              >
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
