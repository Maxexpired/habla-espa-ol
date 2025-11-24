export const Footer = () => {
  return (
    <footer className="bg-serene-dark text-white py-12 md:py-16 border-t border-serene-accent/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-display font-bold mb-2 text-gradient">Serene</h3>
            <p className="text-muted-foreground text-sm sm:text-base">Innovación tecnológica para el futuro</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <a href="#cursos" className="text-muted-foreground hover:text-serene-accent transition-smooth font-medium">
              Cursos
            </a>
            <a href="#proyectos" className="text-muted-foreground hover:text-serene-accent transition-smooth font-medium">
              Proyectos
            </a>
            <a href="#noticias" className="text-muted-foreground hover:text-serene-accent transition-smooth font-medium">
              Noticias
            </a>
            <a href="#contacto" className="text-muted-foreground hover:text-serene-accent transition-smooth font-medium">
              Contacto
            </a>
          </div>
        </div>

        <div className="border-t border-serene-accent/20 mt-8 pt-6 text-center">
          <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} Serene. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
