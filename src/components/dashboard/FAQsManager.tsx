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

interface FAQ {
  id: string;
  question: string;
  answer: string;
  published: boolean;
}

export const FAQsManager = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    const { data } = await supabase
      .from("faqs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setFaqs(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await supabase
          .from("faqs")
          .update({
            question: formData.question,
            answer: formData.answer,
            published: formData.published,
          })
          .eq("id", editing);
        toast({ title: "FAQ actualizada correctamente" });
      } else {
        await supabase.from("faqs").insert({
          question: formData.question,
          answer: formData.answer,
          published: formData.published,
        });
        toast({ title: "FAQ creada correctamente" });
      }
      resetForm();
      fetchFAQs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditing(faq.id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      published: faq.published,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta FAQ?")) return;
    await supabase.from("faqs").delete().eq("id", id);
    toast({ title: "FAQ eliminada" });
    fetchFAQs();
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      question: "",
      answer: "",
      published: false,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Editar FAQ" : "Nueva FAQ"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Pregunta</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Respuesta</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                required
                rows={4}
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
        {faqs.map((faq) => (
          <Card key={faq.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{faq.question}</CardTitle>
                <Badge variant={faq.published ? "default" : "secondary"}>
                  {faq.published ? "Publicado" : "Borrador"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{faq.answer}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(faq)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(faq.id)}
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
