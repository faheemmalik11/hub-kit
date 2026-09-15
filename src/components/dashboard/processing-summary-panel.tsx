import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { DashboardPanel } from "./panel";
import { StatTile } from "./stat-tile";
import { PeriodPicker, type PeriodLabels, type PeriodValue } from "./period-picker";

export interface ProcessingSummary {
  processed: number;
  recognized: number;
  needsReview: number;
  errors: number;
  channels: { label: string; count: number }[];
  lastRunLabel: string | null;
  /**
   * What the pipeline is doing right now, already in the reader's words — "Processing now: Mailbox
   * (folders: Pleo)". Absent or null when nothing is running, so the panel stays as it was.
   */
  runningLabel?: string | null;
}

export function ProcessingSummaryPanel({
  title,
  seeAllLabel,
  seeAllTo,
  summary,
  loading,
  error,
  labels,
  period,
  onPeriodChange,
  periodLabels,
  formatDay,
  className,
  dataTour,
}: {
  title: string;
  seeAllLabel: string;
  seeAllTo: string;
  summary: ProcessingSummary | undefined;
  loading: boolean;
  error?: boolean;
  labels: {
    processed: string;
    recognized: string;
    needsReview: string;
    errors: string;
    channelsPrefix: string;
  };
  period: PeriodValue;
  onPeriodChange: (value: PeriodValue) => void;
  periodLabels?: PeriodLabels;
  formatDay: (iso: string) => string;
  className?: string;
  dataTour?: string;
}): ReactNode {
  if (error) return null;
  const value = (n: number | undefined) => (loading || n === undefined ? "—" : String(n));

  return (
    <DashboardPanel
      title={title}
      headerRight={
        <>
          <Link to={seeAllTo} className="text-xs font-medium text-brand-dark hover:underline">
            {seeAllLabel}
          </Link>
          <PeriodPicker
            value={period}
            onChange={onPeriodChange}
            labels={periodLabels}
            formatDay={formatDay}
          />
        </>
      }
      className={className}
      dataTour={dataTour}
    >
      {summary?.runningLabel && (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground"
        >
          <Loader2 className="size-3.5 shrink-0 animate-spin" />
          <span className="truncate" title={summary.runningLabel}>
            {summary.runningLabel}
          </span>
        </div>
      )}
      <div className="mt-3 grid flex-1 grid-cols-2 gap-2">
        <StatTile to={seeAllTo} label={labels.processed} value={value(summary?.processed)} />
        <StatTile to={seeAllTo} label={labels.recognized} value={value(summary?.recognized)} />
        <StatTile
          to={seeAllTo}
          label={labels.needsReview}
          value={value(summary?.needsReview)}
          valueCls={summary && summary.needsReview > 0 ? "text-warning" : undefined}
        />
        <StatTile
          to={seeAllTo}
          label={labels.errors}
          value={value(summary?.errors)}
          valueCls={summary && summary.errors > 0 ? "text-danger" : undefined}
        />
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 pt-2">
        {summary && summary.channels.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {labels.channelsPrefix}{" "}
            {summary.channels.map((c) => `${c.label} ${c.count}`).join(" · ")}
          </p>
        )}
        {summary?.lastRunLabel && (
          <p className="text-xs text-muted-foreground">{summary.lastRunLabel}</p>
        )}
      </div>
    </DashboardPanel>
  );
}
