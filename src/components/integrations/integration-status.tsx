import { cn } from "../../lib/class-names";

const PILL = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium whitespace-nowrap";
const DOT = "size-2 shrink-0 rounded-full";

export interface IntegrationStatusLabels {
  configured: string;
  notConfigured: string;
  disabled: string;
  notApplicable: string;
  problem: string;
}

export function IntegrationStatus({
  configured,
  enabled = true,
  notApplicable = false,
  problem = false,
  labels,
}: {
  configured: boolean;
  enabled?: boolean;
  notApplicable?: boolean;
  problem?: boolean;
  labels: IntegrationStatusLabels;
}) {
  if (notApplicable) {
    return <StatusPill tone="muted" text={labels.notApplicable} />;
  }
  if (problem) {
    return <StatusPill tone="danger" text={labels.problem} />;
  }
  if (!configured) {
    return <StatusPill tone="warning" text={labels.notConfigured} />;
  }
  if (!enabled) {
    return <StatusPill tone="warning" text={labels.disabled} />;
  }
  return <StatusPill tone="success" text={labels.configured} />;
}

const toneClasses = {
  muted: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/40" },
  danger: { pill: "bg-danger-soft text-danger", dot: "bg-danger" },
  warning: { pill: "bg-warning-soft text-warning", dot: "bg-warning" },
  success: { pill: "bg-success-soft text-success", dot: "bg-success" },
} as const;

function StatusPill({ tone, text }: { tone: keyof typeof toneClasses; text: string }) {
  return (
    <span className={cn(PILL, toneClasses[tone].pill)}>
      <span className={cn(DOT, toneClasses[tone].dot)} aria-hidden />
      {text}
    </span>
  );
}
