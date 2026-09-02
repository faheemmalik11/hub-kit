import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CheckCircle2, CircleHelp, Info, PauseCircle, Plus } from "lucide-react";

import type {
  DocumentSource,
  DocumentSourcesAdapter,
} from "../../adapters/document-sources";
import { Button } from "../../ui/button";
import { ErrorState } from "../../components/feedback/query-states";
import { Skeleton } from "../../ui/skeleton";
import { cn } from "../../lib/class-names";
import { SourceIconBadge, StatusText } from "./source-visuals";
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

  const [openSourceId, setOpenSourceId] = useState<string | null>(null);
  const openSource =
    sources.find((source) => source.id === openSourceId) ?? null;

  const hash = useRouterState({ select: (state) => state.location.hash });
  const handledHash = useRef<string | null>(null);
  useEffect(() => {
    const target = (hash ?? "").replace(/^#/, "");
    if (!target || handledHash.current === target) {
      return;
    }
    if (sources.some((source) => source.id === target)) {
      handledHash.current = target;
      setOpenSourceId(target);
    }
  }, [hash, sources]);

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
        className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
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
          </div>
        </div>
        {filing.lastRunLabel && (
          <div className="flex items-baseline gap-2 pl-8 sm:block sm:pl-0 sm:text-right">
            <p className="text-xs text-muted-foreground">{labels.lastRun}</p>
            <p className="text-sm text-foreground">{filing.lastRunLabel}</p>
          </div>
        )}
        {links?.logs && (
          <Button asChild variant="outline" size="sm" className="ml-8 self-start sm:ml-0 sm:self-auto">
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
              onOpen={() => setOpenSourceId(source.id)}
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

      <p className="mt-8 flex items-start gap-2 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold">{labels.footerTitle}</span>
          <br />
          {labels.footerDetail}
          {labels.nextRun && filing.nextRunLabel && (
            <>
              <br />
              <span className="font-medium">
                {labels.nextRun}: {filing.nextRunLabel}
              </span>
            </>
          )}
        </span>
      </p>

      <SourceSettingsSheet
        source={openSource}
        labels={labels}
        canEdit={canEdit}
        onClose={() => setOpenSourceId(null)}
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
  const needsConnect =
    source.status === "not_connected" && onConnect !== undefined;
  const actionLabel = needsConnect
    ? labels.connect
    : source.status === "not_configured"
      ? labels.setUp
      : labels.edit;

  return (
    <div className="flex items-center gap-4 p-4">
      <SourceIconBadge icon={source.icon} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {source.name}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {source.detail}
        </p>
      </div>
      <div className="hidden w-48 min-w-0 shrink-0 sm:block">
        <StatusText status={source.status} labels={labels} />
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {source.statusDetail}
        </p>
      </div>
      <div className="flex w-20 shrink-0 justify-end">
        {source.fields.length > 0 || needsConnect ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={needsConnect ? onConnect : onOpen}
          >
            {actionLabel}
          </Button>
        ) : source.link && labels.open ? (
          <Button asChild variant="outline" size="sm">
            <Link to={source.link}>{labels.open}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
