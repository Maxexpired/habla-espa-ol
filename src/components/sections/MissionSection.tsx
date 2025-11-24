import { Target, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const MissionSection = () => {
  return (
    <section id="mision" className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-12">
          {/* Image */}
          <div className="lg:w-1/2 w-full">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
              alt="Misión y Visión Serene"
              className="w-full rounded-2xl shadow-2xl object-cover max-w-lg mx-auto"
            />
          </div>

          {/* Content */}
          <div className="lg:w-1/2 w-full">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
              Nuestra Misión y Visión
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              En Serene, creemos que la tecnología es la clave para transformar el futuro.
              Nos dedicamos a crear soluciones innovadoras que impacten positivamente en la sociedad.
            </p>

            <div className="space-y-4 sm:space-y-6">
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-serene-secondary to-serene-primary">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="bg-white/10 p-2.5 sm:p-3 rounded-lg flex-shrink-0">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                        Misión
                      </h3>
                      <p className="text-sm sm:text-base text-gray-100 leading-relaxed">
                        Capacitar a individuos y organizaciones mediante educación tecnológica de calidad,
                        fomentando la innovación y el desarrollo de habilidades prácticas en robótica,
                        inteligencia artificial y programación.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-serene-primary to-serene-secondary">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="bg-white/10 p-2.5 sm:p-3 rounded-lg flex-shrink-0">
                      <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                        Visión
                      </h3>
                      <p className="text-sm sm:text-base text-gray-100 leading-relaxed">
                        Ser reconocidos como líderes en educación tecnológica, creando un ecosistema
                        donde la innovación y el conocimiento impulsen el progreso social y económico
                        a nivel global.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
