import { Server, Lightbulb, Fan } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const courses = [
  {
    icon: Server,
    title: "Introducción a la Robótica Doméstica",
    description: "Aprende los fundamentos de la robótica aplicada al hogar, desde sensores hasta control de movimiento.",
  },
  {
    icon: Lightbulb,
    title: "Inteligencia Artificial para Principiantes",
    description: "Inicia tu camino en la IA aprendiendo cómo las máquinas pueden 'pensar' y tomar decisiones.",
  },
  {
    icon: Fan,
    title: "Programación con Python para Proyectos Tecnológicos",
    description: "Aprende a programar desde cero con Python, el lenguaje más usado en robótica e IA.",
  },
];

export const CoursesSection = () => {
  return (
    <section id="cursos" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-lg text-muted-foreground">
            Soluciones tecnológicas adaptadas a tus necesidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-serene-dark to-gray-900 overflow-hidden"
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-serene-secondary/10 group-hover:bg-serene-secondary/20 transition-colors">
                  <course.icon className="h-10 w-10 text-serene-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-serene-accent transition-colors">
                  {course.title}
                </h3>
                <div className="w-16 h-1 bg-serene-accent mx-auto mb-4" />
                <p className="text-gray-300 leading-relaxed">
                  {course.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
