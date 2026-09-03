import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "../../ui/input";
import { Combobox } from "../../ui/combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { ErrorState, TableSkeleton } from "../../components/feedback/query-states";
import { TablePagination } from "../../components/feedback/table-pagination";
import type { BankReconciliationAdapter, BankTransactionRecord } from "../../adapters/bank-reconciliation";
import { MatchStatusBadge, DirectionBadge } from "./badges";
import { BankMatchPanel } from "../../components/bank-match/BankMatchPanel";
import { SortControl } from "./sort-control";
import { useTableView } from "./use-table-view";
import { englishBankTransactionsLabels, type BankTransactionsLabels } from "./labels";

export interface BankTransactionsPageProps {
  adapter: BankReconciliationAdapter;
  labels?: BankTransactionsLabels;
}

export function BankTransactionsPage({ adapter, labels = englishBankTransactionsLabels }: BankTransactionsPageProps) {
  const transactionsQuery = adapter.useTransactions();
  const accountsQuery = adapter.useAccounts();

  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState("");
  const [openTransaction, setOpenTransaction] = useState<BankTransactionRecord | null>(null);

  const accountById = useMemo(() => new Map(accountsQuery.data.map((a) => [a.id, a])), [accountsQuery.data]);
  const statusOptions = useMemo(() => {
    const set = new Set(transactionsQuery.data.map((t) => t.matching_status).filter(Boolean));
    return Array.from(set);
  }, [transactionsQuery.data]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactionsQuery.data.filter((row) => {
      if (accountId && row.account_id !== accountId) return false;
      if (status && row.matching_status !== status) return false;
      if (!term) return true;
      return `${row.counterparty_holder ?? ""} ${row.payment_reference ?? ""} ${row.booking_text ?? ""}`.toLowerCase().includes(term);
    });
  }, [transactionsQuery.data, search, accountId, status]);

  const view = useTableView(filteredRows, {
    initialSort: "bookingDate",
    initialDirection: "desc",
    resetKey: `${search}|${accountId}|${status}`,
    sortValue: (row, key) => {
      switch (key) {
        case "amount":
          return row.amount;
        case "counterparty":
          return row.counterparty_holder ?? "";
        default:
          return row.booking_date ?? "";
      }
    },
  });

  const sortColumns = [
    { value: "bookingDate", label: labels.columnDate },
    { value: "amount", label: labels.columnAmount },
    { value: "counterparty", label: labels.columnCounterparty },
  ];

  return (
    <div>
      <div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{labels.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{labels.subtitle}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={labels.searchPlaceholder} className="pl-9" />
        </div>
        <Combobox
          value={accountId}
          onValueChange={setAccountId}
          className="w-full sm:w-48"
          options={[{ value: "", label: labels.accountAll }, ...accountsQuery.data.map((a) => ({ value: a.id, label: a.account_name ?? a.iban ?? a.id }))]}
        />
        <Combobox
          value={status}
          onValueChange={setStatus}
          className="w-full sm:w-40"
          options={[{ value: "", label: labels.statusAll }, ...statusOptions.map((s) => ({ value: s, label: labels.matchingStatus(s) }))]}
        />
        <SortControl columns={sortColumns} sort={view.sort} direction={view.direction} onSort={view.setSort} onDirection={view.setDirection} labels={labels} />
      </div>

      {transactionsQuery.error ? (
        <div className="mt-4">
          <ErrorState error={transactionsQuery.error} onRetry={() => {}} />
        </div>
      ) : transactionsQuery.loading ? (
        <div className="mt-4">
          <TableSkeleton rows={8} columns={7} />
        </div>
      ) : (
        <div className="mt-4 hidden overflow-hidden overflow-x-auto rounded-xl border border-border bg-card sm:block">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{labels.columnDate}</TableHead>
                <TableHead>{labels.columnCounterparty}</TableHead>
                <TableHead>{labels.columnReference}</TableHead>
                <TableHead>{labels.columnAccount}</TableHead>
                <TableHead className="text-right">{labels.columnAmount}</TableHead>
                <TableHead>{labels.columnDirection}</TableHead>
                <TableHead>{labels.columnStatus}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.pageRows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setOpenTransaction(row)}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{adapter.formatDate(row.booking_date)}</TableCell>
                  <TableCell className="max-w-[220px] truncate font-medium text-foreground">{row.counterparty_holder ?? "—"}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{row.payment_reference ?? row.booking_text ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{accountById.get(row.account_id)?.account_name ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{adapter.formatMoney(row.amount)}</TableCell>
                  <TableCell>
                    <DirectionBadge direction={row.direction} />
                  </TableCell>
                  <TableCell>
                    <MatchStatusBadge status={row.matching_status} label={labels.matchingStatus} />
                  </TableCell>
                </TableRow>
              ))}
              {view.total === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {labels.empty}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!transactionsQuery.error && !transactionsQuery.loading && view.total > 0 && (
        <TablePagination
          page={view.page}
          totalPages={view.totalPages}
          pageSize={view.pageSize}
          total={view.total}
          from={view.from}
          to={view.to}
          onPage={view.setPage}
          onPageSize={view.setPageSize}
        />
      )}

      <BankMatchPanel transaction={openTransaction} onClose={() => setOpenTransaction(null)} adapter={adapter} labels={labels} />
    </div>
  );
}
