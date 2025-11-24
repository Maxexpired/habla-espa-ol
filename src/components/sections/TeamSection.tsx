import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const team = [
  {
    name: "María González",
    role: "CEO & Fundadora",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop",
  },
  {
    name: "Carlos Ramírez",
    role: "Director de Tecnología",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
  },
  {
    name: "Ana Martínez",
    role: "Directora de Educación",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop",
  },
  {
    name: "Luis Hernández",
    role: "Ingeniero de IA",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop",
  },
  {
    name: "Sofia Torres",
    role: "Directora de Innovación",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
  },
  {
    name: "Diego Morales",
    role: "Líder de Desarrollo",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
  },
  {
    name: "Laura Sánchez",
    role: "Coordinadora de Cursos",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
  },
  {
    name: "Roberto Díaz",
    role: "Especialista en Robótica",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
  },
  {
    name: "Patricia Ruiz",
    role: "Diseñadora UX/UI",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
  },
  {
    name: "Javier Castro",
    role: "Ingeniero de Software",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop",
  },
  {
    name: "Daniela Flores",
    role: "Gerente de Proyectos",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop",
  },
  {
    name: "Miguel Vargas",
    role: "Especialista en Python",
    image: "https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=300&h=300&fit=crop",
  },
  {
    name: "Valentina Ortiz",
    role: "Analista de Datos",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop",
  },
  {
    name: "Andrés Mendoza",
    role: "Desarrollador IoT",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop",
  },
  {
    name: "Camila Reyes",
    role: "Coordinadora de Comunicación",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop",
  },
];

export const TeamSection = () => {
  return (
    <section id="equipo" className="py-12 sm:py-16 md:py-24 gradient-hero text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-serene-accent/20 rounded-full blur-3xl animate-float" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
          <Badge variant="secondary" className="mb-4 text-serene-accent border-serene-accent/30 bg-white/5">
            Talento Excepcional
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-4 sm:mb-6">
            Nuestro <span className="text-gradient">Equipo</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
            Conoce a las personas que hacen posible Serene
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-7xl mx-auto relative px-8 sm:px-12"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {team.map((member, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <Card className="group card-hover glass-effect border-white/10 backdrop-blur-lg">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="mb-3 sm:mb-4 relative mx-auto w-24 h-24 sm:w-32 sm:h-32">
                      <div className="absolute -inset-1 bg-gradient-accent rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity" />
                      <img
                        src={member.image}
                        alt={member.name}
                        className="relative w-full h-full object-cover rounded-full border-4 border-white/20 group-hover:border-serene-accent transition-all shadow-elegant"
                      />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 gradient-text-hover">
                      {member.name}
                    </h3>
                    <p className="text-serene-accent-light font-medium text-xs sm:text-sm">{member.role}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-3 sm:-left-4 md:-left-6 top-1/2 -translate-y-1/2 bg-gradient-accent hover:shadow-glow text-white border-none w-10 h-10 sm:w-12 sm:h-12 shadow-elegant z-10 transition-all hover:scale-110" />
          <CarouselNext className="absolute -right-3 sm:-right-4 md:-right-6 top-1/2 -translate-y-1/2 bg-gradient-accent hover:shadow-glow text-white border-none w-10 h-10 sm:w-12 sm:h-12 shadow-elegant z-10 transition-all hover:scale-110" />
        </Carousel>
      </div>
    </section>
  );
};
