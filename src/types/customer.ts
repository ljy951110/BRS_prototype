import type { ProductType } from "@/repository/openapi/model";

export type { ProductType };
export type CompanySizeType = "T0" | "T1" | "T3" | "T5" | "T9" | "T10" | null;
export type CategoryType = "채용" | "공공" | "병원" | "성과";
export type TrustLevelType = "P1" | "P2" | "P3" | null;
export type ChangeDirectionType = "up" | "down" | "none" | null;
export type CustomerResponseType = "상" | "중" | "하";
export type PossibilityType = "100%" | "90%" | "40%" | "0%";

// 조회/참석 기업 상세 정보 (공통 컴포넌트용)
export interface ViewerDetail {
  companyName: string;
  date?: string;
  category: CategoryType | string;
  companySize?: CompanySizeType | string | null;
  productUsage: ProductType[];
  manager: string;
  contractAmount: number;
  targetRevenue: number;
  possibility: PossibilityType | string;
  test: boolean;
  quote: boolean;
  approval: boolean;
  contract: boolean;
}

// MBM 이벤트 참석 여부
export interface Attendance {
  "1107"?: boolean; // 11월 7일 MBM 세미나
  "1218"?: boolean; // 12월 18일 후속 미팅
  [key: string]: boolean | undefined;
}

// 주간별 신뢰 데이터
export interface TrustData {
  trustIndex: number;
  trustLevel: TrustLevelType;
}

// 주간 단위 신뢰 히스토리 (키: 해당 주 월요일 MMDD)
export interface TrustHistory {
  "1104"?: TrustData; // 11월 1주차 (MBM 주간)
  "1111"?: TrustData; // 11월 2주차
  "1118"?: TrustData; // 11월 3주차
  "1125"?: TrustData; // 11월 4주차
  "1202"?: TrustData; // 12월 1주차
  "1209"?: TrustData; // 12월 2주차 (현재)
  [key: string]: TrustData | undefined;
}

// 영업 액션
export type SalesActionType = "call" | "meeting";

export interface SalesAction {
  type: SalesActionType;
  content: string;
  date: string;
  // 영업 액션 후의 상태 변화
  possibility?: PossibilityType;
  customerResponse?: CustomerResponseType;
  targetRevenue?: number | null;
  targetDate?: string | null; // 목표 일자
  // 진행 상태 체크리스트
  test?: boolean; // 테스트 진행 여부
  quote?: boolean; // 견적서 발송 여부
  approval?: boolean; // 품의 진행 여부
  contract?: boolean; // 계약 체결 여부
}

// 컨텐츠 퍼널 카테고리
export type ContentCategoryType = "TOFU" | "MOFU" | "BOFU";

// 컨텐츠 조회 기록
export interface ContentEngagement {
  title: string;
  date: string;
  category: ContentCategoryType;
}

export interface TrustFormation {
  customerResponse: CustomerResponseType;
  targetDate?: string | null;
  targetRevenueMin?: number | null;
  targetRevenueMax?: number | null;
  detail: string;
  interestFunction?: string | null;
}

export interface ValueRecognition {
  customerResponse: CustomerResponseType;
  possibility: PossibilityType;
  targetDate?: string | null;
  targetRevenue?: number | null;
  test?: boolean;
  quote?: boolean;
  approval?: boolean;
  contract?: boolean;
  simulation?: number | null;
}

export interface AdoptionDecision {
  customerResponse: CustomerResponseType;
  possibility: PossibilityType;
  targetDate?: string | null;
  targetRevenue?: number | null;
  test?: boolean;
  quote?: boolean;
  approval?: boolean;
  contract?: boolean;
  simulation?: number | null;
}

// 기간별 변화 데이터 (getDataWithPeriodChange에서 계산됨)
export interface PeriodData {
  pastTrustIndex: number | null;
  pastPossibility: PossibilityType;
  pastCustomerResponse: CustomerResponseType;
  pastTargetRevenue: number | null;
  pastExpectedRevenue: number;
  currentExpectedRevenue: number;
  possibilityChange: "up" | "down" | "none";
  responseChange: "up" | "down" | "none";
  // 진행상태 과거값
  pastTest: boolean;
  pastQuote: boolean;
  pastApproval: boolean;
  pastContract: boolean;
  // 목표일자 과거값
  pastTargetDate: string | null;
}

export interface Customer {
  no: number;
  companyName: string;
  companySize: CompanySizeType;
  category: CategoryType;
  productUsage: ProductType[];
  manager: string;
  renewalDate: string | null;
  contractAmount: number | null;
  hDot: boolean;
  trustLevel: TrustLevelType;
  trustIndex?: number | null;
  changeAmount?: number | null;
  changeDirection: ChangeDirectionType;
  rank?: number | null;
  trustHistory?: TrustHistory;
  salesActions?: SalesAction[]; // 영업 액션 (가능성/고객반응 변화 포함)
  contentEngagements?: ContentEngagement[];
  attendance: Attendance; // MBM 참석 여부 (신뢰지수 변화 포함)
  lastMBMDate?: string | null; // 최근 MBM 참석날짜 (YYYY-MM-DD, API에서 계산됨)
  lastContactDate?: string | null; // 마지막 컨택 날짜 (YYYY-MM-DD, API에서 계산됨)
  trustFormation: TrustFormation;
  valueRecognition: ValueRecognition;
  adoptionDecision: AdoptionDecision;
  _periodData?: PeriodData; // 기간별 변화 데이터
}

// 파이프라인 단계
export type PipelineStageType =
  | "trustFormation"
  | "valueRecognition"
  | "adoptionDecision";

// 필터 타입
export interface Filters {
  manager: string[];
  category: CategoryType[];
  companySize: CompanySizeType[];
  possibility: PossibilityType[];
  trustLevel: TrustLevelType[];
  searchQuery: string;
}
