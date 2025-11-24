import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Cursos", href: "/cursos" },
  { label: "Mis Cursos", href: "/mis-cursos" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Noticias", href: "/noticias" },
  { label: "FAQ", href: "/faq" },
  { label: "Contacto", href: "#contacto" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    
    // Si es el enlace de contacto
    if (href === "#contacto") {
      // Si ya estamos en la página principal, solo hacer scroll
      if (location.pathname === "/") {
        const element = document.getElementById("contacto");
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        // Si estamos en otra página, navegar a home y luego hacer scroll
        navigate("/");
        setTimeout(() => {
          const element = document.getElementById("contacto");
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else if (href.startsWith("#")) {
      // Para otros enlaces con hash, navegar primero a home
      if (location.pathname !== "/") {
        navigate("/");
      }
      setTimeout(() => {
        const element = document.getElementById(href.substring(1));
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      // Para enlaces normales, usar navigate
      navigate(href);
    }
  };

  return (
    <nav className="bg-serene-primary shadow-lg sticky top-[64px] sm:top-[70px] md:top-[76px] z-40 border-b border-serene-accent/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-14">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/20"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-4 lg:gap-8 w-full justify-center">
            {navItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => handleNavClick(item.href)}
                  className="text-white font-semibold text-xs lg:text-sm uppercase tracking-wider hover:text-serene-accent transition-smooth relative group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-serene-accent group-hover:w-full transition-all duration-300 shadow-glow" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 pt-2">
            <ul className="flex flex-col gap-2 sm:gap-3">
              {navItems.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className="block text-white font-semibold text-sm uppercase tracking-wider hover:text-serene-accent transition-smooth py-2 w-full text-left pl-2"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};
