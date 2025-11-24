import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Newspaper, Calendar } from "lucide-react";

interface News {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

export default function News() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

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

  return (
    <div className="min-h-screen">
      <Header />
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-serene-primary">
            Noticias y Actualizaciones
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mantente al día con las últimas novedades de Serene
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando noticias...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay noticias disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <Card key={item.id} className="hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col">
                {item.image_url && (
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper className="h-6 w-6 text-serene-primary" />
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <CardDescription className="text-base leading-relaxed line-clamp-3 mb-4">
                    {item.description}
                  </CardDescription>
                  <Button 
                    onClick={() => setSelectedNews(item)}
                    className="mt-auto"
                  >
                    Leer más
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de detalles de la noticia */}
        <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedNews && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-3xl flex items-center gap-3">
                    <Newspaper className="h-8 w-8 text-serene-primary" />
                    {selectedNews.title}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(selectedNews.created_at)}</span>
                  </DialogDescription>
                </DialogHeader>
                
                {selectedNews.image_url && (
                  <div className="relative h-96 rounded-lg overflow-hidden">
                    <img
                      src={selectedNews.image_url}
                      alt={selectedNews.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Contenido de la Noticia:</h3>
                    <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground leading-relaxed">
                      {selectedNews.description}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}