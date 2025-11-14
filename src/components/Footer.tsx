export const Footer = () => {
  return (
    <footer className="bg-serene-dark text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">Serene</h3>
            <p className="text-gray-400">Innovación tecnológica para el futuro</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <a href="#cursos" className="text-gray-400 hover:text-serene-accent transition-colors">
              Cursos
            </a>
            <a href="#proyectos" className="text-gray-400 hover:text-serene-accent transition-colors">
              Proyectos
            </a>
            <a href="#noticias" className="text-gray-400 hover:text-serene-accent transition-colors">
              Noticias
            </a>
            <a href="#contacto" className="text-gray-400 hover:text-serene-accent transition-colors">
              Contacto
            </a>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Serene. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
