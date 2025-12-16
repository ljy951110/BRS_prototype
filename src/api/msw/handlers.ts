import { DashboardTableRequest, ProgressStageType } from "@/api/dashboard.types";
import type { TimePeriodType } from "@/App";
import {
  calculateExpectedRevenue,
  getDataWithPeriodChange,
  mockData,
} from "@/data/mockData";
import { Customer, PossibilityType } from "@/types/customer";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

const TIME_PERIOD_MAP: Record<string, TimePeriodType> = {
  WEEK: "1w",
  MONTH: "1m",
  HALF_YEAR: "6m",
  YEAR: "1y",
};

const getHighestStage = (
  ad: Customer["adoptionDecision"]
): ProgressStageType | null => {
  if (ad.contract) return "CLOSING";
  if (ad.approval) return "APPROVAL";
  if (ad.quote) return "QUOTE";
  if (ad.test) return "TEST";
  return null;
};

const toMonth = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getMonth() + 1;
  }
  const match = value.match(/(\d{1,2})/);
  return match ? Number(match[1]) : null;
};

const getExpectedRevenue = (customer: Customer) =>
  customer._periodData?.currentExpectedRevenue ??
  calculateExpectedRevenue(
    customer.adoptionDecision.targetRevenue,
    customer.adoptionDecision.possibility
  );

const inRange = (
  value: number | null | undefined,
  min?: number | null,
  max?: number | null
) => {
  if (value === null || value === undefined) return false;
  if (min !== null && min !== undefined && value < min) return false;
  if (max !== null && max !== undefined && value > max) return false;
  return true;
};

// MSW Handlers
const handlers = [
  http.post("/api/dashboard/overview/companies", async ({ request }) => {
    console.log('[MSW] 📥 Intercepted POST /api/dashboard/overview/companies');

    const body = (await request.json()) as DashboardTableRequest;
    console.log('[MSW] Request body:', body);

    const period = TIME_PERIOD_MAP[body.timePeriod] ?? "1w";
    const page = body.pagination?.page ?? 1;
    const pageSize = body.pagination?.pageSize ?? 50;

    const companyNameSearch = body.search?.companyName?.trim().toLowerCase();
    const filters = body.filters;

    let rows = getDataWithPeriodChange(mockData, period);

    if (companyNameSearch) {
      rows = rows.filter((row) =>
        row.companyName.toLowerCase().includes(companyNameSearch)
      );
    }

    if (filters?.companySizes?.length) {
      const sizes = new Set(filters.companySizes);
      rows = rows.filter((row) => sizes.has(row.companySize ?? null));
    }

    if (filters?.managers?.length) {
      const managers = new Set(filters.managers);
      rows = rows.filter((row) => managers.has(row.manager));
    }

    if (filters?.categories?.length) {
      const categories = new Set(filters.categories);
      rows = rows.filter((row) => categories.has(row.category));
    }

    if (filters?.possibilities?.length) {
      const possibilities = new Set<PossibilityType>(filters.possibilities);
      rows = rows.filter((row) =>
        possibilities.has(row.adoptionDecision.possibility)
      );
    }

    if (filters?.stages?.length) {
      const stages = new Set(filters.stages);
      rows = rows.filter((row) => {
        const stage = getHighestStage(row.adoptionDecision);
        return stage ? stages.has(stage) : false;
      });
    }

    if (filters?.contractAmountRange) {
      const min = filters.contractAmountRange.minMan
        ? filters.contractAmountRange.minMan * 10000
        : null;
      const max = filters.contractAmountRange.maxMan
        ? filters.contractAmountRange.maxMan * 10000
        : null;
      rows = rows.filter((row) => inRange(row.contractAmount ?? null, min, max));
    }

    if (filters?.expectedRevenueRange) {
      const min = filters.expectedRevenueRange.minMan
        ? filters.expectedRevenueRange.minMan * 10000
        : null;
      const max = filters.expectedRevenueRange.maxMan
        ? filters.expectedRevenueRange.maxMan * 10000
        : null;
      rows = rows.filter((row) => inRange(getExpectedRevenue(row), min, max));
    }

    if (filters?.targetMonths?.length) {
      const months = new Set(filters.targetMonths);
      rows = rows.filter((row) => {
        const month = toMonth(row.adoptionDecision.targetDate);
        return month ? months.has(month) : false;
      });
    }

    if (body.sort) {
      const { field, order } = body.sort;
      const modifier = order === "desc" ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const compareStrings = (x: string, y: string) =>
          x.localeCompare(y) * modifier;

        switch (field) {
          case "companyName":
            return compareStrings(a.companyName, b.companyName);
          case "companySize":
            return compareStrings(
              String(a.companySize ?? ""),
              String(b.companySize ?? "")
            );
          case "manager":
            return compareStrings(a.manager, b.manager);
          case "category":
            return compareStrings(a.category, b.category);
          case "trustIndex":
            return ((a.trustIndex ?? 0) - (b.trustIndex ?? 0)) * modifier;
          case "contractAmount":
            return ((a.contractAmount ?? 0) - (b.contractAmount ?? 0)) * modifier;
          case "possibility": {
            const aVal = Number(
              (a.adoptionDecision.possibility || "0").replace("%", "")
            );
            const bVal = Number(
              (b.adoptionDecision.possibility || "0").replace("%", "")
            );
            return (aVal - bVal) * modifier;
          }
          case "expectedRevenue": {
            const diff = getExpectedRevenue(a) - getExpectedRevenue(b);
            return diff * modifier;
          }
          case "targetDate": {
            const aDate = new Date(a.adoptionDecision.targetDate || 0).getTime();
            const bDate = new Date(b.adoptionDecision.targetDate || 0).getTime();
            return (aDate - bDate) * modifier;
          }
          default:
            return 0;
        }
      });
    }

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize).map((row) => ({
      ...row,
      expectedRevenue: getExpectedRevenue(row),
      periodChange: row._periodData
        ? {
          previousTrustIndex: row._periodData.pastTrustIndex,
          previousPossibility: row._periodData.pastPossibility,
          previousExpectedRevenue: row._periodData.pastExpectedRevenue,
          currentExpectedRevenue: row._periodData.currentExpectedRevenue,
          previousTargetMonth: toMonth(row._periodData.pastTargetDate),
          previousTest: row._periodData.pastTest,
          previousQuote: row._periodData.pastQuote,
          previousApproval: row._periodData.pastApproval,
          previousContract: row._periodData.pastContract,
        }
        : undefined,
    }));

    const response = {
      rows: paged,
      total,
      currentPage: page,
      pageSize,
    };

    console.log('[MSW] 📤 Sending response:', {
      totalRows: response.total,
      pagedRows: response.rows.length,
      page: response.currentPage,
    });

    return HttpResponse.json(response);
  }),
];

// MSW Worker
export const worker = setupWorker(...handlers);

