/**
 * Trust Change Detail API MSW Handlers
 * 신뢰지수 변동 상세 API mock handlers
 */

import type {
  EngagementItem,
  TrustChangeDetailRequest,
  TrustChangeDetailResponse,
} from '@/repository/openapi/model';
import { http, HttpResponse } from 'msw';

// ==================== Mock Data ====================

/**
 * 기업별 Mock Engagement 데이터
 */
const MOCK_ENGAGEMENT_DATA: Record<
  number,
  {
    changeAmount: number;
    engagementItems: EngagementItem[];
  }
> = {
  4: {
    // 비전바이오켐
    changeAmount: 4,
    engagementItems: [
      {
        date: '2025-12-15',
        actionType: 'ATTENDED',
        title: '채용 플랫폼 도입 설명회',
        introducedProduct: 'ATS, 역량검사',
      },
      {
        date: '2025-12-08',
        actionType: 'PAGE_VISITED',
        title: '2025 채용 트렌드 가이드',
        url: 'https://example.com/trend-guide',
      },
      {
        date: '2025-12-01',
        actionType: 'PAGE_VISITED',
        title: '역량검사 활용 사례집',
        url: 'https://example.com/case-study',
      },
    ],
  },
  8: {
    // 도쿄일렉트론코리아
    changeAmount: 3,
    engagementItems: [
      {
        date: '2025-12-18',
        actionType: 'ATTENDED',
        title: '대기업 맞춤형 채용 솔루션 워크샵',
        introducedProduct: 'ATS, 역량검사',
      },
      {
        date: '2025-12-10',
        actionType: 'PAGE_VISITED',
        title: '글로벌 인재 채용 전략',
        url: 'https://example.com/global-recruitment',
      },
    ],
  },
  24: {
    // 서울도시가스
    changeAmount: 7,
    engagementItems: [
      {
        date: '2025-12-20',
        actionType: 'ATTENDED',
        title: '공기업 채용 프로세스 혁신 세미나',
        introducedProduct: 'ATS',
      },
      {
        date: '2025-12-16',
        actionType: 'ATTENDED',
        title: 'AI 기반 역량검사 심화 교육',
        introducedProduct: '역량검사',
      },
      {
        date: '2025-12-10',
        actionType: 'PAGE_VISITED',
        title: '공기업 채용 디지털 전환 가이드',
        url: 'https://example.com/digital-transformation',
      },
      {
        date: '2025-12-03',
        actionType: 'OPENED_EMAIL',
        title: '역량 기반 채용의 중요성',
      },
    ],
  },
  25: {
    // AJ네트웍스
    changeAmount: -2,
    engagementItems: [
      {
        date: '2025-12-05',
        actionType: 'PAGE_VISITED',
        title: '유통업 채용 트렌드',
        url: 'https://example.com/retail-trends',
      },
    ],
  },
  30: {
    // (주)도루코
    changeAmount: -8,
    engagementItems: [
      {
        date: '2025-12-02',
        actionType: 'PAGE_VISITED',
        title: '제조업 인재 채용 전략',
        url: 'https://example.com/manufacturing-recruitment',
      },
    ],
  },
  237: {
    // 빙그레
    changeAmount: 7,
    engagementItems: [
      {
        date: '2025-12-19',
        actionType: 'ATTENDED',
        title: '식품업계 채용 혁신 포럼',
        introducedProduct: 'ATS, 역량검사',
      },
      {
        date: '2025-12-12',
        actionType: 'PAGE_VISITED',
        title: '대량 채용 효율화 가이드',
        url: 'https://example.com/mass-recruitment',
      },
      {
        date: '2025-12-05',
        actionType: 'CLICKED_LINK',
        title: '브랜드 이미지 제고를 위한 채용 마케팅',
      },
    ],
  },
  240: {
    // 유라코포레이션
    changeAmount: 8,
    engagementItems: [
      {
        date: '2025-12-21',
        actionType: 'ATTENDED',
        title: '자동차 부품업체 채용 세미나',
        introducedProduct: 'ATS',
      },
      {
        date: '2025-12-14',
        actionType: 'ATTENDED',
        title: '기술 인력 채용 고도화 워크샵',
        introducedProduct: '역량검사',
      },
      {
        date: '2025-12-07',
        actionType: 'PAGE_VISITED',
        title: '제조업 채용 디지털화',
        url: 'https://example.com/digital-manufacturing',
      },
    ],
  },
  242: {
    // 농우바이오
    changeAmount: 5,
    engagementItems: [
      {
        date: '2025-12-13',
        actionType: 'ATTENDED',
        title: '중소기업 채용 지원 설명회',
        introducedProduct: 'ATS',
      },
      {
        date: '2025-12-06',
        actionType: 'PAGE_VISITED',
        title: '중소기업 채용 가이드',
        url: 'https://example.com/sme-guide',
      },
    ],
  },
  272: {
    // 메리츠캐피탈
    changeAmount: -3,
    engagementItems: [
      {
        date: '2025-12-04',
        actionType: 'OPENED_EMAIL',
        title: '금융업 채용 트렌드',
      },
    ],
  },
  637: {
    // 엠로
    changeAmount: -3,
    engagementItems: [
      {
        date: '2025-12-03',
        actionType: 'PAGE_VISITED',
        title: '스타트업 채용 가이드',
        url: 'https://example.com/startup-guide',
      },
    ],
  },
  708: {
    // 디비아이엔씨
    changeAmount: 4,
    engagementItems: [
      {
        date: '2025-12-17',
        actionType: 'ATTENDED',
        title: '대기업 채용 시스템 혁신 세미나',
        introducedProduct: 'ATS, 역량검사',
      },
      {
        date: '2025-12-09',
        actionType: 'PAGE_VISITED',
        title: '대규모 채용 관리 노하우',
        url: 'https://example.com/mass-hiring',
      },
    ],
  },
  709: {
    // 해안종합건축사사무소
    changeAmount: 3,
    engagementItems: [
      {
        date: '2025-12-11',
        actionType: 'ATTENDED',
        title: '건축업 인재 채용 워크샵',
        introducedProduct: 'ATS',
      },
      {
        date: '2025-12-04',
        actionType: 'CLICKED_LINK',
        title: '전문직 채용 전략',
      },
    ],
  },
  43: {
    // 대한제분
    changeAmount: -9,
    engagementItems: [
      {
        date: '2025-12-02',
        actionType: 'PAGE_VISITED',
        title: '제조업 채용 프로세스 개선',
        url: 'https://example.com/manufacturing-process',
      },
    ],
  },
  217: {
    // 한국컴패션
    changeAmount: 0,
    engagementItems: [
      {
        date: '2025-12-16',
        actionType: 'ATTENDED',
        title: '비영리 단체 채용 세미나',
        introducedProduct: 'ATS, 역량검사',
      },
      {
        date: '2025-12-10',
        actionType: 'PAGE_VISITED',
        title: '비영리 채용 가이드',
        url: 'https://example.com/nonprofit-guide',
      },
      {
        date: '2025-12-03',
        actionType: 'OPENED_EMAIL',
        title: '채용 솔루션 소개',
      },
    ],
  },
  299: {
    // 에이플러스에셋어드바이저
    changeAmount: -9,
    engagementItems: [
      {
        date: '2025-12-12',
        actionType: 'ATTENDED',
        title: '금융권 채용 혁신 포럼',
        introducedProduct: '역량검사',
      },
      {
        date: '2025-12-05',
        actionType: 'PAGE_VISITED',
        title: '역량 기반 채용 가이드',
        url: 'https://example.com/competency-guide',
      },
    ],
  },
  373: {
    // 안국건강
    changeAmount: 2,
    engagementItems: [
      {
        date: '2025-12-14',
        actionType: 'ATTENDED',
        title: '제약업계 채용 트렌드 세미나',
        introducedProduct: '역량검사',
      },
      {
        date: '2025-12-08',
        actionType: 'PAGE_VISITED',
        title: '제약업 인재 채용 전략',
        url: 'https://example.com/pharma-recruitment',
      },
      {
        date: '2025-12-01',
        actionType: 'CLICKED_LINK',
        title: '역량검사 활용 사례',
      },
    ],
  },
  468: {
    // 에스테이트
    changeAmount: -1,
    engagementItems: [
      {
        date: '2025-12-07',
        actionType: 'PAGE_VISITED',
        title: '부동산업 채용 가이드',
        url: 'https://example.com/real-estate-guide',
      },
      {
        date: '2025-12-01',
        actionType: 'OPENED_EMAIL',
        title: '역량검사 소개',
      },
    ],
  },
  510: {
    // 에이치비테크놀러지
    changeAmount: -3,
    engagementItems: [
      {
        date: '2025-12-06',
        actionType: 'PAGE_VISITED',
        title: '스타트업 채용 전략',
        url: 'https://example.com/startup-hiring',
      },
    ],
  },
  553: {
    // 동오그룹
    changeAmount: 5,
    engagementItems: [
      {
        date: '2025-12-15',
        actionType: 'ATTENDED',
        title: '중견기업 채용 시스템 구축 워크샵',
        introducedProduct: 'ATS',
      },
      {
        date: '2025-12-09',
        actionType: 'PAGE_VISITED',
        title: '대규모 채용 관리 솔루션',
        url: 'https://example.com/enterprise-ats',
      },
      {
        date: '2025-12-02',
        actionType: 'CLICKED_LINK',
        title: 'ATS 도입 사례',
      },
    ],
  },
  597: {
    // 삼우종합건축사사무소
    changeAmount: 4,
    engagementItems: [
      {
        date: '2025-12-13',
        actionType: 'ATTENDED',
        title: '건축사무소 채용 혁신 세미나',
        introducedProduct: 'ATS',
      },
      {
        date: '2025-12-06',
        actionType: 'PAGE_VISITED',
        title: '전문직 채용 프로세스',
        url: 'https://example.com/professional-hiring',
      },
    ],
  },
};

// ==================== API Handlers ====================

/**
 * 신뢰지수 변동 상세 조회
 * POST /api/v1/dashboard/trust-change-detail
 */
export const getTrustChangeDetailHandler = http.post(
  '/api/v1/dashboard/trust-change-detail',
  async ({ request }) => {
    console.log(
      '[MSW] 📥 Intercepted POST /api/v1/dashboard/trust-change-detail'
    );

    const body = (await request.json()) as TrustChangeDetailRequest;
    console.log('[MSW] Request body:', body);

    const { companyId, dateRange } = body;

    // Mock 데이터에서 해당 기업 정보 조회
    const mockData = MOCK_ENGAGEMENT_DATA[companyId];

    // 기업 데이터가 없으면 기본값 반환
    if (!mockData) {
      console.log(`[MSW] ⚠️ No mock data for companyId: ${companyId}`);
      const response: TrustChangeDetailResponse = {
        changeAmount: 0,
        engagementItems: [],
        hubspotUrl: `https://app.hubspot.com/contacts/company/${companyId}`,
      };
      return HttpResponse.json(response);
    }

    // dateRange가 제공된 경우 필터링 (간단한 날짜 범위 필터)
    let filteredItems = mockData.engagementItems;
    if (dateRange?.startDate && dateRange?.endDate) {
      filteredItems = mockData.engagementItems.filter((item) => {
        const itemDate = new Date(item.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    const response: TrustChangeDetailResponse = {
      changeAmount: mockData.changeAmount,
      engagementItems: filteredItems,
      hubspotUrl: `https://app.hubspot.com/contacts/company/${companyId}`,
    };

    console.log('[MSW] 📤 Sending response:', {
      companyId,
      changeAmount: response.changeAmount,
      engagementItemsCount: response.engagementItems.length,
    });

    return HttpResponse.json(response);
  }
);

