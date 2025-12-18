/**
 * Trust Change Detail API MSW Handlers
 * 신뢰지수 변동 상세 API mock handlers
 */

import type {
  EngagementItem,
  ModelsTrustChangeDetailMarketingEvent,
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
    engagementItems: EngagementItem[];
    marketingEvents: ModelsTrustChangeDetailMarketingEvent[];
  }
> = {
  4: {
    // 비전바이오켐
    engagementItems: [
      {
        title: '2025 채용 트렌드 가이드',
        latestViewDate: '2025-12-15',
        funnelType: 'MOFU',
        contentType: '온에어',
        viewCount: 3,
        url: 'https://example.com/trend-guide',
      },
      {
        title: '역량검사 활용 사례집',
        latestViewDate: '2025-12-12',
        funnelType: 'BOFU',
        contentType: '아티클',
        viewCount: 2,
        url: 'https://example.com/case-study',
      },
      {
        title: 'ATS 도입 가이드',
        latestViewDate: '2025-12-11',
        funnelType: 'BOFU',
        contentType: '툴즈',
        viewCount: 1,
        url: 'https://example.com/ats-guide',
      },
      {
        title: '2025 채용 트렌드 가이드',
        latestViewDate: '2025-12-15',
        funnelType: 'MOFU',
        contentType: '온에어',
        viewCount: 3,
        url: 'https://example.com/trend-guide',
      },
      {
        title: '역량검사 활용 사례집',
        latestViewDate: '2025-12-12',
        funnelType: 'BOFU',
        contentType: '아티클',
        viewCount: 2,
        url: 'https://example.com/case-study',
      },
      {
        title: 'ATS 도입 가이드',
        latestViewDate: '2025-12-11',
        funnelType: 'BOFU',
        contentType: '툴즈',
        viewCount: 1,
        url: 'https://example.com/ats-guide',
      },
      {
        title: '2025 채용 트렌드 가이드',
        latestViewDate: '2025-12-15',
        funnelType: 'MOFU',
        contentType: '온에어',
        viewCount: 3,
        url: 'https://example.com/trend-guide',
      },
      {
        title: '역량검사 활용 사례집',
        latestViewDate: '2025-12-12',
        funnelType: 'BOFU',
        contentType: '아티클',
        viewCount: 2,
        url: 'https://example.com/case-study',
      },
      {
        title: 'ATS 도입 가이드',
        latestViewDate: '2025-12-11',
        funnelType: 'BOFU',
        contentType: '툴즈',
        viewCount: 1,
        url: 'https://example.com/ats-guide',
      },
    ],
    marketingEvents: [
      {
        latestViewDate: '2025-12-15',
        title: '채용 플랫폼 도입 설명회',
        event_url: 'https://example.com/mbm-event-2025-12',
        product: 'ATS, 역량검사',
        event_target: ['T0', 'T1'],
        event_type: 'SEMINAR',
        npsScore: 8,
      },
    ],
  },
  8: {
    // 도쿄일렉트론코리아
    engagementItems: [
      {
        title: '글로벌 인재 채용 전략',
        date: '2025-12-18',
        funnelType: 'MOFU',
        contentType: '리포트',
        viewCount: 2,
        url: 'https://example.com/global-recruitment',
      },
      {
        title: '대기업 맞춤형 채용 솔루션',
        latestViewDate: '2025-12-14',
        funnelType: 'BOFU',
        contentType: '툴즈',
        viewCount: 1,
        url: 'https://example.com/enterprise-solution',
      },
      {
        title: '대기업 맞춤형 채용 솔루션',
        latestViewDate: '2025-12-14',
        funnelType: 'TOFU',
        contentType: '아티클',
        viewCount: 1,
        url: 'https://example.com/enterprise-solution',
      },
      {
        title: '대기업 맞춤형 채용 솔루션',
        latestViewDate: '2025-12-14',
        funnelType: 'TOFU',
        contentType: '온에어',
        viewCount: 1,
        url: 'https://example.com/enterprise-solution',
      },
      {
        title: '대기업 맞춤형 채용 솔루션',
        latestViewDate: '2025-12-14',
        funnelType: 'TOFU',
        contentType: '아티클',
        viewCount: 1,
        url: 'https://example.com/enterprise-solution',
      },
    ],
    marketingEvents: [
      {
        date: '2025-12-18',
        title: '대기업 맞춤형 채용 솔루션 워크샵',
        event_url: 'https://example.com/mbm-workshop',
        product: 'ATS, 역량검사',
        event_target: ['T0'],
        event_type: 'WORKSHOP',
        npsScore: 9,
      },
    ],
  },
  24: {
    // 서울도시가스
    engagementItems: [
      {
        title: '공기업 채용 디지털 전환 가이드',
        date: '2025-12-16',
        funnelType: 'MOFU',
        contentType: '온에어',
        viewCount: 4,
        url: 'https://example.com/digital-transformation',
      },
      {
        title: '역량 기반 채용의 중요성',
        latestViewDate: '2025-12-13',
        funnelType: 'BOFU',
        contentType: 'ARTICLE',
        viewCount: 2,
        url: 'https://example.com/competency-hiring',
      },
    ],
    marketingEvents: [
      {
        date: '2025-12-16',
        title: 'AI 기반 역량검사 심화 교육',
        event_url: 'https://example.com/ai-assessment',
        product: '역량검사',
        event_target: ['T0', 'T1'],
        event_type: 'EDUCATION',
        npsScore: 7,
      },
    ],
  },
  25: {
    // AJ네트웍스
    engagementItems: [
      {
        title: '유통업 채용 트렌드',
        latestViewDate: '2025-12-12',
        funnelType: 'MOFU',
        contentType: '온에어',
        viewCount: 1,
        url: 'https://example.com/retail-trends',
      },
    ],
    marketingEvents: [],
  },
  30: {
    // (주)도루코
    engagementItems: [
      {
        title: '제조업 인재 채용 전략',
        latestViewDate: '2025-12-11',
        funnelType: 'MOFU',
        contentType: '아티클',
        viewCount: 2,
        url: 'https://example.com/manufacturing-recruitment',
      },
    ],
    marketingEvents: [],
  },
  237: {
    // 빙그레
    engagementItems: [
      {
        title: '대량 채용 효율화 가이드',
        date: '2025-12-17',
        funnelType: 'BOFU',
        contentType: '툴즈',
        viewCount: 3,
        url: 'https://example.com/mass-recruitment',
      },
      {
        title: '브랜드 이미지 제고를 위한 채용 마케팅',
        latestViewDate: '2025-12-13',
        funnelType: 'MOFU',
        contentType: 'ARTICLE',
        viewCount: 1,
        url: 'https://example.com/brand-recruitment',
      },
    ],
    marketingEvents: [
      {
        date: '2025-12-17',
        title: '식품업계 채용 혁신 포럼',
        event_url: 'https://example.com/food-forum',
        product: 'ATS, 역량검사',
        event_target: ['T1', 'T2'],
        event_type: 'FORUM',
        npsScore: 8,
      },
    ],
  },
  240: {
    // 유라코포레이션
    engagementItems: [
      {
        title: '제조업 채용 디지털화',
        latestViewDate: '2025-12-14',
        funnelType: 'BOFU',
        contentType: '아티클',
        viewCount: 2,
        url: 'https://example.com/digital-manufacturing',
      },
      {
        title: '기술 인력 채용 가이드',
        latestViewDate: '2025-12-11',
        funnelType: 'MOFU',
        contentType: '온에어',
        viewCount: 1,
        url: 'https://example.com/tech-hiring',
      },
    ],
    marketingEvents: [
      {
        latestViewDate: '2025-12-14',
        title: '기술 인력 채용 고도화 워크샵',
        event_url: 'https://example.com/tech-workshop',
        product: '역량검사',
        event_target: ['T1'],
        event_type: 'WORKSHOP',
        npsScore: 7,
      },
    ],
  },
  242: {
    // 농우바이오
    engagementItems: [
      {
        title: '중소기업 채용 가이드',
        latestViewDate: '2025-12-13',
        funnelType: 'MOFU',
        contentType: '툴즈',
        viewCount: 2,
        url: 'https://example.com/sme-guide',
      },
    ],
    marketingEvents: [
      {
        latestViewDate: '2025-12-13',
        title: '중소기업 채용 지원 설명회',
        event_url: 'https://example.com/sme-info',
        product: 'ATS',
        event_target: ['T2', 'T3'],
        event_type: 'SEMINAR',
        npsScore: 6,
      },
    ],
  },
  272: {
    // 메리츠캐피탈
    engagementItems: [
      {
        title: '금융업 채용 트렌드',
        latestViewDate: '2025-12-11',
        funnelType: 'MOFU',
        contentType: 'ARTICLE',
        viewCount: 1,
        url: 'https://example.com/finance-trends',
      },
    ],
    marketingEvents: [],
  },
  637: {
    // 엠로
    engagementItems: [
      {
        title: '스타트업 채용 가이드',
        latestViewDate: '2025-12-12',
        funnelType: 'MOFU',
        contentType: '온에어',
        viewCount: 2,
        url: 'https://example.com/startup-guide',
      },
    ],
    marketingEvents: [],
  },
  708: {
    // 디비아이엔씨
    engagementItems: [
      {
        title: '대규모 채용 관리 노하우',
        date: '2025-12-16',
        funnelType: 'BOFU',
        contentType: '아티클',
        viewCount: 3,
        url: 'https://example.com/mass-hiring',
      },
    ],
    marketingEvents: [
      {
        date: '2025-12-16',
        title: '대기업 채용 시스템 혁신 세미나',
        event_url: 'https://example.com/enterprise-seminar',
        product: 'ATS, 역량검사',
        event_target: ['T0'],
        event_type: 'SEMINAR',
        npsScore: 8,
      },
    ],
  },
  709: {
    // 해안종합건축사사무소
    engagementItems: [
      {
        title: '전문직 채용 전략',
        latestViewDate: '2025-12-14',
        funnelType: 'BOFU',
        contentType: '아티클',
        viewCount: 2,
        url: 'https://example.com/professional-strategy',
      },
    ],
    marketingEvents: [
      {
        latestViewDate: '2025-12-14',
        title: '건축업 인재 채용 워크샵',
        event_url: 'https://example.com/architecture-workshop',
        product: 'ATS',
        event_target: ['T2'],
        event_type: 'WORKSHOP',
        npsScore: 7,
      },
    ],
  },
  43: {
    // 대한제분
    engagementItems: [
      {
        title: '제조업 채용 프로세스 개선',
        latestViewDate: '2025-12-11',
        funnelType: 'MOFU',
        contentType: '온에어',
        viewCount: 1,
        url: 'https://example.com/manufacturing-process',
      },
    ],
    marketingEvents: [],
  },
  217: {
    // 한국컴패션
    engagementItems: [
      {
        title: '비영리 채용 가이드',
        latestViewDate: '2025-12-15',
        funnelType: 'BOFU',
        contentType: '툴즈',
        viewCount: 2,
        url: 'https://example.com/nonprofit-guide',
      },
      {
        title: '채용 솔루션 소개',
        latestViewDate: '2025-12-12',
        funnelType: 'MOFU',
        contentType: 'ARTICLE',
        viewCount: 1,
        url: 'https://example.com/solution-intro',
      },
    ],
    marketingEvents: [
      {
        latestViewDate: '2025-12-15',
        title: '비영리 단체 채용 세미나',
        event_url: 'https://example.com/nonprofit-seminar',
        product: 'ATS, 역량검사',
        event_target: ['T2', 'T3'],
        event_type: 'SEMINAR',
        npsScore: 6,
      },
    ],
  },
  299: {
    // 에이플러스에셋어드바이저
    engagementItems: [
      {
        title: '역량 기반 채용 가이드',
        latestViewDate: '2025-12-13',
        funnelType: 'BOFU',
        contentType: '아티클',
        viewCount: 2,
        url: 'https://example.com/competency-guide',
      },
    ],
    marketingEvents: [
      {
        latestViewDate: '2025-12-13',
        title: '금융권 채용 혁신 포럼',
        event_url: 'https://example.com/finance-forum',
        product: '역량검사',
        event_target: ['T1'],
        event_type: 'FORUM',
        npsScore: 7,
      },
    ],
  },
  373: {
    // 안국건강
    engagementItems: [
      {
        title: '제약업 인재 채용 전략',
        date: '2025-12-17',
        funnelType: 'BOFU',
        contentType: '아티클',
        viewCount: 3,
        url: 'https://example.com/pharma-recruitment',
      },
      {
        title: '역량검사 활용 사례',
        latestViewDate: '2025-12-12',
        funnelType: 'MOFU',
        contentType: '온에어',
        viewCount: 2,
        url: 'https://example.com/assessment-case',
      },
    ],
    marketingEvents: [
      {
        date: '2025-12-17',
        title: '제약업계 채용 트렌드 세미나',
        event_url: 'https://example.com/pharma-seminar',
        product: '역량검사',
        event_target: ['T1', 'T2'],
        event_type: 'SEMINAR',
        npsScore: 8,
      },
    ],
  },
  468: {
    // 에스테이트
    engagementItems: [
      {
        title: '부동산업 채용 가이드',
        latestViewDate: '2025-12-14',
        funnelType: 'MOFU',
        contentType: '툴즈',
        viewCount: 1,
        url: 'https://example.com/real-estate-guide',
      },
    ],
    marketingEvents: [],
  },
  510: {
    // 에이치비테크놀러지
    engagementItems: [
      {
        title: '스타트업 채용 전략',
        latestViewDate: '2025-12-13',
        funnelType: 'BOFU',
        contentType: 'ARTICLE',
        viewCount: 2,
        url: 'https://example.com/startup-hiring',
      },
    ],
    marketingEvents: [],
  },
  553: {
    // 동오그룹
    engagementItems: [
      {
        title: '대규모 채용 관리 솔루션',
        date: '2025-12-18',
        funnelType: 'BOFU',
        contentType: '아티클',
        viewCount: 3,
        url: 'https://example.com/enterprise-ats',
      },
      {
        title: 'ATS 도입 사례',
        latestViewDate: '2025-12-15',
        funnelType: 'DECISION',
        contentType: '아티클',
        viewCount: 2,
        url: 'https://example.com/ats-case',
      },
    ],
    marketingEvents: [
      {
        date: '2025-12-18',
        title: '중견기업 채용 시스템 구축 워크샵',
        event_url: 'https://example.com/midsize-workshop',
        product: 'ATS',
        event_target: ['T1', 'T2'],
        event_type: 'WORKSHOP',
        npsScore: 9,
      },
    ],
  },
  597: {
    // 삼우종합건축사사무소
    engagementItems: [
      {
        title: '전문직 채용 프로세스',
        date: '2025-12-16',
        funnelType: 'BOFU',
        contentType: '툴즈',
        viewCount: 2,
        url: 'https://example.com/professional-hiring',
      },
    ],
    marketingEvents: [
      {
        date: '2025-12-16',
        title: '건축사무소 채용 혁신 세미나',
        event_url: 'https://example.com/architecture-seminar',
        product: 'ATS',
        event_target: ['T2'],
        event_type: 'SEMINAR',
        npsScore: 7,
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
        engagementItems: [],
        marketingEvents: [],
      };
      return HttpResponse.json(response);
    }

    // dateRange가 제공된 경우 필터링 (간단한 날짜 범위 필터)
    let filteredItems = mockData.engagementItems;
    let filteredEvents = mockData.marketingEvents;
    if (dateRange?.startDate && dateRange?.endDate) {
      filteredItems = mockData.engagementItems.filter((item) => {
        const itemDate = new Date(item.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return itemDate >= startDate && itemDate <= endDate;
      });
      filteredEvents = mockData.marketingEvents.filter((event) => {
        const eventDate = new Date(event.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return eventDate >= startDate && eventDate <= endDate;
      });
    }

    const response: TrustChangeDetailResponse = {
      engagementItems: filteredItems,
      marketingEvents: filteredEvents,
    };

    console.log('[MSW] 📤 Sending response:', {
      companyId,
      engagementItemsCount: response.engagementItems.length,
      marketingEventsCount: response.marketingEvents.length,
    });

    return HttpResponse.json(response);
  }
);
