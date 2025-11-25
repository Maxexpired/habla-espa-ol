import { Target, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const MissionSection = () => {
  return (
    <section id="mision" className="py-12 sm:py-16 md:py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-serene-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-serene-accent-light/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-16">
          {/* Image */}
          <div className="lg:w-1/2 w-full animate-fade-in">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
                alt="Misión y Visión Serene"
                className="relative w-full rounded-2xl shadow-elegant object-cover max-w-lg mx-auto"
              />
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-1/2 w-full animate-fade-in-up">
            <Badge variant="secondary" className="mb-4 text-serene-accent border-serene-accent/30">
              Quiénes Somos
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
              Nuestra Misión <span className="text-gradient">y Visión</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              En Serene, creemos que la tecnología es la clave para transformar el futuro.
              Nos dedicamos a crear soluciones innovadoras que impacten positivamente en la sociedad.
            </p>

            <div className="space-y-4 sm:space-y-6">
              <Card className="group card-hover border-0 gradient-card backdrop-blur-sm glow-border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="bg-serene-accent p-2.5 sm:p-3 rounded-xl flex-shrink-0 shadow-glow group-hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-shadow">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6 text-serene-dark drop-shadow-lg" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                        Misión
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        Capacitar a individuos y organizaciones mediante educación tecnológica de calidad,
                        fomentando la innovación y el desarrollo de habilidades prácticas en robótica,
                        inteligencia artificial y programación.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group card-hover border-0 gradient-card backdrop-blur-sm glow-border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="bg-serene-accent p-2.5 sm:p-3 rounded-xl flex-shrink-0 shadow-glow group-hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-shadow">
                      <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-serene-dark drop-shadow-lg" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                        Visión
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
