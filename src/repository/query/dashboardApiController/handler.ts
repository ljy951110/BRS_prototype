/**
 * Dashboard API MSW Handlers
 * 대시보드 관련 API mock handlers
 */

import type {
  DashboardTableRequest,
  DashboardTableResponse,
  DashboardTableRow,
} from "@/repository/openapi/model";
// CompanySize import (사용하지 않음)
import { http, HttpResponse } from "msw";

// Window 타입 확장
declare global {
  interface Window {
    __API_MODE__?: 'msw' | 'api';
  }
}

// ==================== Mock Data ====================

/**
 * Dashboard API용 Mock 데이터 (DashboardTableRow 형식)
 * 실제 서비스에서는 이 데이터가 DB에서 조회됩니다
 */
const MOCK_DASHBOARD_DATA: DashboardTableRow[] = [
  {
    companyId: 4,
    companyName: "비전바이오켐",
    companySize: "T0",
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이정호",
    contractAmount: 11000000,
    lastMBMDate: "2024-11-07",
    lastContactDate: "2024-12-15",
    current: {
      trustIndex: 40,
      possibility: 40,
      targetMonth: 1,
      targetRevenue: 5000000,
      test: true,
      quote: true,
      approval: true,
      contract: false,
    },
    previous: {
      trustIndex: 36,
      possibility: 0,
      targetMonth: null,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 8,
    companyName: "도쿄일렉트론코리아",
    companySize: "T10" as any, // T9는 OpenAPI에 없으므로 T10 사용
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이정호",
    contractAmount: 50000000,
    lastMBMDate: "2024-12-09",
    lastContactDate: "2024-12-16",
    current: {
      trustIndex: 28,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 5000000,
      test: true,
      quote: true,
      approval: true,
      contract: true,
    },
    previous: {
      trustIndex: 25,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 3000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 24,
    companyName: "서울도시가스",
    companySize: "T5",
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이정호",
    contractAmount: 41250000,
    current: {
      trustIndex: 55,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 58000000,
      test: true,
      quote: true,
      approval: true,
      contract: true,
    },
    previous: {
      trustIndex: 48,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 40000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 25,
    companyName: "AJ네트웍스",
    companySize: "T10" as any, // T9는 OpenAPI에 없으므로 T10 사용
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이정호",
    contractAmount: 62400000,
    current: {
      trustIndex: 17,
      possibility: 40,
      targetMonth: 1,
      targetRevenue: 8000000,
      test: true,
      quote: true,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 19,
      possibility: 0,
      targetMonth: null,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 30,
    companyName: "(주)도루코",
    companySize: "T1",
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이정호",
    contractAmount: 15200000,
    current: {
      trustIndex: 66,
      possibility: 40,
      targetMonth: 2,
      targetRevenue: 8000000,
      test: true,
      quote: true,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 74,
      possibility: 40,
      targetMonth: 2,
      targetRevenue: 10000000,
      test: true,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 43,
    companyName: "대한제분",
    companySize: "T1",
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이정호",
    contractAmount: 10000000,
    current: {
      trustIndex: 39,
      possibility: 0,
      targetMonth: null,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 48,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 5000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 217,
    companyName: "한국컴패션",
    companySize: "T1",
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "윤상준",
    contractAmount: 6300000,
    current: {
      trustIndex: 10,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 6000000,
      test: true,
      quote: true,
      approval: true,
      contract: false,
    },
    previous: {
      trustIndex: 10,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 3000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 237,
    companyName: "빙그레",
    companySize: "T5",
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이지훈",
    contractAmount: 33000000,
    current: {
      trustIndex: 26,
      possibility: 90,
      targetMonth: 11,
      targetRevenue: 29600000,
      test: true,
      quote: true,
      approval: true,
      contract: true,
    },
    previous: {
      trustIndex: 19,
      possibility: 40,
      targetMonth: 11,
      targetRevenue: 20000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 240,
    companyName: "유라코포레이션",
    companySize: "T10" as any, // T9는 OpenAPI에 없으므로 T10 사용
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이지훈",
    contractAmount: 30000000,
    current: {
      trustIndex: 23,
      possibility: 90,
      targetMonth: 11,
      targetRevenue: 30000000,
      test: true,
      quote: true,
      approval: true,
      contract: true,
    },
    previous: {
      trustIndex: 15,
      possibility: 40,
      targetMonth: 11,
      targetRevenue: 20000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 242,
    companyName: "농우바이오",
    companySize: "T1",
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이지훈",
    contractAmount: 10030000,
    current: {
      trustIndex: 21,
      possibility: 90,
      targetMonth: 11,
      targetRevenue: 10030000,
      test: true,
      quote: true,
      approval: true,
      contract: true,
    },
    previous: {
      trustIndex: 16,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 8000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 272,
    companyName: "메리츠캐피탈",
    companySize: "T10",
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "이지훈",
    contractAmount: 10000000,
    current: {
      trustIndex: 46,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 3500000,
      test: true,
      quote: true,
      approval: true,
      contract: true,
    },
    previous: {
      trustIndex: 49,
      possibility: 40,
      targetMonth: 11,
      targetRevenue: 2000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 299,
    companyName: "에이플러스에셋어드바이저",
    companySize: "T3",
    categories: ["recruit"],
    productUsage: ["ACC"],
    manager: "이정호",
    contractAmount: 2000000,
    current: {
      trustIndex: 47,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 5000000,
      test: true,
      quote: true,
      approval: true,
      contract: false,
    },
    previous: {
      trustIndex: 56,
      possibility: 0,
      targetMonth: null,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 373,
    companyName: "안국건강",
    companySize: "T0",
    categories: ["recruit"],
    productUsage: ["ACC"],
    manager: "김택수",
    contractAmount: 2700000,
    current: {
      trustIndex: 96,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 1500000,
      test: true,
      quote: true,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 94,
      possibility: 0,
      targetMonth: null,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 468,
    companyName: "에스테이트",
    companySize: "T0",
    categories: ["recruit"],
    productUsage: ["ACC"],
    manager: "윤상준",
    contractAmount: 2700000,
    current: {
      trustIndex: 14,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 6000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 15,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 4000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 510,
    companyName: "에이치비테크놀러지",
    companySize: "T3",
    categories: ["recruit"],
    productUsage: ["ACC"],
    manager: "이지훈",
    contractAmount: 1000000,
    current: {
      trustIndex: 16,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 1000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 19,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 500000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 553,
    companyName: "동오그룹",
    companySize: "T5",
    categories: ["recruit"],
    productUsage: ["ATS"],
    manager: "김종현",
    contractAmount: 17000000,
    current: {
      trustIndex: 62,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 8000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 57,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 5000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 597,
    companyName: "삼우종합건축사사무소",
    companySize: "T5",
    categories: ["recruit"],
    productUsage: ["ATS"],
    manager: "유재현",
    contractAmount: 15000000,
    current: {
      trustIndex: 86,
      possibility: 40,
      targetMonth: 1,
      targetRevenue: 3750000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 82,
      possibility: 0,
      targetMonth: null,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 708,
    companyName: "디비아이엔씨",
    companySize: "T10" as any, // T9는 OpenAPI에 없으므로 T10 사용
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "윤상준",
    contractAmount: 240000000,
    current: {
      trustIndex: 32,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 4000000,
      test: true,
      quote: true,
      approval: true,
      contract: false,
    },
    previous: {
      trustIndex: 28,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 3000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 709,
    companyName: "해안종합건축사사무소",
    companySize: "T5",
    categories: ["recruit"],
    productUsage: ["ATS", "ACC"],
    manager: "윤상준",
    contractAmount: 50000000,
    current: {
      trustIndex: 35,
      possibility: 90,
      targetMonth: 12,
      targetRevenue: 10000000,
      test: true,
      quote: false,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 32,
      possibility: 40,
      targetMonth: 12,
      targetRevenue: 8000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 637,
    companyName: "엠로",
    companySize: "T3",
    categories: ["recruit"],
    productUsage: ["ATS"],
    manager: "이지훈",
    contractAmount: 24000000,
    current: {
      trustIndex: 51,
      possibility: 90,
      targetMonth: 8,
      targetRevenue: 24000000,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 54,
      possibility: 0,
      targetMonth: null,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 1046,
    companyName: "(주)도루코 성과",
    companySize: "T10",
    categories: ["performance"],
    productUsage: ["INHR_PLUS"],
    manager: "김용진",
    contractAmount: 24800000,
    current: {
      trustIndex: 82,
      possibility: 40,
      targetMonth: 1,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 78,
      possibility: 40,
      targetMonth: null,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
  {
    companyId: 710,
    companyName: "국가과학기술인력개발원",
    companySize: "T5",
    categories: ["public"],
    productUsage: ["ATS", "ACCSR"],
    manager: "송병규",
    contractAmount: 10000000,
    current: {
      trustIndex: 45,
      possibility: 40,
      targetMonth: 1,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
    previous: {
      trustIndex: 42,
      possibility: 0,
      targetMonth: null,
      targetRevenue: null,
      test: false,
      quote: false,
      approval: false,
      contract: false,
    },
  },
];

// ==================== Helper Functions ====================

/**
 * 예상 매출 계산 (목표매출 * 가능성)
 */
const calculateExpectedRevenue = (
  targetRevenue: number | null | undefined,
  possibility: number | null | undefined
): number => {
  if (!targetRevenue || possibility == null) return 0;

  // possibility는 이제 0, 10, 40, 90, 100 같은 integer 값
  const rate = possibility / 100;
  return Math.round(targetRevenue * rate);
};

/**
 * Mock 데이터에 lastMBMDate, lastContactDate, expectedRevenue 추가 및 possibility 변환
 * 실제 서비스에서는 DB에서 계산되어 반환됨
 */
const enrichMockData = (rows: DashboardTableRow[]): DashboardTableRow[] => {
  const MBM_DATES = ["2024-11-07", "2024-12-09", "2024-12-18"];

  return rows.map((row) => {
    // possibility를 string에서 integer로 변환
    const convertPossibility = (poss: any): number | null => {
      if (typeof poss === 'number') return poss;
      if (typeof poss === 'string') {
        const num = parseInt(poss.replace('%', ''));
        return isNaN(num) ? null : num;
      }
      return null;
    };

    const currentPossibility = convertPossibility(row.current.possibility);
    const previousPossibility = convertPossibility(row.previous.possibility);

    // expectedRevenue 계산
    const currentExpectedRevenue = calculateExpectedRevenue(
      row.current.targetRevenue,
      currentPossibility
    );
    const previousExpectedRevenue = calculateExpectedRevenue(
      row.previous.targetRevenue,
      previousPossibility
    );

    // lastMBMDate가 이미 있으면 그대로 사용, 없으면 생성
    if (row.lastMBMDate === undefined) {
      // 회사 ID에 따라 일관된 MBM 날짜 할당
      const mbmIndex = row.companyId % 4; // 0, 1, 2, 3
      row.lastMBMDate = mbmIndex === 3 ? null : MBM_DATES[mbmIndex % MBM_DATES.length];
    }

    // lastContactDate가 이미 있으면 그대로 사용, 없으면 생성
    if (row.lastContactDate === undefined) {
      // 회사 ID에 따라 일관된 컨택 날짜 할당 (2024-11-10 ~ 2024-12-18)
      const dayOffset = (row.companyId * 7) % 39; // 0~38일 범위
      const baseDate = new Date("2024-11-10");
      baseDate.setDate(baseDate.getDate() + dayOffset);
      row.lastContactDate = baseDate.toISOString().split('T')[0];

      // 일부 회사는 컨택이 없음 (10%는 null)
      if (row.companyId % 10 === 0) {
        row.lastContactDate = null;
      }
    }

    return {
      ...row,
      current: {
        ...row.current,
        possibility: currentPossibility,
        expectedRevenue: currentExpectedRevenue,
      },
      previous: {
        ...row.previous,
        possibility: previousPossibility,
        expectedRevenue: previousExpectedRevenue,
      },
    };
  });
};

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
    // API 모드일 때는 MSW를 bypass하고 실제 API 호출
    const apiMode = window.__API_MODE__ || localStorage.getItem('apiMode');
    if (apiMode === 'api') {
      console.log('[MSW] ⏩ Bypassing to real API (mode: api)');
      return;
    }

    console.log('[MSW] 📥 Intercepted GET /api/v1/dashboard/companies/filters');

    const enrichedData = enrichMockData(MOCK_DASHBOARD_DATA);

    // 담당자 매핑 (이름 -> owner_id)
    const managerMapping: Record<string, string> = {
      '이정호': 'owner_001',
      '윤상준': 'owner_002',
      '이지훈': 'owner_003',
      '김택수': 'owner_004',
      '김종현': 'owner_005',
      '유재현': 'owner_006',
      '김용진': 'owner_007',
      '송병규': 'owner_008',
    };

    const uniqueManagers = Array.from(new Set(enrichedData.map(d => d.manager)))
      .filter((name): name is string => name !== null && name !== undefined)
      .map(name => ({
        owner_id: managerMapping[name] || `owner_${name}`,
        name: name
      }));
    const uniqueCategories = Array.from(new Set(enrichedData.flatMap(d => d.categories || []).filter(Boolean)));
    const uniqueCompanySizes = Array.from(new Set(enrichedData.map(d => d.companySize).filter(Boolean)));

    const response = {
      managers: uniqueManagers,
      categories: uniqueCategories,
      companySizes: uniqueCompanySizes,
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
    // API 모드일 때는 MSW를 bypass하고 실제 API 호출
    const apiMode = window.__API_MODE__ || localStorage.getItem('apiMode');
    if (apiMode === 'api') {
      console.log('[MSW] ⏩ Bypassing to real API (mode: api)');
      return;
    }

    console.log('[MSW] 📥 Intercepted POST /api/v1/dashboard/companies');

    const body = (await request.json()) as DashboardTableRequest;
    console.log('[MSW] Request body:', body);

    const page = body.pagination?.page ?? 1;
    const pageSize = body.pagination?.pageSize ?? 50;

    const companyNameSearch = body.search?.companyName?.trim().toLowerCase();
    const filters = body.filters;

    let rows = enrichMockData([...MOCK_DASHBOARD_DATA]);

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

    // 담당자 필터 (owner_id -> 이름으로 변환)
    if (filters?.managers?.length) {
      const ownerIdToName: Record<string, string> = {
        'owner_001': '이정호',
        'owner_002': '윤상준',
        'owner_003': '이지훈',
        'owner_004': '김택수',
        'owner_005': '김종현',
        'owner_006': '유재현',
        'owner_007': '김용진',
        'owner_008': '송병규',
      };
      const managerNames = new Set(filters.managers.map(ownerId => ownerIdToName[ownerId] || ownerId));
      rows = rows.filter((row) => row.manager && managerNames.has(row.manager));
    }

    // 카테고리 필터
    if (filters?.categories?.length) {
      const categories = new Set(filters.categories);
      rows = rows.filter((row) => row.categories && row.categories.some(c => categories.has(c)));
    }

    // 제품 사용 필터
    if (filters?.productUsages?.length) {
      const productUsages = new Set(filters.productUsages);
      rows = rows.filter((row) =>
        row.productUsage && row.productUsage.some(p => productUsages.has(p))
      );
    }

    // 가능성 범위 필터
    if (filters?.possibilityRange) {
      const { min, max } = filters.possibilityRange;
      rows = rows.filter((row) => {
        const possibility = row.current.possibility;
        if (possibility === null || possibility === undefined) return false;
        if (min !== null && min !== undefined && possibility < min) return false;
        if (max !== null && max !== undefined && possibility > max) return false;
        return true;
      });
    }

    // 진행 단계 필터
    if (filters?.stages?.length) {
      rows = rows.filter((row) => {
        return filters.stages?.some(stage => {
          if (stage === 'test') return row.current.test;
          if (stage === 'quote') return row.current.quote;
          if (stage === 'approval') return row.current.approval;
          if (stage === 'contract') return row.current.contract;
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
      rows = rows.filter((row) => {
        const expectedRevenue = calculateExpectedRevenue(row.current.targetRevenue, row.current.possibility);
        return inRange(expectedRevenue, min, max);
      });
    }

    // 목표일자 범위 필터
    if (filters?.targetMonthRange) {
      const { start, end } = filters.targetMonthRange;
      rows = rows.filter((row) => {
        const targetMonth = row.current.targetMonth;
        if (!targetMonth) return false;
        // targetMonth를 날짜로 변환 (현재 년도 기준, 또는 다음 년도)
        const now = new Date("2024-12-10");
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const targetYear = targetMonth < currentMonth ? currentYear + 1 : currentYear;
        const targetDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;

        if (start && targetDate < start) return false;
        if (end && targetDate > end) return false;
        return true;
      });
    }

    // 마지막 컨택일 범위 필터
    if (filters?.lastContactDateRange) {
      const { start, end } = filters.lastContactDateRange;
      rows = rows.filter((row) => {
        const contactDate = row.lastContactDate;
        if (!contactDate) return false;
        if (start && contactDate < start) return false;
        if (end && contactDate > end) return false;
        return true;
      });
    }

    // ==================== 정렬 ====================

    if (body.sort) {
      const { field, order } = body.sort;
      const modifier = order === "desc" ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const compareStrings = (x: string | null | undefined, y: string | null | undefined) =>
          ((x || "").localeCompare(y || "")) * modifier;

        switch (field) {
          case "companyName":
            return compareStrings(a.companyName, b.companyName);
          case "companySize":
            return compareStrings(a.companySize ?? null, b.companySize ?? null);
          case "manager":
            return compareStrings(a.manager ?? null, b.manager ?? null);
          case "category":
            return compareStrings(a.categories?.[0] ?? null, b.categories?.[0] ?? null);
          case "trustIndex":
            return ((a.current.trustIndex ?? 0) - (b.current.trustIndex ?? 0)) * modifier;
          case "contractAmount":
            return ((a.contractAmount ?? 0) - (b.contractAmount ?? 0)) * modifier;
          case "possibility": {
            const aVal = a.current.possibility ?? 0;
            const bVal = b.current.possibility ?? 0;
            return (aVal - bVal) * modifier;
          }
          case "expectedRevenue": {
            const aRev = calculateExpectedRevenue(a.current.targetRevenue, a.current.possibility);
            const bRev = calculateExpectedRevenue(b.current.targetRevenue, b.current.possibility);
            return (aRev - bRev) * modifier;
          }
          case "targetDate": {
            const aMonth = a.current.targetMonth ?? 0;
            const bMonth = b.current.targetMonth ?? 0;
            return (aMonth - bMonth) * modifier;
          }
          case "lastMBMDate":
            return compareStrings(a.lastMBMDate ?? null, b.lastMBMDate ?? null);
          case "lastContactDate":
            return compareStrings(a.lastContactDate ?? null, b.lastContactDate ?? null);
          default:
            return 0;
        }
      });
    }

    // ==================== 페이지네이션 ====================

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize);

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

