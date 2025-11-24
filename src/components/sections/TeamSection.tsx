import { Card, CardContent } from "@/components/ui/card";
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
    <section id="equipo" className="py-20 bg-gradient-to-b from-serene-dark to-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Nuestro Equipo
          </h2>
          <p className="text-lg text-gray-300">
            Conoce a las personas que hacen posible Serene
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-7xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {team.map((member, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gray-800/50 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 relative mx-auto w-32 h-32">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover rounded-full border-4 border-serene-accent group-hover:border-serene-secondary transition-colors"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-serene-accent transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-serene-accent font-medium text-sm">{member.role}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 bg-serene-accent hover:bg-serene-secondary text-white border-none" />
          <CarouselNext className="hidden md:flex -right-12 bg-serene-accent hover:bg-serene-secondary text-white border-none" />
        </Carousel>
      </div>
    </section>
  );
};
