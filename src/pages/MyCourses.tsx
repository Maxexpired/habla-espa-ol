import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Award, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface EnrollmentWithCourse {
  id: string;
  status: string;
  enrolled_at: string;
  courses: {
    id: string;
    title: string;
    description: string;
    topics: string[];
    image_url: string | null;
  };
}

interface Certificate {
  id: string;
  certificate_number: string;
  file_url: string;
  issued_at: string;
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [certificates, setCertificates] = useState<Record<string, Certificate>>({});
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchEnrollments();
    fetchCertificates();
  }, [user, authLoading, navigate]);

  const fetchEnrollments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        courses!enrollments_course_id_fkey (*)
      `)
      .eq("user_id", user.id)
      .order("enrolled_at", { ascending: false });

    if (!error && data) {
      setEnrollments(data as any);
    }
    setLoading(false);
  };

  const fetchCertificates = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id);

    if (data) {
      const certMap = data.reduce((acc, cert) => {
        acc[cert.enrollment_id] = cert;
        return acc;
      }, {} as Record<string, Certificate>);
      setCertificates(certMap);
    }
  };

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!confirm("¿Estás seguro de que deseas cancelar tu inscripción?")) return;

    try {
      const { error } = await supabase
        .from("enrollments")
        .update({ status: "cancelled" })
        .eq("id", enrollmentId);

      if (error) throw error;

      toast({
        title: "Inscripción cancelada",
        description: "Has cancelado tu inscripción al curso",
      });
      fetchEnrollments();
      fetchCertificates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadCertificate = (certificate: Certificate) => {
    // Open certificate in new window where it can be printed as PDF
    const printWindow = window.open(certificate.file_url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { variant: "default" as const, label: "En curso" },
      completed: { variant: "secondary" as const, label: "Completado" },
      cancelled: { variant: "outline" as const, label: "Cancelado" },
    };
    const { variant, label } = config[status as keyof typeof config] || config.active;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">Cargando tus cursos...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-16 w-16 text-serene-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-serene-primary">
            Mis Cursos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Aquí puedes ver todos los cursos en los que estás inscrito
          </p>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No estás inscrito en ningún curso todavía.
            </p>
            <Button onClick={() => navigate("/cursos")}>
              <BookOpen className="mr-2 h-4 w-4" />
              Explorar cursos
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-xl transition-all duration-300">
                {enrollment.courses.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={enrollment.courses.image_url}
                      alt={enrollment.courses.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <BookOpen className="h-5 w-5 text-serene-primary" />
                    {getStatusBadge(enrollment.status)}
                  </div>
                  <CardTitle className="text-xl">{enrollment.courses.title}</CardTitle>
                  <CardDescription>{enrollment.courses.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {enrollment.courses.topics.map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Inscrito el:{" "}
                    {new Date(enrollment.enrolled_at).toLocaleDateString("es-ES")}
                  </p>
                  
                  {enrollment.status === "completed" && certificates[enrollment.id] && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-serene-primary hover:bg-serene-secondary"
                      onClick={() => handleDownloadCertificate(certificates[enrollment.id])}
                    >
                      <Award className="mr-2 h-4 w-4" />
                      Descargar Certificado
                    </Button>
                  )}
                  
                  {enrollment.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCancelEnrollment(enrollment.id)}
                    >
                      Cancelar inscripción
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
