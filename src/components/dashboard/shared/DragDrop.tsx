import { ReactNode, useState } from "react";
import { GripVertical } from "lucide-react";

/**
 * Minimal, dependency-free drag & drop primitives shared by the dashboard.
 * `SortableList` covers reordering of existing records; these helpers cover the
 * palette → canvas interaction needed by the Fase 3 course builder.
 */

export const DragHandle = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-flex cursor-grab items-center text-muted-foreground active:cursor-grabbing ${className}`}
    aria-hidden
  >
    <GripVertical className="h-4 w-4" />
  </span>
);

/** Item that can be dragged out of a palette. */
export const DraggableItem = ({
  payload,
  children,
  className = "",
}: {
  payload: string;
  children: ReactNode;
  className?: string;
}) => (
  <div
    draggable
    onDragStart={(e) => {
      e.dataTransfer.setData("text/plain", payload);
      e.dataTransfer.effectAllowed = "copy";
    }}
    className={`flex cursor-grab items-center gap-2 rounded-2xl border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/60 active:cursor-grabbing ${className}`}
  >
    <DragHandle />
    {children}
  </div>
);

/** Target area that accepts a `DraggableItem` payload. */
export const DropZone = ({
  onDropPayload,
  children,
  label = "Suelta un bloque aquí",
  className = "",
}: {
  onDropPayload: (payload: string) => void;
  children?: ReactNode;
  label?: string;
  className?: string;
}) => {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const payload = e.dataTransfer.getData("text/plain");
        if (payload) onDropPayload(payload);
      }}
      className={`rounded-3xl border-2 border-dashed p-6 text-center text-sm transition-colors ${
        over ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
      } ${className}`}
    >
      {children ?? label}
    </div>
  );
};
