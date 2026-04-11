import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  description: string | null;
}

export const TeamSection = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .order("created_at", { ascending: true });
      setTeam(data || []);
      setLoading(false);
    };
    fetchTeam();
  }, []);

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

        {loading ? (
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6">
                <Skeleton className="w-32 h-32 rounded-full bg-white/10" />
                <Skeleton className="w-24 h-4 bg-white/10" />
                <Skeleton className="w-20 h-3 bg-white/10" />
              </div>
            ))}
          </div>
        ) : team.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">No hay miembros disponibles</p>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-7xl mx-auto relative px-8 sm:px-12"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {team.map((member) => (
                <CarouselItem
                  key={member.id}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                >
                  <Card className="group card-hover glass-effect border-white/10 backdrop-blur-lg">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="mb-3 sm:mb-4 relative mx-auto w-24 h-24 sm:w-32 sm:h-32">
                        <div className="absolute -inset-1 bg-gradient-accent rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity" />
                        <img
                          src={member.image_url || "/placeholder.svg"}
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
        )}
      </div>
    </section>
  );
};
