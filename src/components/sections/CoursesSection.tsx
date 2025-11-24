import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Server, Lightbulb, Fan, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string;
  topics: string[];
  image_url: string | null;
}

const iconMap: { [key: string]: any } = {
  "Introducción a la Robótica Doméstica": Server,
  "Inteligencia Artificial para Principiantes": Lightbulb,
  "Programación con Python para Proyectos Tecnológicos": Fan,
};

export const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: true })
      .limit(3);

    if (!error && data) {
      setCourses(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section id="cursos" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">Cargando cursos...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="cursos" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Nuestros Cursos
          </h2>
          <p className="text-lg text-muted-foreground">
            Soluciones tecnológicas adaptadas a tus necesidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => {
            const Icon = iconMap[course.title] || Server;
            return (
              <Card
                key={course.id}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-serene-dark to-gray-900 overflow-hidden"
                onClick={() => navigate("/cursos")}
              >
                <CardContent className="p-8 text-center">
                  <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-serene-secondary/10 group-hover:bg-serene-secondary/20 transition-colors">
                    <Icon className="h-10 w-10 text-serene-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-serene-accent transition-colors">
                    {course.title}
                  </h3>
                  <div className="w-16 h-1 bg-serene-accent mx-auto mb-4" />
                  <p className="text-gray-300 leading-relaxed line-clamp-3 mb-4">
                    {course.description.split('\n')[0]}
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {course.topics.slice(0, 3).map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate("/cursos")}
            className="group"
          >
            Ver todos los cursos
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
