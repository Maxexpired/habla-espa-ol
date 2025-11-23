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

interface Course {
  id: string;
  title: string;
  description: string;
  topics: string[];
  image_url: string | null;
  published: boolean;
}

export const CoursesManager = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    topics: "",
    image_url: "",
    published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCourses(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const topicsArray = formData.topics.split(",").map(t => t.trim()).filter(Boolean);

    try {
      if (editing) {
        await supabase
          .from("courses")
          .update({
            title: formData.title,
            description: formData.description,
            topics: topicsArray,
            image_url: formData.image_url || null,
            published: formData.published,
          })
          .eq("id", editing);
        toast({ title: "Curso actualizado correctamente" });
      } else {
        await supabase.from("courses").insert({
          title: formData.title,
          description: formData.description,
          topics: topicsArray,
          image_url: formData.image_url || null,
          published: formData.published,
        });
        toast({ title: "Curso creado correctamente" });
      }
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (course: Course) => {
    setEditing(course.id);
    setFormData({
      title: course.title,
      description: course.description,
      topics: course.topics.join(", "),
      image_url: course.image_url || "",
      published: course.published,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este curso?")) return;
    await supabase.from("courses").delete().eq("id", id);
    toast({ title: "Curso eliminado" });
    fetchCourses();
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      title: "",
      description: "",
      topics: "",
      image_url: "",
      published: false,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Editar Curso" : "Nuevo Curso"}</CardTitle>
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
              <Label htmlFor="topics">Temas (separados por comas)</Label>
              <Input
                id="topics"
                value={formData.topics}
                onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                placeholder="Python básico, Variables, Funciones"
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
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <Badge variant={course.published ? "default" : "secondary"}>
                  {course.published ? "Publicado" : "Borrador"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{course.description}</p>
              <div className="flex flex-wrap gap-1">
                {course.topics.map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(course)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(course.id)}
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
