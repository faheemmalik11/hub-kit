import { FileText, Landmark } from "lucide-react";

import type { MoneyFigure, OverviewAdapter } from "../../adapters/overview";

const SAMPLE_MONEY_FIGURE: MoneyFigure = {
  value: 48250,
  count: 24,
  previousValue: 41000,
  loading: false,
};

function formatSampleMoney(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} EUR`;
}

// Static sample values for guided tours. This adapter never reads or writes real data.
export const placeholderOverviewAdapter: OverviewAdapter = {
  useMoneyFigures(ranges) {
    const data: Record<string, MoneyFigure> = {};
    for (const key of Object.keys(ranges)) {
      data[key] = SAMPLE_MONEY_FIGURE;
    }
    return { data, loading: false };
  },
  useInvoiceStages() {
    return {
      data: [
        { key: "inbox", label: "Inbox", count: 12, link: { to: "/" } },
        { key: "review", label: "Needs review", count: 5, link: { to: "/" } },
        { key: "approved", label: "Approved", count: 31, link: { to: "/" } },
      ],
      loading: false,
      error: false,
    };
  },
  useTopSuppliers() {
    return {
      data: {
        rows: [
          { key: "one", label: "Sample Supplier One", valueText: "18,400 EUR", sharePct: 100 },
          { key: "two", label: "Sample Supplier Two", valueText: "12,900 EUR", sharePct: 70 },
          { key: "three", label: "Sample Supplier Three", valueText: "6,300 EUR", sharePct: 34 },
        ],
        totalText: "37,600 EUR",
      },
      loading: false,
    };
  },
  useSpendByCompany() {
    return {
      data: {
        rows: [
          { key: "north", label: "Sample Company North", valueText: "22,100 EUR", sharePct: 100 },
          { key: "south", label: "Sample Company South", valueText: "15,500 EUR", sharePct: 70 },
        ],
        totalText: "37,600 EUR",
      },
      loading: false,
    };
  },
  useMoneyTrend() {
    return {
      data: [
        { label: "Week 1", incoming: 9200, outgoing: 7400 },
        { label: "Week 2", incoming: 11800, outgoing: 8100 },
        { label: "Week 3", incoming: 10400, outgoing: 9600 },
        { label: "Week 4", incoming: 13900, outgoing: 8800 },
      ],
      loading: false,
    };
  },
  useProcessingSummary() {
    return {
      data: {
        processed: 128,
        recognized: 119,
        needsReview: 7,
        errors: 2,
        channels: [
          { label: "Email", count: 84 },
          { label: "Upload", count: 44 },
        ],
        lastRunLabel: null,
      },
      loading: false,
      error: false,
    };
  },
  useOpenItemsSummary() {
    return {
      data: [
        {
          key: "due-soon",
          to: "/",
          icon: FileText,
          tone: "warning",
          label: "Due this week",
          value: "4",
        },
        {
          key: "overdue",
          to: "/",
          icon: FileText,
          tone: "danger",
          label: "Overdue",
          value: "2",
        },
      ],
      loading: false,
      error: false,
    };
  },
  useBankSummary() {
    return {
      data: [
        {
          key: "unmatched",
          to: "/",
          icon: Landmark,
          tone: "neutral",
          label: "Unmatched transactions",
          value: "9",
        },
      ],
      loading: false,
      error: false,
    };
  },
  formatMoney: formatSampleMoney,
  formatMoneyCompact: formatSampleMoney,
  formatDay: (iso) => iso,
};
