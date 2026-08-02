import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface EditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Main form content */
  children: ReactNode;
  /** Optional live preview / metadata rendered under the form */
  aside?: ReactNode;
  /** Optional change history block */
  history?: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  saving?: boolean;
  /** Extra actions rendered on the left of the footer */
  footerExtra?: ReactNode;
  width?: "md" | "lg" | "xl";
}

const widths: Record<string, string> = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
};

/**
 * Reusable side panel for record editing. Replaces large modals so the
 * administrator never loses the list context. Also used as the base for the
 * future course builder inspector.
 */
export const EditSheet = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  aside,
  history,
  onSubmit,
  submitLabel = "Guardar",
  saving,
  footerExtra,
  width = "lg",
}: EditSheetProps) => {
  useKeyboardShortcuts(
    [
      {
        key: "s",
        ctrl: true,
        allowInInput: true,
        description: "Guardar",
        handler: () => {
          if (!saving) onSubmit();
        },
      },
    ],
    open
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`${widths[width]} w-full p-0 flex flex-col gap-0`}
      >
        <SheetHeader className="px-6 py-4 border-b space-y-1">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <div className="space-y-4 animate-fade-in">{children}</div>
            {aside && (
              <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">{aside}</div>
            )}
            {history && (
              <div className="rounded-2xl border p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Historial de cambios
                </p>
                {history}
              </div>
            )}
          </div>

          <div className="border-t bg-background/95 backdrop-blur px-6 py-3 flex items-center gap-2">
            <div className="mr-auto flex items-center gap-2">{footerExtra}</div>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="rounded-2xl" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
