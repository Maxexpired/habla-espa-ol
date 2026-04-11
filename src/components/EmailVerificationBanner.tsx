import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MailWarning, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const EmailVerificationBanner = ({ email }: { email?: string }) => {
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      toast({
        title: "Correo reenviado",
        description: "Revisa tu bandeja de entrada y carpeta de spam.",
      });
    } catch (error: any) {
      toast({
        title: "Error al reenviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Alert className="max-w-lg border-amber-500/50 bg-amber-50">
        <MailWarning className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800 text-lg font-semibold">
          Verificación de correo pendiente
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p className="text-amber-700">
            Tu cuenta aún no ha sido verificada. Revisa tu correo electrónico
            (<strong>{email}</strong>) y haz clic en el enlace de confirmación
            para acceder a todas las funcionalidades.
          </p>
          <Button
            onClick={handleResend}
            disabled={resending}
            variant="outline"
            className="border-amber-500 text-amber-700 hover:bg-amber-100"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Reenviando..." : "Reenviar correo de verificación"}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
