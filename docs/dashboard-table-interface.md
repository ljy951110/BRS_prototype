# 전체현황 테이블 API 인터페이스

## 요청 (Request)

```ts

export interface DashboardTableRequest {
  timePeriod: TimePeriodApiType; // "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR"
  search?: { companyName?: string }; // 기업명 부분 검색(소문자 비교)
  filters?: {
    companySizes?: CompanySizeType[];               // 기업 규모 다중 선택
    managers?: string[];                       // 담당자 다중 선택
    categories?: CategoryType[];                    // 카테고리 다중 선택
    productUsages?: ProductType[];             // 제품사용 다중 선택 (개별 제품 단위로 필터링)
    possibilities?: PossibilityType[];              // 가능성 다중 선택
    stages?: ProgressStageType[];                   // 진행상태: 최고 단계가 선택 값과 동일한 행만
    contractAmountRange?: { minMan?: number | null; maxMan?: number | null };   // 계약금액(원)
    targetRevenueRange?: { minMan?: number | null; maxMan?: number | null };    // 목표매출(원)
    expectedRevenueRange?: { minMan?: number | null; maxMan?: number | null };  // 예상매출(원)
    targetMonths?: number[];                    // 1~12, 목표일자 월 포함 시
  };
  sort?: {
    field:
      | "companyName"
      | "companySize"
      | "manager"
      | "category"
      | "productUsage"
      | "trustIndex"
      | "contractAmount"
      | "targetRevenue"
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
  companyId:number;                       // 테이블: 기업id
  companyName: string;                    // 테이블: 기업명
  companySize: CompanySizeType;           // 테이블: 기업 규모
  category: CategoryType;                 // 테이블: 카테고리
  productUsage: ProductType[];            // 테이블: 제품사용 배열 (예: ["ATS"], ["역검"], ["ATS", "역검SR"])
  manager: string;                        // 테이블: 담당자
  contractAmount: number | null;          // 테이블: 계약금액 (원 단위)
  current: PeriodDataType;                // 테이블: 현재 상태
  previous: PeriodDataType;               // 테이블: 과거 상태 (기간 비교용)
}

// 제품 타입 정의
export type ProductType = "ATS" | "역검SR" | "INHR+통합" | "역검" | "이탈사";

export interface PeriodDataType {
  trustIndex: number | null;              // 신뢰지수
  possibility: PossibilityType;           // 가능성 "0%" | "40%" | "90%"
  targetRevenue?: number | null;          // 목표매출 (원)
  targetMonth?: number | null;            // 목표월 (1~12)
  test?: boolean;                         // 진행상태: 테스트
  quote?: boolean;                        // 진행상태: 견적
  approval?: boolean;                     // 진행상태: 품의
  contract?: boolean;                     // 진행상태: 계약
}

```

## API 엔드포인트 예시

 - `POST /api/dashboard/overview/companies`  // 고객사 정보 테이블 조회
  - 필터 조합이 길어지므로 POST+JSON 바디 전달을 기본으로 합니다.

## 주요 규칙

- 가능성/목표일자/계약금액/목표매출/예상매출/기업명 검색 등 모든 필터를 조합해 요청합니다.
- 진행상태 필터는 "최고 진행 단계가 선택 값과 정확히 일치"하는 행만 필요합니다.
- 금액 필터 입력은 원 단위로 전달합니다.
- **금액 범위 필터**: `contractAmountRange`, `targetRevenueRange`, `expectedRevenueRange` 모두 동일한 형식 사용
- **PeriodDataType 구조**:
  - 신뢰지수, 가능성, 목표매출, 진행상태를 포함하는 시점별 데이터
  - `current`와 `previous` 두 개의 `PeriodDataType` 객체로 현재/과거 상태 표현
  - 예상매출은 클라이언트에서 계산 (targetRevenue × possibility)
  - `previous`는 선택한 기간(`timePeriod`)에 따라 결정 (1주전/1개월전/6개월전/1년전)
  - 장점: 타입 재사용, 명확한 구분, 확장 용이

---

## 변경 이력

### 2024-12-16: 구조 개선
- **변경 전**:
  ```typescript
  interface DashboardTableRow {
    trustIndex?: number | null;
    trustLevel: TrustLevelType | null;
    previousTrustIndex?: number | null;
    adoptionDecision: AdoptionDecision;
    periodChange?: PeriodChange;  // 과거 데이터 별도 관리
  }
  ```

- **변경 후**:
  ```typescript
  interface DashboardTableRow {
    trustLevel: TrustLevelType | null;
    current: PeriodDataType;   // 현재 상태
    previous: PeriodDataType;  // 과거 상태
  }
  
  interface PeriodDataType {
    trustIndex, possibility, targetRevenue, targetMonth,
    test, quote, approval, contract
  }
  ```

- **개선 내용**:
  - `PeriodChange`, `AdoptionDecision` 제거 → `PeriodDataType`으로 통합
  - 타입 재사용: 같은 `PeriodDataType`을 `current`/`previous`로 사용
  - 신뢰지수를 `PeriodDataType` 내부로 이동
  - `previous*` 접두사 필드 제거, 명확한 객체 분리
  - 타입 안정성 보장 및 확장성 향상
