import { ReactNode, useState } from "react";
import { GripVertical } from "lucide-react";

/**
 * Dependency-free drag & drop reorderable list (HTML5 DnD).
 * Reused for ordering records today and ready for the block-based course
 * builder in Fase 3.
 */
export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  className = "",
}: {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const move = (from: string, to: string) => {
    if (from === to) return;
    const next = [...items];
    const fromIdx = next.findIndex((i) => getId(i) === from);
    const toIdx = next.findIndex((i) => getId(i) === to);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
  };

  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item, index) => {
        const id = getId(item);
        return (
          <li
            key={id}
            draggable
            onDragStart={() => setDragId(id)}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) move(dragId, id);
              setDragId(null);
              setOverId(null);
            }}
            className={`flex items-start gap-2 rounded-2xl border bg-background p-3 transition-all ${
              overId === id && dragId !== id ? "ring-2 ring-primary/40" : ""
            } ${dragId === id ? "opacity-50" : "hover:shadow-sm"}`}
          >
            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          </li>
        );
      })}
    </ul>
  );
}
