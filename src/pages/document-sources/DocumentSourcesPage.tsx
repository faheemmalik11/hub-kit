import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  CircleHelp,
  Clock,
  History,
  Info,
  PauseCircle,
  Plus,
} from "lucide-react";

import type {
  DocumentSource,
  DocumentSourcesAdapter,
} from "../../adapters/document-sources";
import { Button } from "../../ui/button";
import { ErrorState } from "../../components/feedback/query-states";
import { Skeleton } from "../../ui/skeleton";
import { cn } from "../../lib/class-names";
import { SourceIconBadge, StatusChip } from "./source-visuals";
import { SourceSettingsSheet } from "./SourceSettingsSheet";
import {
  englishDocumentSourcesLabels,
  type DocumentSourcesLabels,
} from "./labels";

export interface DocumentSourcesPageProps {
  adapter: DocumentSourcesAdapter;
  links?: { logs?: string; help?: string };
  labels?: DocumentSourcesLabels;
  className?: string;
}

export function DocumentSourcesPage({
  adapter,
  links,
  labels = englishDocumentSourcesLabels,
  className,
}: DocumentSourcesPageProps) {
  const filing = adapter.useFilingStatus();
  const sourcesQuery = adapter.useSources();
  const canEdit = adapter.useCanEdit ? adapter.useCanEdit() : true;
  const sources = sourcesQuery.data ?? [];

  const navigate = useNavigate();
  const hash = useRouterState({ select: (state) => state.location.hash });
  const openSourceId = (hash ?? "").replace(/^#/, "");
  const openSource =
    sources.find((source) => source.id === openSourceId) ?? null;

  const fokus = useRouterState({
    select: (state) => (state.location.search as { fokus?: string }).fokus,
  });
  const fokusDone = useRef<string | null>(null);
  useEffect(() => {
    if (!fokus || !openSource) return;
    const token = `${openSource.id}:${fokus}`;
    if (fokusDone.current === token) return;
    fokusDone.current = token;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      const el = document.querySelector<HTMLElement>(`[data-fokus="${fokus}"]`);
      if (!el && tries < 20) return;
      window.clearInterval(timer);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-amber-400", "ring-offset-2", "rounded-md");
      window.setTimeout(
        () => el.classList.remove("ring-2", "ring-amber-400", "ring-offset-2", "rounded-md"),
        2600,
      );
    }, 150);
    return () => window.clearInterval(timer);
  }, [fokus, openSource]);

  const openSourceSheet = (sourceId: string) => {
    void navigate({ to: ".", hash: sourceId });
  };
  const closeSourceSheet = () => {
    void navigate({ to: ".", hash: "", replace: true });
  };

  return (
    <div className={cn("max-w-4xl", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1
          data-tour="document-sources-title"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          {labels.title}
        </h1>
        {labels.howItWorks && links?.help && (
          <Button asChild variant="outline" size="sm">
            <a href={links.help} target="_blank" rel="noreferrer">
              <CircleHelp />
              {labels.howItWorks}
            </a>
          </Button>
        )}
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {labels.subtitle}
        {labels.learnMore && links?.help && (
          <>
            {" "}
            <a
              href={links.help}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {labels.learnMore}
            </a>
          </>
        )}
      </p>

      <div
        data-tour="document-sources-status"
        className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
      >
        <div className="flex min-w-0 items-start gap-3">
          {filing.active ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          ) : (
            <PauseCircle className="mt-0.5 size-5 shrink-0 text-warning" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {filing.active ? labels.filingActive : labels.filingInactive}
            </p>
            <p className="text-sm text-muted-foreground">
              {filing.active
                ? labels.filingActiveDetail
                : labels.filingInactiveDetail}
            </p>
            {filing.lastRunLabel && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm">
                <History className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{labels.lastRun}:</span>
                <span className="font-medium text-foreground">
                  {filing.lastRunLabel}
                </span>
              </p>
            )}
          </div>
        </div>
        {links?.logs && (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={links.logs}>{labels.viewLogs}</Link>
          </Button>
        )}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-foreground">
        {labels.sourcesTitle}
      </h2>

      {sourcesQuery.isError ? (
        <div className="mt-3">
          <ErrorState
            error={sourcesQuery.error}
            onRetry={sourcesQuery.refetch}
          />
        </div>
      ) : sourcesQuery.isLoading ? (
        <div className="mt-3 space-y-px overflow-hidden rounded-xl border border-border">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[72px] w-full rounded-none" />
          ))}
        </div>
      ) : (
        <div
          data-tour="document-sources-list"
          className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
        >
          {sources.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              {labels.noSources}
            </p>
          )}
          {sources.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              labels={labels}
              onOpen={() => openSourceSheet(source.id)}
              onConnect={
                adapter.connect ? () => adapter.connect?.(source.id) : undefined
              }
            />
          ))}
        </div>
      )}

      {adapter.addSource && labels.addSourceTitle && (
        <button
          type="button"
          onClick={() => adapter.addSource?.()}
          className="mt-3 flex w-full cursor-pointer items-center gap-4 rounded-xl border border-dashed border-border p-4 text-left transition-colors hover:bg-muted/40"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Plus className="size-5 text-muted-foreground" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">
              {labels.addSourceTitle}
            </span>
            <span className="block text-sm text-muted-foreground">
              {labels.addSourceDetail}
            </span>
          </span>
        </button>
      )}

      <div className="mt-8 flex items-start gap-3 rounded-xl bg-accent p-4 text-accent-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">{labels.footerTitle}</p>
          <p className="text-sm text-accent-foreground/80">
            {labels.footerDetail}
          </p>
          {labels.nextRun && filing.nextRunLabel && (
            <p className="flex items-center gap-1.5 pt-1 text-sm">
              <Clock className="size-3.5 shrink-0" />
              <span className="text-accent-foreground/80">
                {labels.nextRun}:
              </span>
              <span className="font-medium">{filing.nextRunLabel}</span>
            </p>
          )}
        </div>
      </div>

      <SourceSettingsSheet
        source={openSource}
        labels={labels}
        canEdit={canEdit}
        onClose={closeSourceSheet}
        onSave={adapter.saveSource}
        onRefreshOptions={adapter.refreshOptions}
        onTestConnection={adapter.testConnection}
      />
    </div>
  );
}

function SourceRow({
  source,
  labels,
  onOpen,
  onConnect,
}: {
  source: DocumentSource;
  labels: DocumentSourcesLabels;
  onOpen: () => void;
  onConnect?: () => void;
}) {
  const selectedItems = source.selectedItems ?? [];
  const hasSelectedItems = selectedItems.length > 0;
  const needsConnect =
    source.status === "not_connected" && onConnect !== undefined;
  const actionLabel = needsConnect
    ? labels.connect
    : source.status === "not_configured"
      ? labels.setUp
      : labels.edit;

  return (
    <div className="flex items-start gap-4 p-4">
      <SourceIconBadge icon={source.icon} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {source.name}
          </p>
          <StatusChip status={source.status} labels={labels} />
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {source.detail}
        </p>
        {hasSelectedItems ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {source.selectedItemsLabel && (
              <span className="text-xs text-muted-foreground">
                {source.selectedItemsLabel}
              </span>
            )}
            {source.selectedItemsLoading
              ? selectedItems.map((item) => (
                  <Skeleton key={item} className="h-[22px] w-24 rounded-md" />
                ))
              : selectedItems.map((item) => (
                  <span
                    key={item}
                    title={item}
                    className="max-w-40 truncate rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-xs text-foreground"
                  >
                    {item}
                  </span>
                ))}
          </div>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {source.statusDetail}
          </p>
        )}
      </div>
      <div className="flex shrink-0 justify-end">
        {source.fields.length > 0 || needsConnect ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-20"
            onClick={needsConnect ? onConnect : onOpen}
          >
            {actionLabel}
          </Button>
        ) : source.link && labels.open ? (
          <Button asChild variant="outline" size="sm" className="min-w-20">
            <Link to={source.link}>{labels.open}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
