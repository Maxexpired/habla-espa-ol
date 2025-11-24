import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const reviewSchema = z.object({
  rating: z.number().min(1, "Debes seleccionar al menos 1 estrella").max(5, "Máximo 5 estrellas"),
  review: z
    .string()
    .trim()
    .min(10, "La reseña debe tener al menos 10 caracteres")
    .max(1000, "La reseña no puede exceder 1000 caracteres"),
});

interface Review {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

interface CourseReviewsProps {
  courseId: string;
}

export function CourseReviews({ courseId }: CourseReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [courseId]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("course_reviews")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profiles for all user_ids
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profilesMap = new Map(
        profilesData?.map((p) => [p.id, p]) || []
      );

      const reviewsWithProfiles = data.map((review) => ({
        ...review,
        profiles: profilesMap.get(review.user_id) || {
          full_name: null,
          email: "Usuario desconocido",
        },
      }));

      setReviews(reviewsWithProfiles);
      
      // Check if user already has a review
      if (user) {
        const userReview = data.find((r) => r.user_id === user.id);
        if (userReview) {
          setRating(userReview.rating);
          setReviewText(userReview.review);
          setEditingReview(userReview.id);
        }
      }
    }
  };

  const fetchStats = async () => {
    const { data: avgData } = await supabase.rpc("get_course_average_rating", {
      course_uuid: courseId,
    });
    const { data: countData } = await supabase.rpc("get_course_reviews_count", {
      course_uuid: courseId,
    });

    if (avgData !== null) setAverageRating(avgData);
    if (countData !== null) setTotalReviews(countData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para dejar una reseña",
        variant: "destructive",
      });
      return;
    }

    // Validate input
    const validation = reviewSchema.safeParse({
      rating,
      review: reviewText,
    });

    if (!validation.success) {
      toast({
        title: "Error de validación",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (editingReview) {
        // Update existing review
        const { error } = await supabase
          .from("course_reviews")
          .update({
            rating: validation.data.rating,
            review: validation.data.review,
          })
          .eq("id", editingReview);

        if (error) throw error;

        toast({
          title: "¡Reseña actualizada!",
          description: "Tu reseña ha sido actualizada correctamente",
        });
      } else {
        // Create new review
        const { error } = await supabase.from("course_reviews").insert({
          course_id: courseId,
          user_id: user.id,
          rating: validation.data.rating,
          review: validation.data.review,
        });

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Ya tienes una reseña",
              description: "Solo puedes dejar una reseña por curso",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "¡Reseña enviada!",
            description: "Gracias por tu opinión",
          });
        }
      }

      fetchReviews();
      fetchStats();
      setRating(0);
      setReviewText("");
      setEditingReview(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteReviewId) return;

    try {
      const { error } = await supabase
        .from("course_reviews")
        .delete()
        .eq("id", deleteReviewId);

      if (error) throw error;

      toast({
        title: "Reseña eliminada",
        description: "Tu reseña ha sido eliminada correctamente",
      });

      fetchReviews();
      fetchStats();
      setRating(0);
      setReviewText("");
      setEditingReview(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteReviewId(null);
    }
  };

  const handleEdit = (review: Review) => {
    setRating(review.rating);
    setReviewText(review.review);
    setEditingReview(review.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setRating(0);
    setReviewText("");
    setEditingReview(null);
  };

  const renderStars = (
    value: number,
    interactive: boolean = false,
    size: "sm" | "md" | "lg" = "md"
  ) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : ""} transition-transform`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= (hoverRating || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
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
    <div className="space-y-6">
      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-serene-primary">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mt-2">
                {renderStars(averageRating, false, "md")}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {totalReviews} {totalReviews === 1 ? "reseña" : "reseñas"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingReview ? "Editar tu reseña" : "Deja tu reseña"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Calificación
                </label>
                {renderStars(rating, true, "lg")}
              </div>

              <div>
                <label htmlFor="review" className="block text-sm font-medium mb-2">
                  Tu opinión
                </label>
                <Textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Cuéntanos qué te pareció el curso (mínimo 10 caracteres)..."
                  rows={4}
                  maxLength={1000}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {reviewText.length}/1000 caracteres
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading || rating === 0}>
                  {loading
                    ? "Enviando..."
                    : editingReview
                    ? "Actualizar reseña"
                    : "Enviar reseña"}
                </Button>
                {editingReview && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Reseñas de estudiantes</h3>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aún no hay reseñas para este curso. ¡Sé el primero en dejar una!
          </p>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {review.profiles?.full_name?.[0]?.toUpperCase() ||
                        review.profiles?.email[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">
                          {review.profiles?.full_name || review.profiles?.email}
                        </p>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating, false, "sm")}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                      {user?.id === review.user_id && (
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(review)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteReviewId(review.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {review.review}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteReviewId}
        onOpenChange={() => setDeleteReviewId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Tu reseña será eliminada
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}