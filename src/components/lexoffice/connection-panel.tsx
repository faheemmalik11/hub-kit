import { useMemo, useState, type ReactNode } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import type {
  LexofficeCompany,
  LexofficeConnection,
  LexofficeConnectionAdapter,
  LexofficeSyncRun,
} from "../../adapters/lexoffice";
import { cn } from "../../lib/class-names";
import { isLexofficeAuthFailure } from "../../lib/lexoffice/errors";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { readableErrorMessage } from "../feedback/query-states";
import { IntegrationStatus, NotApplicableButton } from "../integrations";
import { LexofficeApiKeyDialog } from "./api-key-dialog";
import { englishLexofficeConnectionPanelLabels, type LexofficeConnectionPanelLabels } from "./labels";

const LONGEST_READABLE_SYNC_ERROR = 160;
const EM_DASH = "—";

export interface LexofficeConnectionPanelProps {
  adapter: LexofficeConnectionAdapter;
  labels?: LexofficeConnectionPanelLabels;
}

function connectionRank(connection: LexofficeConnection | undefined): number {
  if (connection?.isEnabled) return 0;
  if (connection) return 1;
  return 2;
}

function syncErrorText(message: string | null, labels: LexofficeConnectionPanelLabels): string {
  if (isLexofficeAuthFailure(message)) return labels.rejectedKey;
  if (message && message.length <= LONGEST_READABLE_SYNC_ERROR) return message;
  return labels.genericSyncError;
}

export function LexofficeConnectionPanel({
  adapter,
  labels = englishLexofficeConnectionPanelLabels,
}: LexofficeConnectionPanelProps) {
  const companiesQuery = adapter.useCompanies();
  const connectionsQuery = adapter.useConnections();
  const invoiceCountByCompany = adapter.useInvoiceCountByCompany();

  const connectionByCompany = useMemo(() => {
    const byCompany = new Map<string, LexofficeConnection>();
    for (const connection of connectionsQuery.data ?? []) byCompany.set(connection.companyId, connection);
    return byCompany;
  }, [connectionsQuery.data]);

  const sortedCompanies = useMemo(
    () =>
      [...(companiesQuery.data ?? [])].sort(
        (a, b) =>
          connectionRank(connectionByCompany.get(a.id)) - connectionRank(connectionByCompany.get(b.id)) ||
          a.code.localeCompare(b.code),
      ),
    [companiesQuery.data, connectionByCompany],
  );

  if (companiesQuery.isLoading) return <Skeleton className="h-40 w-full" />;
  if (sortedCompanies.length === 0) {
    return <p className="text-sm text-muted-foreground">{labels.noCompanies}</p>;
  }

  const rowProps = (company: LexofficeCompany) => ({
    adapter,
    labels,
    company,
    connection: connectionByCompany.get(company.id),
    invoiceCount: invoiceCountByCompany[company.id] ?? 0,
  });

  return (
    <div>
      <div className="space-y-3 lg:hidden">
        {sortedCompanies.map((company) => (
          <CompanyRow key={company.id} {...rowProps(company)} layout="card" />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-52">{labels.columnCompany}</TableHead>
              <TableHead className="w-40">{labels.columnAccess}</TableHead>
              <TableHead className="w-28 text-right">{labels.columnInvoices}</TableHead>
              <TableHead className="w-36">{labels.columnLastFetched}</TableHead>
              <TableHead className="text-right">{labels.columnActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCompanies.map((company) => (
              <CompanyRow key={company.id} {...rowProps(company)} layout="table" />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function lastRunFailedWithCurrentKey(
  lastRun: LexofficeSyncRun | undefined,
  connection: LexofficeConnection | undefined,
): { failed: boolean; keyChangedSinceRun: boolean } {
  const keyChangedSinceRun =
    !!lastRun && !!connection && Date.parse(lastRun.createdAt) < Date.parse(connection.updatedAt);
  const failed = !!connection?.isEnabled && lastRun?.status === "error" && !keyChangedSinceRun;
  return { failed, keyChangedSinceRun };
}

function CompanyRow({
  adapter,
  labels,
  company,
  connection,
  invoiceCount,
  layout,
}: {
  adapter: LexofficeConnectionAdapter;
  labels: LexofficeConnectionPanelLabels;
  company: LexofficeCompany;
  connection: LexofficeConnection | undefined;
  invoiceCount: number;
  layout: "table" | "card";
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const enabled = !!connection?.isEnabled;
  const lastRunQuery = adapter.useLastSyncRun(enabled ? company.id : null);
  const lastRun = lastRunQuery.data ?? undefined;
  const { failed: lastRunFailed, keyChangedSinceRun } = lastRunFailedWithCurrentKey(lastRun, connection);
  const keyRejected = lastRunFailed && isLexofficeAuthFailure(lastRun?.errorMessage);
  const { canManage, setNotApplicable } = adapter;

  async function fetchNow() {
    setSyncing(true);
    try {
      const counts = await adapter.syncCompany(company.id);
      toast.success(labels.fetched(counts.invoicesSynced, counts.customersSynced));
    } catch (error) {
      toast.error(labels.fetchFailed(readableErrorMessage(error, labels.unknownError)));
    } finally {
      setSyncing(false);
      lastRunQuery.refetch();
    }
  }

  async function toggleEnabled() {
    if (!connection) return;
    try {
      await adapter.updateConnectionStatus({
        connectionId: connection.id,
        isEnabled: !enabled,
        note: connection.note,
      });
    } catch (error) {
      toast.error(labels.actionFailed(readableErrorMessage(error, labels.unknownError)));
    }
  }

  async function changeNotApplicable(nextNotApplicable: boolean) {
    if (!setNotApplicable) return;
    try {
      await setNotApplicable(company.id, nextNotApplicable);
    } catch (error) {
      toast.error(labels.actionFailed(readableErrorMessage(error, labels.unknownError)));
    }
  }

  const companyCell = (
    <>
      {company.code}
      {company.name && <div className="text-xs font-normal text-muted-foreground">{company.name}</div>}
    </>
  );

  const accessCell = (
    <>
      <IntegrationStatus
        configured={!!connection}
        enabled={enabled}
        notApplicable={company.notApplicable}
        problem={lastRunFailed}
        labels={labels.status}
      />
      {enabled && keyChangedSinceRun && lastRun?.status === "error" && (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{labels.newKeyNotFetchedYet}</p>
      )}
      {lastRunFailed && lastRun && (
        <p className="mt-1 max-w-xs text-xs text-danger" title={lastRun.errorMessage ?? undefined}>
          {syncErrorText(lastRun.errorMessage, labels)}
        </p>
      )}
    </>
  );

  const invoiceCountCell = company.notApplicable ? EM_DASH : invoiceCount;
  const lastFetchedCell =
    company.notApplicable || !connection
      ? EM_DASH
      : lastRun
        ? adapter.formatLastRun(lastRun.createdAt)
        : labels.neverFetched;

  const actions: ReactNode = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canManage && !connection && setNotApplicable && (
        <NotApplicableButton
          notApplicable={company.notApplicable}
          onConfirm={changeNotApplicable}
          labels={labels.notApplicable(company.code)}
        />
      )}
      {enabled && (
        <Button size="sm" className="gap-1.5" disabled={syncing} onClick={fetchNow}>
          <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} aria-hidden />
          {syncing ? labels.fetching : labels.fetchNow}
        </Button>
      )}
      {canManage && keyRejected && (
        <Button size="sm" onClick={() => setEditOpen(true)}>
          {labels.enterNewKey}
        </Button>
      )}
      {canManage && !connection && !company.notApplicable && (
        <LexofficeApiKeyDialog
          adapter={adapter}
          companyId={company.id}
          companyCode={company.code}
          existing={undefined}
          labels={labels.apiKeyDialog}
          unknownError={labels.unknownError}
          trigger={
            <Button size="sm" className="gap-1.5">
              <KeyRound className="size-3.5" aria-hidden />
              {labels.setUp}
            </Button>
          }
        />
      )}
      {canManage && connection && !keyRejected && (
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          {labels.edit}
        </Button>
      )}
      {canManage && connection && (
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "whitespace-nowrap",
            enabled && "border-danger/40 text-danger hover:bg-danger-soft hover:text-danger",
          )}
          onClick={toggleEnabled}
        >
          {enabled ? labels.disable : labels.enable}
        </Button>
      )}
      {canManage && connection && (
        <LexofficeApiKeyDialog
          adapter={adapter}
          companyId={company.id}
          companyCode={company.code}
          existing={connection}
          labels={labels.apiKeyDialog}
          unknownError={labels.unknownError}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );

  if (layout === "card") {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 font-medium text-foreground">{companyCell}</div>
          <div className="shrink-0 text-right text-sm text-muted-foreground">
            <div className="tabular-nums">
              {labels.columnInvoices}: {invoiceCountCell}
            </div>
            {!company.notApplicable && connection && (
              <div>
                {labels.columnLastFetched}: {lastFetchedCell}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3">{accessCell}</div>
        <div className="mt-3 border-t border-border pt-3">{actions}</div>
      </div>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">{companyCell}</TableCell>
      <TableCell>{accessCell}</TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">{invoiceCountCell}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{lastFetchedCell}</TableCell>
      <TableCell className="text-right">{actions}</TableCell>
    </TableRow>
  );
}
