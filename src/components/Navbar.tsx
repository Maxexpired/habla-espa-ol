import { useState } from "react";
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

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-serene-primary shadow-md sticky top-[72px] z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-14">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-8 w-full justify-center">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-white font-semibold text-sm uppercase tracking-wide hover:text-accent transition-colors relative group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-white group-hover:w-6 transition-all duration-300" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <ul className="flex flex-col gap-3">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={handleNavClick}
                    className="block text-white font-semibold text-sm uppercase tracking-wide hover:text-accent transition-colors py-2"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};
