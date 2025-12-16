# 전체현황 탭 - 고객 상세 모달 (요약 탭) API 인터페이스

테이블에서 행 클릭 시 표시되는 모달의 **요약 탭** 정보에 필요한 요청/응답 스펙입니다.

## 타입 정의 (공유)

```ts
export type TimePeriodType = "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR"; // 기간 필터
export type CategoryType = "채용" | "공공" | "성과"; // 카테고리
export type CompanySizeType = "T0" | "T1" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | null;
export type TrustLevelType = "P1" | "P2" | "P3" | null; // 신뢰 레벨
export type PossibilityType = "90%" | "40%" | "0%"; // 계약 가능성
```

## 요청 (Request)

```ts
export interface CustomerSummaryRequest {
  companyId: number;
  period: TimePeriodType; // 기간 필터
}
```

### 필드 설명 (Request)
- `companyId`: 조회할 고객사 ID
- `period`: 조회 기간 (전기 데이터 비교 기준점 결정)

## 응답 (Response)

```ts
export interface CustomerSummaryResponse {
  companyId: number;
  companyName: string;
  manager: string;                            // 담당자
  category: CategoryType;                     // 카테고리
  companySize: CompanySizeType;               // 기업규모
  contractAmount: number | null;              // 계약금액 (원)
  current: PeriodDataType;                    // 현재 상태
  previous: PeriodDataType;                   // 전기(과거) 상태
}

export interface PeriodDataType {
  trustIndex: number | null;                  // 신뢰지수
  possibility: PossibilityType;               // 가능성 "0%" | "40%" | "90%"
  targetRevenue?: number | null;              // 목표매출 (원)
  targetDate?: string | null;                 // 목표일자 "YYYY-MM-DD"
  test?: boolean;                             // 진행상태: 테스트
  quote?: boolean;                            // 진행상태: 견적
  approval?: boolean;                         // 진행상태: 품의
  contract?: boolean;                         // 진행상태: 계약
}
```

### 필드 설명 (Response)

#### 기본 정보
- `companyId`: 고객사 ID
- `companyName`: 고객사명
- `manager`: 담당자명
- `category`: 카테고리 (채용/공공/성과)
- `companySize`: 기업 규모 (T0~T10)
- `contractAmount`: 계약금액 (원 단위)
- `trustLevel`: 신뢰 레벨 (P1/P2/P3)

#### PeriodDataType
- `trustIndex`: 신뢰지수
- `possibility`: 가능성 (0%/40%/90%)
- `targetRevenue`: 목표매출 (원)
- `targetDate`: 목표일자 "YYYY-MM-DD"
- `test/quote/approval/contract`: 진행상태 (T/Q/A/C)
- **예상매출**: 클라이언트에서 계산 (targetRevenue × possibility)

#### 현재/과거 구분
- `current`: 현재 시점의 `PeriodDataType`
- `previous`: 전기(과거) 시점의 `PeriodDataType`
- 동일한 구조로 타입 재사용, 명확한 구분

#### 화면 표시 방식
모든 변화 정보는 **"previous → current"** 형태로 표시되며, 증가/감소에 따라 태그 색상이 변경됩니다:
- 증가: 녹색 (green)
- 감소: 빨간색 (red)
- 변화 없음: 기본 (default)

## API 엔드포인트 예시
- `GET /dashboard/customer/:companyId/summary` → `CustomerSummaryResponse`  
  - 쿼리스트링: `?period=MONTH`
  - 예시: `GET /dashboard/customer/123/summary?period=MONTH`

## 주요 규칙

- 기간(`period`)에 따라 전기(과거) 시점의 데이터를 결정합니다.
  - `WEEK`: 1주 전 데이터와 비교
  - `MONTH`: 1개월 전 데이터와 비교
  - `HALF_YEAR`: 6개월 전 데이터와 비교
  - `YEAR`: 1년 전 데이터와 비교
- 금액은 모두 **원 단위**로 응답합니다.
- 날짜 형식: `targetDate`는 "YYYY-MM-DD" (예: "2024-12-31")
- **PeriodDataType 구조**:
  - `current`와 `previous` 모두 동일한 `PeriodDataType` 구조 사용
  - 예상매출은 클라이언트에서 계산 (targetRevenue × possibility)
  - 예: 목표매출 1억 × 가능성 90% = 예상매출 9천만원
  - 타입 재사용으로 일관성 보장
- 진행상태(T/Q/A/C)는 boolean 값으로, true면 해당 단계 완료를 의미합니다.
- 변화가 없는 경우에도 `previous`와 `current` 모두 포함해야 합니다.

