import { Card, CardContent } from "@/components/ui/card";

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gray-800/50 border-gray-700"
            >
              <CardContent className="p-6 text-center">
                <div className="mb-6 relative mx-auto w-40 h-40">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover rounded-full border-4 border-serene-accent group-hover:border-serene-secondary transition-colors"
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-serene-accent transition-colors">
                  {member.name}
                </h3>
                <p className="text-serene-accent font-medium">{member.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
