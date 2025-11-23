import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
              <Card key={project.id} className="hover:shadow-xl transition-all duration-300">
                {project.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="h-5 w-5 text-serene-primary" />
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
