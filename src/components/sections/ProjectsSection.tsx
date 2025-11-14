import { Card, CardContent } from "@/components/ui/card";

const projects = [
  {
    title: "Proyecto 1",
    description: "Desarrollo de un robot doméstico con inteligencia ambiental.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop",
  },
  {
    title: "Proyecto 2",
    description: "Automatización inteligente de invernaderos.",
    image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&h=600&fit=crop",
  },
  {
    title: "Proyecto 3",
    description: "Aplicación IoT para monitoreo de energía y eficiencia eléctrica.",
    image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&h=600&fit=crop",
  },
];

export const ProjectsSection = () => {
  return (
    <section id="proyectos" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Proyectos Destacados
          </h2>
          <p className="text-lg text-muted-foreground">
            Explora algunos de los proyectos desarrollados por Serene
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card
              key={index}
              className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-serene-accent mb-2 group-hover:text-serene-secondary transition-colors">
                  {project.title}
                </h3>
                <p className="text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
