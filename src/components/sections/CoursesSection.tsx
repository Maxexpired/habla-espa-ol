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
    <section id="cursos" className="py-12 sm:py-16 md:py-24 gradient-subtle relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
          <Badge variant="secondary" className="mb-4 text-serene-accent border-serene-accent/30">
            Educación de Calidad
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
            Nuestros <span className="text-gradient">Cursos</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Soluciones tecnológicas adaptadas a tus necesidades
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {courses.map((course, index) => {
            const Icon = iconMap[course.title] || Server;
            return (
              <Card
                key={course.id}
                className="group card-hover cursor-pointer border-0 gradient-card overflow-hidden shine-effect backdrop-blur-sm"
                onClick={() => navigate("/cursos")}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 sm:p-8 text-center relative z-10">
                  <div className="mb-4 sm:mb-6 inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-accent shadow-glow group-hover:scale-110 transition-transform">
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 gradient-text-hover px-2">
                    {course.title}
                  </h3>
                  <div className="w-12 sm:w-16 h-1 bg-gradient-accent mx-auto mb-3 sm:mb-4 rounded-full" />
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 mb-4 px-2">
                    {course.description.split('\n')[0]}
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                    {course.topics.slice(0, 3).map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-serene-accent/30 bg-serene-accent/5">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 animate-fade-in-up">
          <Button
            size="lg"
            onClick={() => navigate("/cursos")}
            className="group button-hover"
          >
            Ver todos los cursos
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
