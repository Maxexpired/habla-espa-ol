import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

type Result = {
  status: "approved" | "rejected" | "cancelled" | "failed";
  buy_order?: string;
  amount?: number;
  authorization_code?: string;
  transaction_date?: string;
  reason?: string;
};

const money = (n?: number) => (n ? `$${Number(n).toLocaleString("es-CL")} CLP` : "-");

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenWs = params.get("token_ws");
    const tbkToken = params.get("TBK_TOKEN");

    // Cancelación desde Webpay (usuario apretó "Anular compra")
    if (!tokenWs && tbkToken) {
      setResult({ status: "cancelled" });
      setLoading(false);
      return;
    }
    if (!tokenWs) {
      setError("No se recibió información de la transacción.");
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase.functions.invoke("confirm-webpay-transaction", {
        body: { token_ws: tokenWs },
      });
      if (error) {
        setError(error.message || "Error confirmando la transacción.");
      } else {
        setResult(data as Result);
      }
      setLoading(false);
    })();
  }, [params]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          {loading ? (
            <CardContent className="p-12 flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-serene-primary" />
              <p className="text-lg">Confirmando tu pago...</p>
            </CardContent>
          ) : error ? (
            <>
              <CardHeader className="text-center">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-2" />
                <CardTitle>Error</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2 justify-center">
                <Button onClick={() => navigate("/cursos")}>Volver a cursos</Button>
              </CardContent>
            </>
          ) : result?.status === "approved" ? (
            <>
              <CardHeader className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-2" />
                <CardTitle>¡Pago aprobado!</CardTitle>
                <CardDescription>Ya tienes acceso al curso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Orden</span><span className="font-mono">{result.buy_order}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Monto</span><span>{money(result.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Autorización</span><span className="font-mono">{result.authorization_code}</span></div>
                {result.transaction_date && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span>{new Date(result.transaction_date).toLocaleString("es-CL")}</span></div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => navigate("/mis-cursos")}>Ir a Mis Cursos</Button>
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/perfil")}>Ver compras</Button>
                </div>
              </CardContent>
            </>
          ) : result?.status === "cancelled" ? (
            <>
              <CardHeader className="text-center">
                <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-2" />
                <CardTitle>Compra cancelada</CardTitle>
                <CardDescription>Cancelaste la operación antes de completarla. No se hizo ningún cargo.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2 justify-center">
                <Button onClick={() => navigate("/cursos")}>Volver a cursos</Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-2" />
                <CardTitle>Pago rechazado</CardTitle>
                <CardDescription>
                  {result?.reason === "validation_mismatch"
                    ? "La transacción no coincide con la compra registrada."
                    : "Transbank rechazó el pago. Puedes intentarlo nuevamente."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2 justify-center">
                <Button onClick={() => navigate("/cursos")}>Reintentar</Button>
                <Button variant="outline" onClick={() => navigate("/")}>Ir al inicio</Button>
              </CardContent>
            </>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}
