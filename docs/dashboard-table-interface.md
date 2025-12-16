# 전체현황 테이블 API 인터페이스

## 요청 (Request)

```ts
export type MANAGER = string; // 담당자 식별자/이름. => 프론트에서 들고 있을지, 아니면 나중에 연동할지 결정.
export type PROGRESS_STAGE = "TEST" | "QUOTE" | "APPROVAL" | "CLOSING"; // 계약 진행상태
export type TIME_PERIOD = "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR"; // 기간 필터
export type CATEGORY = "채용" | "공공" | "병원" | "성과"; // 카테고리
export type COMPANY_SIZE = "T0" | "T1" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | null;
export type TRUST_LEVEL = "P1" | "P2" | "P3" | null; // 신뢰 레벨
export type POSSIBILITY = "90%" | "40%" | "0%"; // 계약 가능성

export interface DashboardTableRequest {
  timePeriod: TIME_PERIOD; // "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR"
  search?: { companyName?: string }; // 기업명 부분 검색(소문자 비교)
  filters?: {
    companySizes?: COMPANY_SIZE[];               // 기업 규모 다중 선택
    managers?: MANAGER[];                       // 담당자 다중 선택
    categories?: CATEGORY[];                    // 카테고리 다중 선택
    possibilities?: POSSIBILITY[];              // 가능성 다중 선택
    stages?: PROGRESS_STAGE[];                   // 진행상태: 최고 단계가 선택 값과 동일한 행만
    contractAmountRange?: { minMan?: number | null; maxMan?: number | null };   // 계약금액(만원)
    expectedRevenueRange?: { minMan?: number | null; maxMan?: number | null };  // 예상매출(만원)
    targetMonths?: number[];                    // 1~12, 목표일자 월 포함 시
  };
  sort?: {
    field:
      | "companyName"
      | "companySize"
      | "manager"
      | "category"
      | "trustIndex"
      | "contractAmount"
      | "possibility"
      | "expectedRevenue"
      | "targetDate";
    order: "asc" | "desc";
  };
  pagination?: { page: number; pageSize: number };
}
```

## 응답 (Response)

```ts

export interface DashboardTableResponse {
  rows: DashboardTableRow[];              // 테이블: 행 데이터
  total: number;                          // 테이블: 총 건수(페이지네이션)
  currentPage: number;                   // 현재 페이지 (옵션)
  pageSize: number;                      // 페이지당 개수 (옵션)
}

export interface DashboardTableRow {
  no: number;                             // 테이블: 번호
  companyName: string;                    // 테이블: 기업명
  companySize: COMPANY_SIZE;               // 테이블: 기업 규모
  category: CATEGORY;                     // 테이블: 카테고리
  manager: MANAGER;                       // 테이블: 담당자
  contractAmount: number | null;          // 테이블: 계약금액 (원 단위)
  trustIndex?: number | null;             // 테이블: 신뢰지수(현재)
  trustLevel: TRUST_LEVEL | null;          // 테이블: 신뢰레벨
  adoptionDecision: AdoptionDecision;     // 테이블: 가능성/목표일자/진행상태
  expectedRevenue?: number;               // 테이블: 예상매출(현재, 원 단위)
  periodChange?: PeriodChange;            // 테이블: 과거값 비교용
}

export interface PeriodChange {
  previousTrustIndex: number | null;      // 테이블: 신뢰지수(과거)
  previousPossibility: POSSIBILITY;       // 테이블: 가능성(과거)
  previousExpectedRevenue: number;        // 테이블: 예상매출(과거)
  currentExpectedRevenue: number;         // 테이블: 예상매출(현재)
  previousTargetMonth: number | null;     // 테이블: 목표월(과거, 1~12)
  previousTest: boolean;                  // 테이블: 진행상태 T 과거 여부
  previousQuote: boolean;                 // 테이블: 진행상태 Q 과거 여부
  previousApproval: boolean;              // 테이블: 진행상태 A 과거 여부
  previousContract: boolean;              // 테이블: 진행상태 C(계약) 과거 여부
}

export interface AdoptionDecision {
  possibility: POSSIBILITY;               // 테이블: 가능성(현재) "0%" | "40%" | "90%"
  targetRevenue?: number | null;          // 테이블: 목표 매출
  targetMonth?: number | null;            // 테이블: 목표월 표시(1~12)
  test?: boolean;                         // 테이블: 진행상태 T
  quote?: boolean;                        // 테이블: 진행상태 Q
  approval?: boolean;                     // 테이블: 진행상태 A
  contract?: boolean;                     // 테이블: 진행상태 C(계약/closing)
}

```

## API 엔드포인트 예시

 - `POST /api/dashboard/overview/companies`  // 고객사 정보 테이블 조회
  - 필터 조합이 길어지므로 POST+JSON 바디 전달을 기본으로 합니다.

## 주요 규칙

- 가능성/목표일자/계약금액/예상매출/기업명 검색 등 모든 필터를 조합해 요청합니다.
- 진행상태 필터는 “최고 진행 단계가 선택 값과 정확히 일치”하는 행만 필요합니다.
- 금액 필터 입력은 만원 단위로 전달하므로, 서버에서는 `minMan * 10_000` 형태로 비교하면 됩니다.
