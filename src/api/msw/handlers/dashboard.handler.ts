/**
 * Dashboard API MSW Handlers
 * 대시보드 관련 API mock handlers
 */

import {
  calculateExpectedRevenue,
  getDataWithPeriodChange,
  mockData,
} from "@/data/mockData";
import type {
  Category,
  DashboardTableRequest,
  DashboardTableResponse,
  DashboardTableRow,
  Possibility,
} from "@/repository/openapi/model";
import type { TimePeriodType } from "@/types/common";
import { CategoryType, Customer, PossibilityType } from "@/types/customer";
import dayjs from "dayjs";
import { http, HttpResponse } from "msw";

// ==================== Helper Functions ====================

/**
 * Customer 카테고리 타입 → OpenAPI Category 타입 매핑
 */
const mapCategory = (category: CategoryType): Category | null => {
  const map: Record<CategoryType, Category> = {
    "채용": 'recruit' as Category,
    "공공": 'public' as Category,
    "병원": 'public' as Category, // 병원은 공공으로 매핑
    "성과": 'performance' as Category,
  };
  return map[category] || null;
};

/**
 * Customer 가능성 타입 → OpenAPI Possibility 타입 매핑
 */
const mapPossibility = (possibility: PossibilityType | undefined): Possibility | null => {
  if (!possibility) return null;
  return possibility as unknown as Possibility;
};

/**
 * dateRange로부터 TimePeriod 계산
 */
const calculatePeriod = (startDate: string, endDate: string): TimePeriodType => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const days = end.diff(start, 'day');

  if (days <= 7) return '1w';
  if (days <= 30) return '1m';
  if (days <= 180) return '6m';
  return '1y';
};

/**
 * 목표일자를 월(month)로 변환
 */
const toMonth = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getMonth() + 1;
  }
  const match = value.match(/(\d{1,2})/);
  return match ? Number(match[1]) : null;
};

/**
 * 예상 매출 계산
 */
const getExpectedRevenue = (customer: Customer) =>
  customer._periodData?.currentExpectedRevenue ??
  calculateExpectedRevenue(
    customer.adoptionDecision?.targetRevenue,
    customer.adoptionDecision?.possibility
  );

/**
 * 숫자 범위 체크
 */
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

// ==================== API Handlers ====================

/**
 * 필터 옵션 조회
 * GET /api/v1/dashboard/companies/filters
 */
export const getFilterOptionsHandler = http.get(
  "/api/v1/dashboard/companies/filters",
  () => {
    console.log('[MSW] 📥 Intercepted GET /api/v1/dashboard/companies/filters');

    const uniqueManagers = Array.from(new Set(mockData.map(c => c.manager)));
    const uniqueCategories = Array.from(new Set(mockData.map(c => mapCategory(c.category)).filter(Boolean)));
    const uniqueCompanySizes = Array.from(new Set(mockData.map(c => c.companySize).filter(Boolean)));
    const uniquePossibilities = Array.from(new Set(mockData.map(c => mapPossibility(c.adoptionDecision?.possibility)).filter(Boolean)));

    const response = {
      managers: uniqueManagers,
      categories: uniqueCategories,
      companySizes: uniqueCompanySizes,
      possibilities: uniquePossibilities,
      mbmPipelineStatuses: ['test', 'quote', 'approval', 'contract'],
    };

    console.log('[MSW] 📤 Sending filter options:', response);
    return HttpResponse.json(response);
  }
);

/**
 * 대시보드 테이블 데이터 조회
 * POST /api/v1/dashboard/companies
 */
export const getDashboardCompaniesHandler = http.post(
  "/api/v1/dashboard/companies",
  async ({ request }) => {
    console.log('[MSW] 📥 Intercepted POST /api/v1/dashboard/companies');

    const body = (await request.json()) as DashboardTableRequest;
    console.log('[MSW] Request body:', body);

    // dateRange에서 기간 계산
    const period = calculatePeriod(body.dateRange.startDate, body.dateRange.endDate);
    const page = body.pagination?.page ?? 1;
    const pageSize = body.pagination?.pageSize ?? 50;

    const companyNameSearch = body.search?.companyName?.trim().toLowerCase();
    const filters = body.filters;

    let rows = getDataWithPeriodChange(mockData, period);

    // ==================== 필터링 ====================

    // 기업명 검색
    if (companyNameSearch) {
      rows = rows.filter((row) =>
        row.companyName.toLowerCase().includes(companyNameSearch)
      );
    }

    // 기업 규모 필터
    if (filters?.companySizes?.length) {
      const sizes = new Set(filters.companySizes);
      rows = rows.filter((row) => {
        const size = row.companySize;
        return size ? sizes.has(size) : false;
      });
    }

    // 담당자 필터
    if (filters?.managers?.length) {
      const managers = new Set(filters.managers);
      rows = rows.filter((row) => managers.has(row.manager));
    }

    // 카테고리 필터
    if (filters?.categories?.length) {
      const categories = new Set(filters.categories);
      rows = rows.filter((row) => {
        const mappedCategory = mapCategory(row.category);
        return mappedCategory ? categories.has(mappedCategory) : false;
      });
    }

    // 가능성 필터
    if (filters?.possibilities?.length) {
      const possibilities = new Set(filters.possibilities);
      rows = rows.filter((row) => {
        const mappedPossibility = mapPossibility(row.adoptionDecision?.possibility);
        return mappedPossibility ? possibilities.has(mappedPossibility) : false;
      });
    }

    // 진행 단계 필터
    if (filters?.stages?.length) {
      rows = rows.filter((row) => {
        const ad = row.adoptionDecision;
        if (!ad) return false;
        return filters.stages?.some(stage => {
          if (stage === 'test') return ad.test;
          if (stage === 'quote') return ad.quote;
          if (stage === 'approval') return ad.approval;
          if (stage === 'contract') return ad.contract;
          return false;
        });
      });
    }

    // 계약금액 범위 필터
    if (filters?.contractAmountRange) {
      const min = filters.contractAmountRange.minMan
        ? filters.contractAmountRange.minMan * 10000
        : null;
      const max = filters.contractAmountRange.maxMan
        ? filters.contractAmountRange.maxMan * 10000
        : null;
      rows = rows.filter((row) => inRange(row.contractAmount ?? null, min, max));
    }

    // 예상 매출 범위 필터
    if (filters?.expectedRevenueRange) {
      const min = filters.expectedRevenueRange.minMan
        ? filters.expectedRevenueRange.minMan * 10000
        : null;
      const max = filters.expectedRevenueRange.maxMan
        ? filters.expectedRevenueRange.maxMan * 10000
        : null;
      rows = rows.filter((row) => inRange(getExpectedRevenue(row), min, max));
    }

    // 목표 월 필터
    if (filters?.targetMonths?.length) {
      const months = new Set(filters.targetMonths);
      rows = rows.filter((row) => {
        const month = toMonth(row.adoptionDecision?.targetDate);
        return month ? months.has(month) : false;
      });
    }

    // ==================== 정렬 ====================

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
              (a.adoptionDecision?.possibility || "0").replace("%", "")
            );
            const bVal = Number(
              (b.adoptionDecision?.possibility || "0").replace("%", "")
            );
            return (aVal - bVal) * modifier;
          }
          case "expectedRevenue": {
            const diff = getExpectedRevenue(a) - getExpectedRevenue(b);
            return diff * modifier;
          }
          case "targetDate": {
            const aDate = new Date(a.adoptionDecision?.targetDate || 0).getTime();
            const bDate = new Date(b.adoptionDecision?.targetDate || 0).getTime();
            return (aDate - bDate) * modifier;
          }
          default:
            return 0;
        }
      });
    }

    // ==================== 페이지네이션 ====================

    const total = rows.length;
    const start = (page - 1) * pageSize;

    // Customer -> DashboardTableRow 변환
    const paged: DashboardTableRow[] = rows.slice(start, start + pageSize).map((row) => {
      const ad = row.adoptionDecision;
      const pd = row._periodData;

      return {
        companyId: row.no,
        companyName: row.companyName,
        companySize: row.companySize ?? null,
        manager: row.manager ?? null,
        category: mapCategory(row.category),
        contractAmount: row.contractAmount ?? null,
        productUsage: row.productUsage || [],
        lastMBMDate: null, // TODO: 실제 데이터에서 계산
        lastContactDate: null, // TODO: 실제 데이터에서 계산

        // current (현재 데이터)
        current: {
          trustIndex: row.trustIndex ?? null,
          possibility: mapPossibility(ad?.possibility) ?? undefined,
          targetRevenue: ad?.targetRevenue ?? null,
          targetMonth: toMonth(ad?.targetDate),
          test: ad?.test ?? false,
          quote: ad?.quote ?? false,
          approval: ad?.approval ?? false,
          contract: ad?.contract ?? false,
        },

        // previous (과거 데이터)
        previous: pd
          ? {
            trustIndex: pd.pastTrustIndex ?? null,
            possibility: mapPossibility(pd.pastPossibility) ?? undefined,
            targetRevenue: pd.pastExpectedRevenue ?? null,
            targetMonth: toMonth(pd.pastTargetDate),
            test: pd.pastTest ?? false,
            quote: pd.pastQuote ?? false,
            approval: pd.pastApproval ?? false,
            contract: pd.pastContract ?? false,
          }
          : {
            trustIndex: row.trustIndex ?? null,
            possibility: mapPossibility(ad?.possibility) ?? undefined,
            targetRevenue: ad?.targetRevenue ?? null,
            targetMonth: toMonth(ad?.targetDate),
            test: ad?.test ?? false,
            quote: ad?.quote ?? false,
            approval: ad?.approval ?? false,
            contract: ad?.contract ?? false,
          },
      };
    });

    const response: DashboardTableResponse = {
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
  }
);

