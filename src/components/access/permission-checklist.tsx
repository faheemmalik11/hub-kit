import { useMemo } from "react";

import { Checkbox } from "../../ui/checkbox";
import { cn } from "../../lib/class-names";
import type { AccessPermission, AccessToggle } from "./types";

export function PermissionChecklist({
  permissions,
  held,
  onToggle,
  disabled = false,
  readOnlyNote,
  categoryLabel = (c) => c,
  className,
}: {
  permissions: AccessPermission[];
  /** Keys currently in force for this subject. */
  held: string[];
  onToggle: AccessToggle;
  /** Locks every box — used for a subject whose access is not editable (e.g. an owner account). */
  disabled?: boolean;
  /** Shown instead of nothing when `disabled`, so a locked list explains itself. */
  readOnlyNote?: string;
  categoryLabel?: (category: string) => string;
  className?: string;
}) {
  const gruppen = useMemo(() => {
    const nach = new Map<string, AccessPermission[]>();
    for (const p of permissions) {
      if (!nach.has(p.category)) nach.set(p.category, []);
      nach.get(p.category)!.push(p);
    }
    return [...nach.entries()];
  }, [permissions]);

  const gehalten = useMemo(() => new Set(held), [held]);

  if (gruppen.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {disabled && readOnlyNote && <p className="text-sm text-muted-foreground">{readOnlyNote}</p>}
      {gruppen.map(([kategorie, eintraege]) => (
        <div key={kategorie}>
          <div className="text-sm font-semibold text-foreground">{categoryLabel(kategorie)}</div>
          <div className="mt-1.5 grid gap-x-3 gap-y-0.5 sm:grid-cols-2">
            {eintraege.map((p) => (
              <label
                key={p.key}
                title={p.description ?? undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50",
                )}
              >
                <Checkbox
                  checked={gehalten.has(p.key)}
                  disabled={disabled}
                  onCheckedChange={(checked) => onToggle(p.key, checked === true)}
                  aria-label={p.label}
                />
                {}
                <span className="min-w-0 text-sm font-medium leading-snug text-foreground">
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
