import { Link } from "@tanstack/react-router";
import { ChevronRight, CircleCheck, Circle, TriangleAlert } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "../../lib/class-names";
import type { ChecklistStepItem, ChecklistStepState } from "./types";

const STATE_ICON: Record<ChecklistStepState, ComponentType<{ className?: string }>> = {
  done: CircleCheck,
  open: Circle,
  problem: TriangleAlert,
};

const STATE_ICON_WRAP: Record<ChecklistStepState, string> = {
  done: "bg-emerald-50 text-emerald-600",
  open: "bg-muted text-muted-foreground",
  problem: "bg-amber-50 text-amber-600",
};

export function ChecklistSteps({
  steps,
  className,
}: {
  steps: ChecklistStepItem[];
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-border/60", className)}>
      {steps.map((step) => {
        const Icon = STATE_ICON[step.state];
        const problem = step.state === "problem";
        const done = step.state === "done";
        const link = !done ? step.link : undefined;
        return (
          <li
            key={step.key}
            className={cn(
              "group relative flex items-start gap-3 px-4 py-3 transition-colors",
              problem ? "bg-amber-50/60 hover:bg-amber-50" : link && "hover:bg-muted/40",
            )}
          >
            {link && (
              <Link
                to={link.to}
                search={link.search}
                hash={link.hash}
                aria-label={step.title}
                className="absolute inset-0 z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            )}
            {problem && (
              <span className="absolute inset-y-0 left-0 w-0.5 bg-amber-600" aria-hidden />
            )}
            <span
              className={cn(
                "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
                STATE_ICON_WRAP[step.state],
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm leading-snug",
                  problem ? "font-semibold text-foreground" : "font-medium text-foreground",
                  done && "text-muted-foreground",
                )}
              >
                {step.title}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
            </div>
            {link && (
              <div className="pointer-events-none relative z-0 flex shrink-0 items-center gap-0.5 self-center">
                {step.actionLabel && (
                  <span className="hidden text-sm font-medium text-muted-foreground transition-colors group-hover:text-brand-dark sm:inline">
                    {step.actionLabel}
                  </span>
                )}
                <ChevronRight
                  className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
                  aria-hidden
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
