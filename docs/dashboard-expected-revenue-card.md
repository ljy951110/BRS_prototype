# 전체현황 탭 - 예상 매출 카드 API 인터페이스

예상 매출 카드(총 예상매출, 전기 대비 증감, 상승/하락 리스트, 모달 데이터)에 필요한 요청/응답 스펙입니다. 전체 집합을 기준으로 계산하며, 테이블 필터를 따로 적용하지 않습니다.

## 타입 정의 (공유)

```ts

export type ProgressStageType = "TEST" | "QUOTE" | "APPROVAL" | "CLOSING"; // 계약 진행상태
export type TimePeriodType = "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR"; // 기간 필터
export type CategoryType = "채용" | "공공" | "성과"; // 카테고리
export type CompanySizeType = "T0" | "T1" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | null;
export type TrustLevelType = "P1" | "P2" | "P3" | null; // 신뢰 레벨
export type PossibilityType = "90%" | "40%" | "0%"; // 계약 가능성
export type SalesActionType = "CALL" | "MEETING"; // 영업 활동 유형



```

## 요청 (Request)

```ts
export interface ExpectedRevenueCardRequest {
  period: TimePeriodType;
  category?: CategoryType; // 카테고리 필터 (선택적)
}
```

### 필드 설명 (Request)
- `period`: 조회 기간
- `category`: 카테고리 필터 (선택적). 미지정 시 전체 카테고리 대상

## 응답 (Response)

```ts
export interface ExpectedRevenueCardResponse {
  summary: {
    pastExpectedRevenue: number;      // 전기 총 예상매출(원)
    currentExpectedRevenue: number;   // 현재 총 예상매출(원)
  };
  revenueUp: RevenueChangeItem[];     // 예상매출 상승 목록
  revenueDown: RevenueChangeItem[];   // 예상매출 하락 목록
}

export interface RevenueChangeItem {
  companyId: number;
  companyName: string;
  manager: string;
  category: CategoryType;
  companySize: CompanySizeType;
  pastExpectedRevenue: number;        // 전기 예상매출 (원)
  currentExpectedRevenue: number;     // 현재 예상매출 (원)
  latestSalesAction?: LatestSalesAction;       // 기간 내 최근 영업 액션 
}


export interface LatestSalesAction {
  type: SalesActionType;
  title: string;
  date: string; // ISO string
}

```

### 필드 설명 (Response)
- `summary.*`: 카드에 표시되는 총 예상매출 (전기/현재)
- `revenueUp/revenueDown`: 모달 리스트에 사용. 예상매출 상승/하락 기업 목록
  - `companyId`, `companyName`: 기업 식별 정보
  - `manager`: 담당자명
  - `category`: 카테고리 (채용/공공/성과)
  - `companySize`: 기업 규모 (T0~T10)
  - `pastExpectedRevenue`: 전기 예상매출 (원)
  - `currentExpectedRevenue`: 현재 예상매출 (원)
  - `latestSalesAction`: 기간 내 가장 최근 영업 액션 (type, title, date)

## API 엔드포인트 예시
- `GET /dashboard/expected-revenue` → `ExpectedRevenueCardResponse`  
  - 쿼리스트링: `?period=MONTH&category=채용`
  - 카테고리 미지정 시: `?period=MONTH` (전체 카테고리)

## 주요 규칙

- 기간(`period`)과 카테고리(`category`) 필터를 조합하여 예상매출 변화를 계산합니다.
- 카테고리가 지정되지 않으면 전체 카테고리를 대상으로 합니다.
- 금액은 모두 **원 단위**로 응답합니다.
- `revenueUp/revenueDown`은 전기 대비 예상매출이 증가/감소한 기업 목록입니다.
- `latestSalesAction`은 기간 내 가장 최근 영업 액션 1건만 포함하며, 없으면 null 또는 생략 가능합니다.
