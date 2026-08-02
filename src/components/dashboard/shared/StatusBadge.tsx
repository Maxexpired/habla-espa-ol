import { Badge } from "@/components/ui/badge";

type Tone = "success" | "warning" | "info" | "danger" | "neutral" | "muted";

const tones: Record<Tone, string> = {
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  neutral: "bg-muted text-foreground border-border",
  muted: "bg-muted/60 text-muted-foreground border-border",
};

/** Uniform badge used across every dashboard module. */
export const StatusBadge = ({
  label,
  tone = "neutral",
  className = "",
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) => (
  <Badge variant="outline" className={`${tones[tone]} font-medium ${className}`}>
    {label}
  </Badge>
);

export const PublishBadge = ({
  published,
  scheduledAt,
}: {
  published: boolean;
  scheduledAt?: string | null;
}) =>
  published ? (
    <StatusBadge label="Publicado" tone="success" />
  ) : scheduledAt ? (
    <StatusBadge label="Programado" tone="info" />
  ) : (
    <StatusBadge label="Borrador" tone="muted" />
  );
