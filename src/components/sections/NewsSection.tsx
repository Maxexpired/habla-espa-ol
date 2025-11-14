import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const news = [
  {
    title: "Noticias1",
    description: "Serene anuncia un nuevo programa de innovación en robótica doméstica.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
  },
  {
    title: "Noticias2",
    description: "Avances en inteligencia artificial aplicada al sector educativo.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
  },
  {
    title: "Noticias3",
    description: "Nuevo taller de Python para análisis de datos e innovación tecnológica.",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop",
  },
];

export const NewsSection = () => {
  return (
    <section id="noticias" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Noticias Recientes
          </h2>
          <p className="text-lg text-muted-foreground">
            Mantente al día con las últimas novedades de Serene
          </p>
        </div>

        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
          {news.map((item, index) => (
            <Card
              key={index}
              className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-serene-dark to-gray-900"
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-72 h-48 md:h-auto overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-serene-accent mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {item.description}
                    </p>
                    <Button
                      variant="default"
                      className="bg-serene-accent hover:bg-serene-secondary text-white w-fit"
                    >
                      Leer más
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
