import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { LoadingState } from "@/components/dashboard/shared/LoadingState";
import { RecentActivity, SystemStatus } from "@/components/dashboard/SystemOverview";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings, ShieldCheck, CreditCard, Save, Building2, Search, Share2,
  SlidersHorizontal, Mail, Users, Server, Sparkles,
} from "lucide-react";

type Settings = Record<string, any>;

const DEFAULTS: Settings = {
  company_name: "Serene",
  company_logo_url: "",
  company_email: "",
  company_phone: "",
  company_address: "",
  seo_title: "Serene",
  seo_description: "",
  favicon_url: "",
  og_image_url: "",
  social_instagram: "",
  social_facebook: "",
  social_linkedin: "",
  social_github: "",
  social_youtube: "",
  maintenance_mode: false,
  registration_enabled: true,
  require_email_verification: true,
  extra: {},
};

const SECTIONS = [
  { key: "general", label: "General", icon: SlidersHorizontal },
  { key: "empresa", label: "Empresa", icon: Building2 },
  { key: "seo", label: "SEO", icon: Search },
  { key: "redes", label: "Redes", icon: Share2 },
  { key: "correos", label: "Correos", icon: Mail },
  { key: "transbank", label: "Transbank", icon: CreditCard },
  { key: "usuarios", label: "Usuarios", icon: Users },
  { key: "seguridad", label: "Seguridad", icon: ShieldCheck },
  { key: "sistema", label: "Sistema", icon: Server },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export default function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<Settings>(DEFAULTS);
  const [keywords, setKeywords] = useState("");
  const [section, setSection] = useState<SectionKey>("general");

  const env = (import.meta.env.VITE_TRANSBANK_ENVIRONMENT as string) || "integration";

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({ ...DEFAULTS, ...data });
      setKeywords(((data as any)?.extra?.seo_keywords as string) ?? "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        company_name: form.company_name,
        company_logo_url: form.company_logo_url || null,
        company_email: form.company_email || null,
        company_phone: form.company_phone || null,
        company_address: form.company_address || null,
        seo_title: form.seo_title,
        seo_description: form.seo_description ?? "",
        favicon_url: form.favicon_url || null,
        og_image_url: form.og_image_url || null,
        social_instagram: form.social_instagram || null,
        social_facebook: form.social_facebook || null,
        social_linkedin: form.social_linkedin || null,
        social_github: form.social_github || null,
        social_youtube: form.social_youtube || null,
        maintenance_mode: !!form.maintenance_mode,
        registration_enabled: !!form.registration_enabled,
        require_email_verification: !!form.require_email_verification,
        extra: { ...(form.extra || {}), seo_keywords: keywords },
      };
      if (data?.id) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Configuración guardada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  useKeyboardShortcuts(
    [
      {
        key: "s",
        ctrl: true,
        allowInInput: true,
        description: "Guardar configuración",
        handler: () => {
          if (!save.isPending && !isLoading) save.mutate();
        },
      },
    ],
    true
  );

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const field = (key: string, label: string, props: Record<string, any> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} value={form[key] ?? ""} onChange={(e) => set(key, e.target.value)} {...props} />
    </div>
  );

  const toggle = (key: string, label: string, desc: string) => (
    <div className="flex items-start justify-between gap-4 rounded-2xl border p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Switch checked={!!form[key]} onCheckedChange={(v) => set(key, v)} />
    </div>
  );

  const ComingSoon = ({ title }: { title: string }) => (
    <Card className="rounded-3xl">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-serene-primary" />{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Próximamente. Esta sección aún no tiene funcionalidad propia en el panel.
        </div>
      </CardContent>
    </Card>
  );

  const renderSection = () => {
    switch (section) {
      case "general":
        return (
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">Comportamiento de la plataforma</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {toggle("maintenance_mode", "Modo mantenimiento", "Muestra un aviso y limita el acceso público al sitio.")}
              {toggle("registration_enabled", "Registro habilitado", "Permite que nuevos usuarios creen cuenta.")}
              {toggle("require_email_verification", "Verificación de correo obligatoria", "Bloquea el acceso hasta confirmar el email.")}
            </CardContent>
          </Card>
        );
      case "empresa":
        return (
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">Datos de la empresa</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {field("company_name", "Nombre")}
              {field("company_email", "Correo de contacto", { type: "email" })}
              {field("company_phone", "Teléfono")}
              {field("company_logo_url", "URL del logo")}
              <div className="md:col-span-2">{field("company_address", "Dirección")}</div>
              {form.company_logo_url && (
                <img src={form.company_logo_url} alt="Logo" className="h-14 w-auto object-contain rounded-xl border p-2" />
              )}
            </CardContent>
          </Card>
        );
      case "seo":
        return (
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">SEO y Open Graph</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {field("seo_title", "Título SEO", { maxLength: 60 })}
              <div className="space-y-2">
                <Label htmlFor="kw">Palabras clave (separadas por comas)</Label>
                <Input id="kw" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="cursos, python, chile" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="seo_description">Descripción SEO</Label>
                <Textarea
                  id="seo_description"
                  value={form.seo_description ?? ""}
                  onChange={(e) => set("seo_description", e.target.value)}
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{(form.seo_description ?? "").length}/160 caracteres</p>
              </div>
              {field("favicon_url", "URL del favicon")}
              {field("og_image_url", "Imagen Open Graph (URL)")}
            </CardContent>
          </Card>
        );
      case "redes":
        return (
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">Redes sociales</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {field("social_instagram", "Instagram")}
              {field("social_facebook", "Facebook")}
              {field("social_linkedin", "LinkedIn")}
              {field("social_github", "GitHub")}
              {field("social_youtube", "YouTube")}
            </CardContent>
          </Card>
        );
      case "correos":
        return (
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-serene-primary" />Correos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Las plantillas, envíos de prueba e historial de correos se administran en el módulo{" "}
                <span className="font-medium text-foreground">Correos</span> del panel.
              </p>
              {field("company_email", "Correo de contacto usado en notificaciones", { type: "email" })}
            </CardContent>
          </Card>
        );
      case "transbank":
        return (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-serene-primary" /> Transbank Webpay Plus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Ambiente</span>
                <Badge
                  variant="outline"
                  className={env === "production" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}
                >
                  {env === "production" ? "Producción" : "Integración (sandbox)"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Código de comercio</span>
                <span className="font-mono text-xs">•••• ••••</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Las credenciales se administran como secretos del backend y nunca se exponen en el navegador.
              </p>
            </CardContent>
          </Card>
        );
      case "usuarios":
        return (
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-serene-primary" />Usuarios y roles</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                La gestión de cuentas se realiza en el módulo de alumnos/inscripciones. Roles disponibles en la plataforma:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Administrador</Badge>
                <Badge variant="outline">Editor</Badge>
                <Badge variant="outline">Alumno</Badge>
              </div>
              <div className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground text-xs">
                Gestión avanzada de permisos por rol — próximamente.
              </div>
            </CardContent>
          </Card>
        );
      case "seguridad":
        return (
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-serene-primary" />Seguridad</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {toggle("require_email_verification", "Verificación de correo obligatoria", "Bloquea el acceso hasta confirmar el email.")}
              <div className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground text-xs">
                Políticas de contraseña, 2FA y auditoría — próximamente.
              </div>
            </CardContent>
          </Card>
        );
      case "sistema":
        return (
          <div className="grid gap-4 lg:grid-cols-2">
            <SystemStatus />
            <RecentActivity />
          </div>
        );
      default:
        return <ComingSoon title="Sección" />;
    }
  };

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Ajustes globales del sitio, SEO, redes y plataforma"
        icon={<Settings className="h-5 w-5" />}
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending || isLoading} className="rounded-2xl">
            <Save className="h-4 w-4 mr-2" /> {save.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : (
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible rounded-2xl border bg-background/60 p-2 md:sticky md:top-16 md:self-start">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = section === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm text-left transition-colors ${
                    active ? "bg-serene-primary/10 text-serene-primary font-medium" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>
          <div className="min-w-0 animate-fade-in">{renderSection()}</div>
        </div>
      )}
    </div>
  );
}
