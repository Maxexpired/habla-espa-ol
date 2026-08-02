import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal } from "lucide-react";

export interface RowAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  hidden?: boolean;
  /** Show as an always-visible icon button next to the menu */
  inline?: boolean;
}

/**
 * Quick actions for a table/card row: the most used actions appear inline on
 * hover, the rest live in a contextual dropdown.
 */
export const RowActions = ({ actions }: { actions: RowAction[] }) => {
  const visible = actions.filter((a) => !a.hidden);
  const inline = visible.filter((a) => a.inline);
  const menu = visible.filter((a) => !a.inline);

  return (
    <div className="flex items-center justify-end gap-1">
      {inline.map((a) => (
        <Tooltip key={a.label}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-xl opacity-60 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100"
              onClick={a.onClick}
              aria-label={a.label}
            >
              {a.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{a.label}</TooltipContent>
        </Tooltip>
      ))}
      {menu.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" aria-label="Más acciones">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl">
            {menu.map((a, i) => (
              <div key={a.label}>
                {a.destructive && i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={a.onClick}
                  className={a.destructive ? "text-destructive focus:text-destructive" : ""}
                >
                  {a.icon && <span className="mr-2 inline-flex">{a.icon}</span>}
                  {a.label}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
