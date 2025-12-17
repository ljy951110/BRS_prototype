export type CompanySize = "T0" | "T1" | "T3" | "T5" | "T9" | "T10" | null;
export type Category = "채용" | "공공" | "병원" | "성과";
export type TrustLevel = "P1" | "P2" | "P3" | null;
export type ChangeDirection = "up" | "down" | "none" | null;
export type CustomerResponse = "상" | "중" | "하";
export type Possibility = "90%" | "40%" | "0%";

// 조회/참석 기업 상세 정보 (공통 컴포넌트용)
export interface ViewerDetail {
  companyName: string;
  date?: string;
  category: Category | string;
  companySize?: CompanySize | string | null;
  manager: string;
  contractAmount: number;
  targetRevenue: number;
  possibility: Possibility | string;
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
  trustLevel: "P1" | "P2" | "P3";
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
  possibility?: Possibility;
  customerResponse?: CustomerResponse;
  targetRevenue?: number | null;
  targetDate?: string | null; // 목표 일자
  // 진행 상태 체크리스트
  test?: boolean; // 테스트 진행 여부
  quote?: boolean; // 견적서 발송 여부
  approval?: boolean; // 품의 진행 여부
  contract?: boolean; // 계약 체결 여부
}

// 컨텐츠 퍼널 카테고리
export type ContentCategory = "TOFU" | "MOFU" | "BOFU";

// 컨텐츠 조회 기록
export interface ContentEngagement {
  title: string;
  date: string;
  category: ContentCategory;
}

export interface TrustFormation {
  customerResponse: CustomerResponse;
  targetDate?: string | null;
  targetRevenueMin?: number | null;
  targetRevenueMax?: number | null;
  detail: string;
  interestFunction?: string | null;
}

export interface ValueRecognition {
  customerResponse: CustomerResponse;
  possibility: Possibility;
  targetDate?: string | null;
  targetRevenue?: number | null;
  test?: boolean;
  quote?: boolean;
  approval?: boolean;
  contract?: boolean;
  simulation?: number | null;
}

export interface AdoptionDecision {
  customerResponse: CustomerResponse;
  possibility: Possibility;
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
  pastPossibility: Possibility;
  pastCustomerResponse: CustomerResponse;
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
  // 목표 매출 과거값
  pastTargetRevenue: number | null;
  // 도입결정 단계 과거값
  pastAdoptionStage: string | null;
}

export interface Customer {
  no: number;
  companyName: string;
  companySize: CompanySize;
  category: Category;
  productUsage: string;
  manager: string;
  renewalDate: string | null;
  contractAmount: number | null;
  hDot: boolean;
  trustLevel: TrustLevel;
  trustIndex?: number | null;
  changeAmount?: number | null;
  changeDirection: ChangeDirection;
  rank?: number | null;
  trustHistory?: TrustHistory;
  salesActions?: SalesAction[]; // 영업 액션 (가능성/고객반응 변화 포함)
  contentEngagements?: ContentEngagement[];
  attendance: Attendance; // MBM 참석 여부 (신뢰지수 변화 포함)
  trustFormation: TrustFormation;
  valueRecognition: ValueRecognition;
  adoptionDecision: AdoptionDecision;
  mbmPipelineStatus: MBMPipelineStatus; // MBM 파이프라인 상태
  _periodData?: PeriodData; // 기간별 변화 데이터
}

// 파이프라인 단계
export type PipelineStage =
  | "trustFormation"
  | "valueRecognition"
  | "adoptionDecision";

// MBM 파이프라인 상태
export type MBMPipelineStatus =
  | "invited"      // 초대 완료
  | "participated" // 참여
  | "followup"     // 팔로업 진행
  | "stagnant"     // 정체
  | "closed";      // 종료

// 필터 타입
export interface Filters {
  manager: string[];
  category: Category[];
  companySize: CompanySize[];
  possibility: Possibility[];
  trustLevel: TrustLevel[];
  searchQuery: string;
}
