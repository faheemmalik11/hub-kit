import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  DashboardPanel,
  MoneyCardsRow,
  MoneyTrendChart,
  PeriodPicker,
  PipelineStagesPanel,
  ProcessingSummaryPanel,
  RankedListPanel,
  StatRowsPanel,
  englishPeriodLabels,
  overviewPeriodRange,
  previousPeriodRange,
  readStoredPeriod,
  writeStoredPeriod,
  useStoredPeriod,
  type MoneyCardSpec,
  type PeriodLabels,
  type PeriodValue,
} from "../../components/dashboard";
import type { OverviewAdapter, PeriodRange } from "../../adapters/overview";
import { englishOverviewLabels, type OverviewLabels } from "./labels";

export type OverviewWidget =
  | "moneyCards"
  | "trendChart"
  | "stages"
  | "topSuppliers"
  | "spendByCompany"
  | "processing"
  | "openItems"
  | "bank";

const ALL_WIDGETS: OverviewWidget[] = [
  "moneyCards",
  "trendChart",
  "stages",
  "topSuppliers",
  "spendByCompany",
  "processing",
  "openItems",
  "bank",
];

export interface OverviewPageProps {
  adapter: OverviewAdapter;
  moneyCards: MoneyCardSpec[];
  widgets?: OverviewWidget[];
  alertStrip?: ReactNode;
  labels?: OverviewLabels;
  periodLabels?: PeriodLabels;
}

export function OverviewPage({
  adapter,
  moneyCards,
  widgets = ALL_WIDGETS,
  alertStrip,
  labels = englishOverviewLabels,
  periodLabels = englishPeriodLabels,
}: OverviewPageProps) {
  const show = (widget: OverviewWidget) => widgets.includes(widget);

  const [moneyPeriods, setMoneyPeriod] = useMoneyCardPeriods(moneyCards);
  const [trendPeriod, setTrendPeriod] = useStoredPeriod("chart");
  const [stagesPeriod, setStagesPeriod] = useStoredPeriod("stages");
  const [suppliersPeriod, setSuppliersPeriod] = useStoredPeriod("suppliers");
  const [companiesPeriod, setCompaniesPeriod] = useStoredPeriod("companies");
  const [processingPeriod, setProcessingPeriod] = useStoredPeriod("processing");

  const trendRange = useMemo(
    () => overviewPeriodRange(trendPeriod.period, new Date(), trendPeriod),
    [trendPeriod],
  );
  const stagesRange = useMemo(
    () => overviewPeriodRange(stagesPeriod.period, new Date(), stagesPeriod),
    [stagesPeriod],
  );
  const suppliersRange = useMemo(
    () => overviewPeriodRange(suppliersPeriod.period, new Date(), suppliersPeriod),
    [suppliersPeriod],
  );
  const companiesRange = useMemo(
    () => overviewPeriodRange(companiesPeriod.period, new Date(), companiesPeriod),
    [companiesPeriod],
  );
  const processingRange = useMemo(
    () => overviewPeriodRange(processingPeriod.period, new Date(), processingPeriod),
    [processingPeriod],
  );

  const moneyRanges = useMemo(() => {
    const ranges: Record<string, PeriodRange> = {};
    for (const card of moneyCards) {
      const period = moneyPeriods[card.key];
      ranges[card.key] = overviewPeriodRange(period.period, new Date(), period);
    }
    return ranges;
  }, [moneyCards, moneyPeriods]);
  const moneyFigures = adapter.useMoneyFigures(moneyRanges);
  const trend = adapter.useMoneyTrend(trendRange);
  const stages = adapter.useInvoiceStages(stagesRange);
  const suppliers = adapter.useTopSuppliers(suppliersRange);
  const companies = adapter.useSpendByCompany(companiesRange);
  const processing = adapter.useProcessingSummary(processingRange);
  const openItems = adapter.useOpenItemsSummary();
  const bank = adapter.useBankSummary();

  return (
    <div>
      {alertStrip}

      {(show("moneyCards") || show("trendChart")) && (
        <div className="grid gap-3 lg:grid-cols-3">
          {show("moneyCards") && (
            <section className="min-w-0 lg:col-span-2">
              <MoneyCardsRow
                cards={moneyCards}
                figures={moneyFigures.data}
                periods={moneyPeriods}
                onPeriodChange={setMoneyPeriod}
                periodLabels={periodLabels}
                formatMoney={adapter.formatMoney}
                formatDay={adapter.formatDay}
              />
            </section>
          )}

          {show("trendChart") && (
            <DashboardPanel
              title={labels.trendChart.title}
              headerRight={
                <PeriodPicker
                  value={trendPeriod}
                  onChange={setTrendPeriod}
                  labels={periodLabels}
                  formatDay={adapter.formatDay}
                />
              }
              className="overflow-hidden"
            >
              <div className="mt-2">
                <MoneyTrendChart
                  data={trend.data}
                  loading={trend.loading}
                  incomingLabel={labels.trendChart.incoming}
                  outgoingLabel={labels.trendChart.outgoing}
                  formatMoney={adapter.formatMoney}
                  formatMoneyCompact={adapter.formatMoneyCompact}
                />
              </div>
            </DashboardPanel>
          )}
        </div>
      )}

      {(show("stages") || show("topSuppliers")) && (
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {show("stages") && (
            <div className="min-w-0 lg:col-span-2">
              <PipelineStagesPanel
                title={labels.stagesTitle}
                stages={stages.data}
                loading={stages.loading}
                error={stages.error}
                period={stagesPeriod}
                onPeriodChange={setStagesPeriod}
                periodLabels={periodLabels}
                formatDay={adapter.formatDay}
                className="h-full"
              />
            </div>
          )}
          {show("topSuppliers") && (
            <RankedListPanel
              title={labels.topSuppliersTitle(suppliers.data.rows.length)}
              totalLabel={labels.rankTotal(suppliers.data.totalText)}
              rows={suppliers.data.rows}
              loading={suppliers.loading}
              period={suppliersPeriod}
              onPeriodChange={setSuppliersPeriod}
              periodLabels={periodLabels}
              formatDay={adapter.formatDay}
            />
          )}
        </div>
      )}

      {(show("processing") || show("spendByCompany") || show("openItems") || show("bank")) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {show("processing") && (
            <ProcessingSummaryPanel
              title={labels.processing.title}
              seeAllLabel={labels.processing.seeAll}
              seeAllTo="/protokoll"
              summary={processing.data}
              loading={processing.loading}
              error={processing.error}
              labels={{
                processed: labels.processing.processed,
                recognized: labels.processing.recognized,
                needsReview: labels.processing.needsReview,
                errors: labels.processing.errors,
                channelsPrefix: labels.processing.channelsPrefix,
              }}
              period={processingPeriod}
              onPeriodChange={setProcessingPeriod}
              periodLabels={periodLabels}
              formatDay={adapter.formatDay}
            />
          )}
          {show("spendByCompany") && (
            <RankedListPanel
              title={labels.spendByCompanyTitle(companies.data.rows.length)}
              totalLabel={labels.rankTotal(companies.data.totalText)}
              rows={companies.data.rows}
              loading={companies.loading}
              period={companiesPeriod}
              onPeriodChange={setCompaniesPeriod}
              periodLabels={periodLabels}
              formatDay={adapter.formatDay}
            />
          )}
          {show("openItems") && (
            <StatRowsPanel
              title={labels.openItems.title}
              rows={openItems.data}
              loading={openItems.loading}
              emptyText={labels.openItems.empty}
              footerLink={{ to: "/offene-posten", label: labels.openItems.seeAll }}
            />
          )}
          {show("bank") && (
            <StatRowsPanel
              title={labels.bank.title}
              rows={bank.data}
              loading={bank.loading}
              footerLink={{ to: "/banktransaktionen", label: labels.bank.seeAll }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function useMoneyCardPeriods(
  cards: MoneyCardSpec[],
): [Record<string, PeriodValue>, (cardKey: string, value: PeriodValue) => void] {
  const [periods, setPeriods] = useState<Record<string, PeriodValue>>(() => {
    const initial: Record<string, PeriodValue> = {};
    for (const card of cards) initial[card.key] = readStoredPeriod(`card.${card.key}`);
    return initial;
  });
  const setPeriod = (cardKey: string, value: PeriodValue) => {
    setPeriods((current) => ({ ...current, [cardKey]: value }));
    writeStoredPeriod(`card.${cardKey}`, value);
  };
  return [periods, setPeriod];
}

export { previousPeriodRange };
