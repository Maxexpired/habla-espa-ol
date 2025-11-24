import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface News {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

export const NewsSection = () => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setNews(data);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <section id="noticias" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center">Cargando noticias...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="noticias" className="py-12 sm:py-16 md:py-20 gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
            Noticias Recientes
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Mantente al día con las últimas novedades de Serene
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6 max-w-5xl mx-auto">
          {news.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-serene-dark to-gray-900"
              onClick={() => navigate("/noticias")}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-0 md:gap-6">
                  {item.image_url && (
                    <div className="md:w-72 h-48 sm:h-56 md:h-auto overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-serene-accent mb-2 sm:mb-3">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-3">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                    <Button
                      variant="default"
                      className="bg-serene-accent hover:bg-serene-secondary text-white w-fit text-sm sm:text-base"
                    >
                      Leer más
                      <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate("/noticias")}
            className="group"
          >
            Ver todas las noticias
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
