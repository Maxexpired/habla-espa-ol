import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

/**
 * Sticky contextual toolbar used above editors and lists.
 * Prepared for the Fase 3 course builder (block tools, undo/redo, preview).
 */
export const ContextToolbar = ({
  left,
  center,
  right,
  className = "",
}: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}) => (
  <div
    className={`sticky top-14 z-20 flex flex-wrap items-center gap-2 rounded-2xl border bg-background/90 px-3 py-2 backdrop-blur transition-shadow hover:shadow-sm ${className}`}
  >
    <div className="flex items-center gap-2">{left}</div>
    {center && (
      <>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2">{center}</div>
      </>
    )}
    <div className="ml-auto flex items-center gap-2">{right}</div>
  </div>
);
