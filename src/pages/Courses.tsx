import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Clock, Play, ShoppingCart, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseReviews } from "@/components/CourseReviews";
import { BankTransferModal } from "@/components/BankTransferModal";

interface Course {
  id: string;
  title: string;
  description: string;
  topics: string[];
  image_url: string | null;
  price: number;
  currency: string;
  average_rating?: number;
  reviews_count?: number;
}

interface Enrollment {
  course_id: string;
  status: string;
}

const formatPrice = (price: number, currency: string) => {
  if (!price || price <= 0) return null;
  return `$${price.toLocaleString("es-CL")} ${currency || "CLP"}`;
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [pendingOrders, setPendingOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [buyingCourse, setBuyingCourse] = useState<Course | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchEnrollments();
      fetchPendingOrders();
    }
  }, [user]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const coursesWithRatings = await Promise.all(
        data.map(async (course) => {
          const { data: avgData } = await supabase.rpc("get_course_average_rating", { course_uuid: course.id });
          const { data: countData } = await supabase.rpc("get_course_reviews_count", { course_uuid: course.id });
          return { ...course, average_rating: avgData || 0, reviews_count: countData || 0 };
        })
      );
      setCourses(coursesWithRatings);
    }
    setLoading(false);
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("enrollments")
      .select("course_id, status")
      .eq("user_id", user.id);
    if (data) setEnrollments(data);
  };

  const fetchPendingOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("course_orders")
      .select("course_id")
      .eq("user_id", user.id)
      .in("status", ["pending_payment", "pending_review"]);
    if (data) setPendingOrders(data.map((o) => o.course_id));
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some((e) => e.course_id === courseId && e.status === "active");
  };

  const hasPendingOrder = (courseId: string) => {
    return pendingOrders.includes(courseId);
  };

  const hasValidPrice = (course: Course) => course.price > 0;

  const handleBuyCourse = (course: Course) => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Debes iniciar sesión para comprar un curso", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!hasValidPrice(course)) {
      toast({ title: "Precio no disponible", description: "Este curso no tiene un precio configurado.", variant: "destructive" });
      return;
    }
    setBuyingCourse(course);
  };

  const renderBuyButton = (course: Course, size: "default" | "lg" = "default") => {
    if (user && isEnrolled(course.id)) {
      return (
        <Button className="flex-1" size={size} disabled>
          <CheckCircle className="mr-2 h-4 w-4" />
          Curso comprado
        </Button>
      );
    }

    if (user && hasPendingOrder(course.id)) {
      return (
        <Button className="flex-1" size={size} variant="outline" onClick={() => handleBuyCourse(course)}>
          <Clock className="mr-2 h-4 w-4" />
          Pago en proceso
        </Button>
      );
    }

    const valid = hasValidPrice(course);
    return (
      <Button
        className="flex-1"
        size={size}
        disabled={!valid}
        onClick={() => handleBuyCourse(course)}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Comprar Curso
      </Button>
    );
  };

  const renderPrice = (course: Course) => {
    const formatted = formatPrice(course.price, course.currency);
    if (!formatted) return <p className="text-sm text-muted-foreground italic">Precio no disponible</p>;
    return <p className="text-lg font-bold text-serene-primary">{formatted}</p>;
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-serene-primary">Nuestros Cursos</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora nuestra oferta completa de cursos de tecnología y programación
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando cursos...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay cursos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                {course.image_url && (
                  <div className="relative h-64 overflow-hidden">
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Button variant="secondary" size="icon" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedCourse(course)}>
                      <Play className="h-8 w-8" />
                    </Button>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-serene-primary flex-shrink-0" />
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                    </div>
                  </div>
                  {(course.reviews_count ?? 0) > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{(course.average_rating ?? 0).toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({course.reviews_count} {course.reviews_count === 1 ? "reseña" : "reseñas"})</span>
                    </div>
                  )}
                  <CardDescription className="line-clamp-2">{course.description.split('\n')[0]}</CardDescription>
                  {renderPrice(course)}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {course.topics.slice(0, 4).map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{topic}</Badge>
                    ))}
                    {course.topics.length > 4 && (
                      <Badge variant="outline" className="text-xs">+{course.topics.length - 4} más</Badge>
                    )}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setSelectedCourse(course)}>Ver detalles del curso</Button>
                  <div className="flex gap-2">{renderBuyButton(course)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Course details modal */}
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {selectedCourse && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedCourse.title}</DialogTitle>
                  <DialogDescription>
                    Detalles completos del curso
                    {(selectedCourse.reviews_count ?? 0) > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{(selectedCourse.average_rating ?? 0).toFixed(1)}</span>
                        </div>
                        <span className="text-xs">({selectedCourse.reviews_count} {selectedCourse.reviews_count === 1 ? "reseña" : "reseñas"})</span>
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Detalles del Curso</TabsTrigger>
                    <TabsTrigger value="reviews">Reseñas</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4">
                    {selectedCourse.image_url && (
                      <div className="relative h-64 rounded-lg overflow-hidden">
                        <img src={selectedCourse.image_url} alt={selectedCourse.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Button size="lg" variant="secondary" className="rounded-full w-20 h-20"><Play className="h-10 w-10" /></Button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <span className="text-sm text-muted-foreground">Precio del curso</span>
                        <div className="text-2xl font-bold text-serene-primary">
                          {formatPrice(selectedCourse.price, selectedCourse.currency) || (
                            <span className="text-base text-muted-foreground italic font-normal">Precio no disponible</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Temas del curso:</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCourse.topics.map((topic, idx) => (
                            <Badge key={idx} variant="secondary">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Descripción:</h3>
                        <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">{selectedCourse.description}</div>
                      </div>
                      <div className="flex gap-2 pt-4">{renderBuyButton(selectedCourse, "lg")}</div>
                    </div>
                  </TabsContent>
                  <TabsContent value="reviews">
                    <CourseReviews courseId={selectedCourse.id} />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Bank transfer modal */}
        {buyingCourse && user && (
          <BankTransferModal
            open={!!buyingCourse}
            onOpenChange={(open) => { if (!open) setBuyingCourse(null); }}
            courseId={buyingCourse.id}
            courseTitle={buyingCourse.title}
            price={buyingCourse.price}
            currency={buyingCourse.currency}
            userId={user.id}
            onOrderCreated={() => {
              fetchPendingOrders();
              fetchEnrollments();
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
