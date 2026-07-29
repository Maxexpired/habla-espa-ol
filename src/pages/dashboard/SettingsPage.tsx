import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, ShieldCheck, CreditCard } from "lucide-react";

export default function SettingsPage() {
  const env = (import.meta.env.VITE_TRANSBANK_ENVIRONMENT as string) || "integration";
  return (
    <div>
      <PageHeader title="Configuración" description="Ajustes globales del sitio" icon={<Settings className="h-5 w-5" />} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-serene-primary" /> Estado de la plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Auth</span><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">Activo</Badge></div>
            <div className="flex justify-between"><span>Storage</span><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">Activo</Badge></div>
            <div className="flex justify-between"><span>Edge functions</span><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">Activo</Badge></div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-serene-primary" /> Transbank Webpay Plus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Ambiente</span>
              <Badge variant="outline" className={env === "production" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                {env === "production" ? "Producción" : "Integración (sandbox)"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Las credenciales se administran como secretos del backend y no se exponen en el navegador.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Empresa, SEO y redes — Fase 2</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            En la próxima fase se activa la edición de nombre, logo, correo, redes sociales, OpenGraph, modo mantenimiento y registro abierto — todo persistido en la tabla <code>site_settings</code>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
