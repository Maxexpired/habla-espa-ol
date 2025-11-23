import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EnrollmentWithDetails {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
  courses: {
    title: string;
  };
}

interface CourseEnrollment {
  course_id: string;
  course_title: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
}

export const EnrollmentsManager = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [courseStats, setCourseStats] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEnrollments();
    fetchCourseStats();
  }, []);

  const fetchEnrollments = async () => {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        profiles!enrollments_user_id_fkey (email, full_name),
        courses!enrollments_course_id_fkey (title)
      `)
      .order("enrolled_at", { ascending: false });

    if (!error && data) {
      setEnrollments(data as any);
    }
    setLoading(false);
  };

  const fetchCourseStats = async () => {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title");

    if (courses) {
      const stats = await Promise.all(
        courses.map(async (course) => {
          const { data: enrolls } = await supabase
            .from("enrollments")
            .select("status")
            .eq("course_id", course.id);

          return {
            course_id: course.id,
            course_title: course.title,
            total_enrollments: enrolls?.length || 0,
            active_enrollments:
              enrolls?.filter((e) => e.status === "active").length || 0,
            completed_enrollments:
              enrolls?.filter((e) => e.status === "completed").length || 0,
          };
        })
      );
      setCourseStats(stats);
    }
  };

  const updateEnrollmentStatus = async (
    enrollmentId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("enrollments")
        .update({
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", enrollmentId);

      if (error) throw error;

      // Generate certificate if marking as completed
      if (newStatus === "completed") {
        toast({
          title: "Generando certificado...",
          description: "Esto puede tomar unos segundos",
        });

        const { error: certError } = await supabase.functions.invoke(
          "generate-certificate",
          {
            body: { enrollmentId },
          }
        );

        if (certError) {
          console.error("Certificate generation error:", certError);
          toast({
            title: "Advertencia",
            description: "El curso se marcó como completado pero hubo un error al generar el certificado",
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Completado!",
            description: "Se ha generado el certificado automáticamente",
          });
        }
      } else {
        toast({
          title: "Estado actualizado",
          description: `El estado de la inscripción se actualizó a ${newStatus}`,
        });
      }

      fetchEnrollments();
      fetchCourseStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      active: "default",
      completed: "secondary",
      cancelled: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status === "active"
          ? "Activo"
          : status === "completed"
          ? "Completado"
          : "Cancelado"}
      </Badge>
    );
  };

  return (
    <Tabs defaultValue="enrollments" className="space-y-6">
      <TabsList>
        <TabsTrigger value="enrollments">
          <Users className="mr-2 h-4 w-4" />
          Inscripciones
        </TabsTrigger>
        <TabsTrigger value="stats">
          <BookOpen className="mr-2 h-4 w-4" />
          Estadísticas por Curso
        </TabsTrigger>
      </TabsList>

      <TabsContent value="enrollments" className="space-y-4">
        {loading ? (
          <p>Cargando inscripciones...</p>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay inscripciones todavía
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {enrollment.courses.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {enrollment.profiles.full_name || "Sin nombre"} (
                        {enrollment.profiles.email})
                      </p>
                    </div>
                    {getStatusBadge(enrollment.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Inscrito el:{" "}
                    {new Date(enrollment.enrolled_at).toLocaleDateString("es-ES")}
                  </p>
                  <div className="flex gap-2">
                    {enrollment.status === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateEnrollmentStatus(enrollment.id, "completed")
                          }
                        >
                          Marcar como completado
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateEnrollmentStatus(enrollment.id, "cancelled")
                          }
                        >
                          Cancelar inscripción
                        </Button>
                      </>
                    )}
                    {enrollment.status === "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateEnrollmentStatus(enrollment.id, "active")
                        }
                      >
                        Reactivar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseStats.map((stat) => (
            <Card key={stat.course_id}>
              <CardHeader>
                <CardTitle className="text-lg">{stat.course_title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total inscripciones:</span>
                  <Badge variant="outline">{stat.total_enrollments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Activas:</span>
                  <Badge variant="default">{stat.active_enrollments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completadas:</span>
                  <Badge variant="secondary">{stat.completed_enrollments}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};
