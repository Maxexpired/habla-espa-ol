import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
}

export const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section id="proyectos" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">Cargando proyectos...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="proyectos" className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
            Proyectos Destacados
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Explora algunos de los proyectos desarrollados por Serene
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              onClick={() => navigate("/proyectos")}
            >
              {project.image_url && (
                <div className="relative overflow-hidden aspect-video">
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-serene-accent mb-2 group-hover:text-serene-secondary transition-colors">
                  {project.title}
                </h3>
                <p className="text-muted-foreground line-clamp-3">{project.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate("/proyectos")}
            className="group"
          >
            Ver todos los proyectos
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
