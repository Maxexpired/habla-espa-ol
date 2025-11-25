import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.safeParse({
        email,
        password,
        fullName: isLogin ? undefined : fullName,
      });

      if (!validation.success) {
        toast({
          title: "Error de validación",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "¡Bienvenido de vuelta!" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast({ title: "¡Cuenta creada! Ya puedes iniciar sesión." });
        setIsLogin(true);
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-serene-primary via-serene-secondary to-serene-accent p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-serene-accent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-serene-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Link to="/" className="absolute top-4 left-4 z-10">
        <Button variant="outline" className="hover:scale-105 transition-all duration-200 backdrop-blur-sm bg-background/80 border-serene-accent/30 hover:border-serene-accent hover:bg-serene-accent/10">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
      </Link>

      <Card className="w-full max-w-md animate-fade-in relative z-10 backdrop-blur-sm bg-background/95 shadow-2xl border-border/50">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-serene-accent bg-clip-text text-transparent animate-scale-in">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </CardTitle>
          <CardDescription className="text-center text-base">
            {isLogin ? "Ingresa a tu cuenta de Serene" : "Únete a la comunidad Serene"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Nombre Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  placeholder="Juan Pérez"
                  className="transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95" 
              disabled={loading}
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full transition-all duration-200 hover:scale-[1.01] hover:bg-muted/50"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
