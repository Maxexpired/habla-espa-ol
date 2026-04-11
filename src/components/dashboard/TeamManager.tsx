import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, Plus, X } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  description: string | null;
}

export const TeamManager = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", role: "", description: "" });
  const { toast } = useToast();
  const { uploading, uploadImage } = useImageUpload("team-images");
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true });
    setMembers(data || []);
  };

  const handleImageSelect = async (file: File) => {
    try {
      const url = await uploadImage(file);
      if (url) {
        setImageUrl(url);
      }
    } catch {
      toast({ title: "Error al subir imagen", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      toast({ title: "Error", description: "Nombre y cargo son obligatorios", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name,
      role: formData.role,
      description: formData.description || null,
      image_url: imageUrl,
    };

    if (editing) {
      const { error } = await supabase.from("team_members").update(payload).eq("id", editing);
      if (error) {
        toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Miembro actualizado" });
    } else {
      const { error } = await supabase.from("team_members").insert(payload);
      if (error) {
        toast({ title: "Error al crear", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Miembro creado" });
    }

    resetForm();
    fetchMembers();
  };

  const handleEdit = (member: TeamMember) => {
    setEditing(member.id);
    setFormData({ name: member.name, role: member.role, description: member.description || "" });
    setImageUrl(member.image_url);
    setImagePreview(member.image_url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este miembro?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Miembro eliminado" });
    fetchMembers();
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ name: "", role: "", description: "" });
    setImageUrl(null);
    setImagePreview(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {editing ? "Editar Miembro" : "Agregar Miembro"}
            {editing && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ej: Director de Tecnología"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción del miembro..."
                rows={3}
              />
            </div>
            <ImageUploadField
              label="Foto del miembro"
              uploading={uploading}
              imagePreview={imagePreview}
              onFileSelect={handleImageSelect}
            />
            <Button type="submit" disabled={uploading}>
              <Plus className="h-4 w-4 mr-2" />
              {editing ? "Guardar Cambios" : "Agregar Miembro"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <img
                  src={member.image_url || "/placeholder.svg"}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  {member.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{member.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                  <Pencil className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(member.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No hay miembros del equipo. Agrega el primero.</p>
      )}
    </div>
  );
};
