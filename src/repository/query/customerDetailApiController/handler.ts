/**
 * Customer Detail API MSW Handlers
 * 고객 상세 정보 관련 API mock handlers
 */

import type {
  Category,
  CustomerSummaryRequest,
  CustomerSummaryResponse,
  CustomerDetailPeriodData,
  Possibility,
  SalesHistoryRequest,
  SalesHistoryResponse,
} from "@/repository/openapi/model";
import { CompanySize, ProductType } from "@/types/common";
import { http, HttpResponse } from "msw";

// ==================== Mock Data ====================

/**
 * Customer Detail용 Mock 데이터
 * companyId별 요약 정보 및 영업 히스토리
 */
interface MockCustomerDetail {
  companyId: number;
  companyName: string;
  companySize: string;
  category: string;
  productUsage: string[];
  hubspotUrl: string;
  manager: string;
  contractAmount: number;
  salesActions: Array<{
    type: 'call' | 'meeting';
    content: string;
    date: string;
    possibility?: string;
    customerResponse?: string;
    targetRevenue?: number | null;
    targetDate?: string | null;
    test?: boolean;
    quote?: boolean;
    approval?: boolean;
    contract?: boolean;
  }>;
  contentEngagements: Array<{
    title: string;
    date: string;
    category: string;
  }>;
}

const MOCK_CUSTOMER_DETAILS: MockCustomerDetail[] = [
  {
    companyId: 4,
    companyName: "비전바이오켐",
    companySize: "T0",
    category: "채용",
    productUsage: ["ATS", "역검"],
    hubspotUrl: "https://app.hubspot.com/contacts/company/mock",
    manager: "이정호",
    contractAmount: 11000000,
    salesActions: [
      {
        type: "meeting",
        content: "MBM 세미나 참석, 영상면접 큐레이터 관심 표명",
        date: "2025-12-11",
        possibility: "0%",
        customerResponse: "하",
        targetRevenue: null,
        targetDate: null,
        test: false,
        quote: false,
        approval: false,
        contract: false,
      },
      {
        type: "call",
        content: "관심 확인 콜, 내부 검토 중",
        date: "2025-12-13",
        possibility: "40%",
        customerResponse: "중",
        targetRevenue: 5000000,
        targetDate: "2월",
        test: true,
        quote: false,
        approval: false,
        contract: false,
      },
      {
        type: "call",
        content: "예산 확보, 1월 중 계약 목표로 변경",
        date: "2025-12-16",
        possibility: "40%",
        customerResponse: "중",
        targetRevenue: 5000000,
        targetDate: "1월",
        test: true,
        quote: true,
        approval: false,
        contract: false,
      },
      {
        type: "meeting",
        content: "품의 진행 확정, 내부 승인 프로세스 시작",
        date: "2025-12-17",
        possibility: "90%",
        customerResponse: "상",
        targetRevenue: 5000000,
        targetDate: "12월",
        test: true,
        quote: true,
        approval: true,
        contract: false,
      },
    ],
    contentEngagements: [
      {
        title: "2024 HR 테크 트렌드 리포트",
        date: "2025-12-11",
        category: "TOFU",
      },
      {
        title: "영상면접 도입 기업 사례집",
        date: "2025-12-13",
        category: "MOFU",
      },
      {
        title: "AI 채용의 미래: 2025 전망",
        date: "2025-12-15",
        category: "TOFU",
      },
      {
        title: "큐레이터 기능 상세 가이드",
        date: "2025-12-16",
        category: "MOFU",
      },
      {
        title: "영상면접 도입 ROI 분석 리포트",
        date: "2025-12-17",
        category: "BOFU",
      },
    ],
  },
  {
    companyId: 8,
    companyName: "도쿄일렉트론코리아",
    companySize: "T9",
    category: "채용",
    productUsage: ["ATS", "역검"],
    hubspotUrl: "https://app.hubspot.com/contacts/company/mock",
    manager: "이정호",
    contractAmount: 50000000,
    salesActions: [
      {
        type: "meeting",
        content: "MBM 세미나 참석, 영상면접 큐레이터 도입 적극 관심",
        date: "2025-12-11",
        possibility: "40%",
        customerResponse: "중",
        targetRevenue: 3000000,
        targetDate: "12월",
        test: false,
        quote: false,
        approval: false,
        contract: false,
      },
      {
        type: "call",
        content: "견적 요청, 구체적 논의 진행",
        date: "2025-12-13",
        possibility: "90%",
        customerResponse: "상",
        targetRevenue: 5000000,
        targetDate: "12월",
        test: true,
        quote: true,
        approval: false,
        contract: false,
      },
      {
        type: "meeting",
        content: "견적 발송 완료, 계약 진행 중",
        date: "2025-12-16",
        possibility: "90%",
        customerResponse: "상",
        targetRevenue: 5000000,
        targetDate: "12월",
        test: true,
        quote: true,
        approval: true,
        contract: false,
      },
      {
        type: "meeting",
        content: "계약서 서명 완료! 1월 도입 확정",
        date: "2025-12-17",
        possibility: "90%",
        customerResponse: "상",
        targetRevenue: 5000000,
        targetDate: "12월",
        test: true,
        quote: true,
        approval: true,
        contract: true,
      },
    ],
    contentEngagements: [
      {
        title: "2024 채용 시장 동향 분석",
        date: "2025-12-11",
        category: "TOFU",
      },
      {
        title: "영상면접 큐레이터 ROI 분석",
        date: "2025-12-13",
        category: "BOFU",
      },
      {
        title: "반도체 업계 채용 혁신 사례",
        date: "2025-12-15",
        category: "MOFU",
      },
      {
        title: "대기업 영상면접 도입 가이드",
        date: "2025-12-17",
        category: "MOFU",
      },
    ],
  },
  {
    companyId: 24,
    companyName: "서울도시가스",
    companySize: "T5",
    category: "채용",
    productUsage: ["ATS", "역검"],
    hubspotUrl: "https://app.hubspot.com/contacts/company/mock",
    manager: "이정호",
    contractAmount: 41250000,
    salesActions: [
      {
        type: "meeting",
        content: "MBM 세미나 참석, 큐레이터 관심 높음. 조기재계약 논의 시작",
        date: "2025-12-11",
        possibility: "40%",
        customerResponse: "중",
        targetRevenue: 40000000,
        targetDate: "12월",
        test: false,
        quote: false,
        approval: false,
        contract: false,
      },
      {
        type: "call",
        content: "조기재계약 검토, 견적 요청",
        date: "2025-12-14",
        possibility: "90%",
        customerResponse: "상",
        targetRevenue: 55000000,
        targetDate: "12월",
        test: true,
        quote: true,
        approval: false,
        contract: false,
      },
      {
        type: "meeting",
        content: "계약 조건 협의, 승인 대기",
        date: "2025-12-17",
        possibility: "90%",
        customerResponse: "상",
        targetRevenue: 58000000,
        targetDate: "12월",
        test: true,
        quote: true,
        approval: true,
        contract: false,
      },
      {
        type: "call",
        content: "최종 계약 체결 완료!",
        date: "2025-12-18",
        possibility: "90%",
        customerResponse: "상",
        targetRevenue: 58000000,
        targetDate: "12월",
        test: true,
        quote: true,
        approval: true,
        contract: true,
      },
    ],
    contentEngagements: [
      {
        title: "2024 HR 테크 트렌드 리포트",
        date: "2025-12-11",
        category: "TOFU",
      },
      {
        title: "영상면접 도입 기업 사례집",
        date: "2025-12-12",
        category: "MOFU",
      },
      {
        title: "큐레이터 기능 상세 가이드",
        date: "2025-12-14",
        category: "MOFU",
      },
      {
        title: "AI 면접 평가 정확도 백서",
        date: "2025-12-15",
        category: "TOFU",
      },
      {
        title: "도입 프로세스 및 일정 안내",
        date: "2025-12-16",
        category: "BOFU",
      },
      {
        title: "에너지 기업 AI 채용 사례",
        date: "2025-12-17",
        category: "MOFU",
      },
      {
        title: "에너지 산업 HR 디지털 전환",
        date: "2025-12-17",
        category: "TOFU",
      },
      {
        title: "영상면접 큐레이터 가격 안내서",
        date: "2025-12-18",
        category: "BOFU",
      },
    ],
  },
];

// ==================== Helper Functions ====================

/**
 * 문자열 카테고리 → OpenAPI Category 타입 매핑
 */
const mapCategory = (category: string): Category | null => {
  const map: Record<string, Category> = {
    "채용": 'recruit' as Category,
    "공공": 'public' as Category,
    "병원": 'public' as Category,
    "성과": 'performance' as Category,
  };
  return map[category] || null;
};

/**
 * 가능성 문자열 → OpenAPI Possibility 타입 매핑
 */
const mapPossibility = (possibility: string | undefined): Possibility | null => {
  if (!possibility) return null;
  return possibility as unknown as Possibility;
};

/**
 * 목표일자를 월(month)로 변환
 */
const findCustomerById = (companyId: number): MockCustomerDetail | undefined => {
  return MOCK_CUSTOMER_DETAILS.find((c) => c.companyId === companyId);
};

// ==================== API Handlers ====================

/**
 * 고객 요약 정보 조회
 * POST /api/v1/dashboard/customer/{company_id}/summary
 */
export const getCustomerSummaryHandler = http.post(
  "/api/v1/dashboard/customer/:company_id/summary",
  async ({ params, request }) => {
    console.log('[MSW] 📥 Intercepted POST /api/v1/dashboard/customer/:company_id/summary');

    const companyId = Number(params.company_id);
    const body = (await request.json()) as CustomerSummaryRequest;
    console.log('[MSW] Request:', { companyId, body });

    const customer = findCustomerById(companyId);

    if (!customer) {
      console.log('[MSW] ❌ Customer not found:', companyId);
      return HttpResponse.json(
        { detail: 'Customer not found' },
        { status: 404 }
      );
    }

    // 현재 상태 (가장 최신 salesAction 기준)
    const latestAction = customer.salesActions[customer.salesActions.length - 1];
    const current: CustomerDetailPeriodData = {
      trustIndex: null, // MockCustomerDetail에는 trustIndex가 없음
      possibility: mapPossibility(latestAction?.possibility) ?? undefined,
      targetRevenue: latestAction?.targetRevenue ?? null,
      targetDate: latestAction?.targetDate ?? null,
      test: latestAction?.test ?? false,
      quote: latestAction?.quote ?? false,
      approval: latestAction?.approval ?? false,
      contract: latestAction?.contract ?? false,
    };

    // 과거 상태 (첫 번째 salesAction 기준)
    const firstAction = customer.salesActions[0];
    const previous: CustomerDetailPeriodData = {
      trustIndex: null,
      possibility: mapPossibility(firstAction?.possibility) ?? undefined,
      targetRevenue: firstAction?.targetRevenue ?? null,
      targetDate: firstAction?.targetDate ?? null,
      test: firstAction?.test ?? false,
      quote: firstAction?.quote ?? false,
      approval: firstAction?.approval ?? false,
      contract: firstAction?.contract ?? false,
    };

    const response: CustomerSummaryResponse = {
      companyId: customer.companyId,
      companyName: customer.companyName,
      manager: customer.manager ?? null,
      category: mapCategory(customer.category),
      companySize: customer.companySize as CompanySize ?? null,
      productUsage: customer.productUsage as ProductType[] ?? [],
      contractAmount: customer.contractAmount ?? null,
      current,
      previous,
      hubspotUrl: customer.hubspotUrl ?? null,
    };

    console.log('[MSW] 📤 Sending customer summary:', response);
    return HttpResponse.json(response);
  }
);

/**
 * 영업 히스토리 조회
 * POST /api/v1/dashboard/customer/{company_id}/sales-history
 */
export const getSalesHistoryHandler = http.post(
  "/api/v1/dashboard/customer/:company_id/sales-history",
  async ({ params, request }) => {
    console.log('[MSW] 📥 Intercepted POST /api/v1/dashboard/customer/:company_id/sales-history');

    const companyId = Number(params.company_id);
    const body = (await request.json()) as SalesHistoryRequest;
    console.log('[MSW] Request:', { companyId, body });

    const customer = findCustomerById(companyId);

    if (!customer) {
      console.log('[MSW] ❌ Customer not found:', companyId);
      return HttpResponse.json(
        { detail: 'Customer not found' },
        { status: 404 }
      );
    }

    console.log('[MSW] ✅ Customer found:', customer.companyName);
    console.log('[MSW] Total salesActions:', customer.salesActions?.length || 0);

    // 기간 내 영업 액션 필터링
    const startDate = new Date(body.dateRange.startDate);
    const endDate = new Date(body.dateRange.endDate);
    console.log('[MSW] Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    const allActions = customer.salesActions || [];
    console.log('[MSW] All action dates:', allActions.map(a => a.date));

    const sortedActions = allActions
      .filter((action) => {
        const actionDate = new Date(action.date);
        const isInRange = actionDate >= startDate && actionDate <= endDate;
        if (!isInRange) {
          console.log('[MSW] Filtered out:', action.date, '(outside range)');
        }
        return isInRange;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log('[MSW] Filtered actions count:', sortedActions.length);

    const filteredActions = sortedActions.map((action, index) => {
      const prevAction = sortedActions[index + 1]; // 이전 액션 (시간순으로 더 과거)

      return {
        actionId: null,
        type: action.type.toUpperCase() as 'CALL' | 'MEETING',
        title: action.content.substring(0, 30) + (action.content.length > 30 ? '...' : ''),
        content: action.content,
        date: action.date,
        stateChange: {
          before: prevAction ? {
            possibility: mapPossibility(prevAction.possibility) ?? undefined,
            targetRevenue: prevAction.targetRevenue ?? null,
            targetDate: prevAction.targetDate ?? null,
            test: prevAction.test ?? false,
            quote: prevAction.quote ?? false,
            approval: prevAction.approval ?? false,
            contract: prevAction.contract ?? false,
          } : {
            possibility: undefined,
            targetRevenue: null,
            targetDate: null,
            test: false,
            quote: false,
            approval: false,
            contract: false,
          },
          after: {
            possibility: mapPossibility(action.possibility) ?? undefined,
            targetRevenue: action.targetRevenue ?? null,
            targetDate: action.targetDate ?? null,
            test: action.test ?? false,
            quote: action.quote ?? false,
            approval: action.approval ?? false,
            contract: action.contract ?? false,
          },
        },
      };
    });

    const response: SalesHistoryResponse = {
      companyId: customer.companyId,
      companyName: customer.companyName,
      salesActions: filteredActions,
    };

    console.log('[MSW] 📤 Sending sales history:', {
      companyId: response.companyId,
      actionsCount: response.salesActions.length,
    });

    return HttpResponse.json(response);
  }
);

