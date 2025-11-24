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

export const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-serene-primary via-serene-secondary to-serene-primary sticky top-0 z-50 shadow-lg border-b border-serene-accent/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight">
              <a href="/" className="hover:opacity-90 transition-opacity">
                Serene
              </a>
            </h1>
          </div>

          {/* Search Bar */}
          <form className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-6 xl:mx-8">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Buscar..."
                className="bg-white/95 border-0 pr-10 focus-visible:ring-serene-accent shadow-sm"
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
                <DropdownMenuContent align="end" className="w-48 bg-card">
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
                variant="ghost"
                className="text-white hover:bg-white/10 font-medium transition-smooth"
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
