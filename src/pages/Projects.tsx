import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Rocket } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-serene-primary">
            Nuestros Proyectos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre los proyectos innovadores que estamos desarrollando
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando proyectos...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay proyectos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col">
                {project.image_url && (
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="h-6 w-6 text-serene-primary" />
                    <CardTitle className="text-2xl">{project.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <CardDescription className="text-base leading-relaxed line-clamp-3 mb-4">
                    {project.description}
                  </CardDescription>
                  <Button 
                    onClick={() => setSelectedProject(project)}
                    className="mt-auto"
                  >
                    Ver detalles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de detalles del proyecto */}
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedProject && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-3xl flex items-center gap-3">
                    <Rocket className="h-8 w-8 text-serene-primary" />
                    {selectedProject.title}
                  </DialogTitle>
                  <DialogDescription>Detalles completos del proyecto</DialogDescription>
                </DialogHeader>
                
                {selectedProject.image_url && (
                  <div className="relative h-96 rounded-lg overflow-hidden">
                    <img
                      src={selectedProject.image_url}
                      alt={selectedProject.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Descripción del Proyecto:</h3>
                    <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground leading-relaxed">
                      {selectedProject.description}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
