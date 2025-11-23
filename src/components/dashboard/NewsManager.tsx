import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface News {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  published: boolean;
}

export const NewsManager = () => {
  const [news, setNews] = useState<News[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setNews(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await supabase
          .from("news")
          .update({
            title: formData.title,
            description: formData.description,
            image_url: formData.image_url || null,
            published: formData.published,
          })
          .eq("id", editing);
        toast({ title: "Noticia actualizada correctamente" });
      } else {
        await supabase.from("news").insert({
          title: formData.title,
          description: formData.description,
          image_url: formData.image_url || null,
          published: formData.published,
        });
        toast({ title: "Noticia creada correctamente" });
      }
      resetForm();
      fetchNews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (newsItem: News) => {
    setEditing(newsItem.id);
    setFormData({
      title: newsItem.title,
      description: newsItem.description,
      image_url: newsItem.image_url || "",
      published: newsItem.published,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta noticia?")) return;
    await supabase.from("news").delete().eq("id", id);
    toast({ title: "Noticia eliminada" });
    fetchNews();
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      title: "",
      description: "",
      image_url: "",
      published: false,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Editar Noticia" : "Nueva Noticia"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">URL de Imagen</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
              <Label htmlFor="published">Publicado</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editing ? "Actualizar" : "Crear"} <Plus className="ml-2 h-4 w-4" />
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {news.map((newsItem) => (
          <Card key={newsItem.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{newsItem.title}</CardTitle>
                <Badge variant={newsItem.published ? "default" : "secondary"}>
                  {newsItem.published ? "Publicado" : "Borrador"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{newsItem.description}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(newsItem)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(newsItem.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
