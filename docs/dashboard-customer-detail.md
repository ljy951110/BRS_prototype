# 전체현황 탭 - 고객 상세 모달 (요약 탭) API 인터페이스

테이블에서 행 클릭 시 표시되는 모달의 **요약 탭** 정보에 필요한 요청/응답 스펙입니다.

## 타입 정의 (공유)

```ts
export type CategoryType = "채용" | "공공" | "성과"; // 카테고리
export type CompanySizeType = "T0" | "T1" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | null;
export type TrustLevelType = "P1" | "P2" | "P3" | null; // 신뢰 레벨
export type PossibilityType = "90%" | "40%" | "0%"; // 계약 가능성
export type ProductType = "ATS" | "역검SR" | "INHR+통합" | "역검" | "이탈사"; // 제품 타입
```

## 요청 (Request)

```ts
export interface CustomerSummaryRequest {
  companyId: number;
  dateRange: { startDate: string; endDate: string }; // 조회 기간 (YYYY-MM-DD)
}
```

### 필드 설명 (Request)
- `companyId`: 조회할 고객사 ID
- `dateRange`: 조회 기간 (startDate: 시작일, endDate: 종료일, YYYY-MM-DD 형식)

## 응답 (Response)

```ts
export interface CustomerSummaryResponse {
  companyId: number;
  companyName: string;
  manager: string;                            // 담당자
  category: CategoryType;                     // 카테고리
  companySize: CompanySizeType;               // 기업규모
  productUsage: ProductType[];                // 제품사용 배열
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
- `productUsage`: 제품사용 배열 (예: ["ATS"], ["역검"], ["ATS", "역검SR"])
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
- `POST /dashboard/customer/:companyId/summary` → `CustomerSummaryResponse`  
  - 요청 바디: `{ "dateRange": { "startDate": "2024-11-01", "endDate": "2024-12-01" } }`
  - 예시: `POST /dashboard/customer/123/summary`
  - 날짜 범위가 길어질 수 있으므로 POST 방식 권장

## 주요 규칙

- **조회 기간 (`dateRange`)**:
  - `startDate`와 `endDate`로 조회 기간 지정
  - 날짜 형식: YYYY-MM-DD (예: "2024-11-01", "2024-12-01")
  - `previous`: `startDate` 시점의 데이터
  - `current`: `endDate` 시점의 데이터
  - 예시: `{ startDate: "2024-11-01", endDate: "2024-12-01" }`
- 금액은 모두 **원 단위**로 응답합니다.
- 날짜 형식: `targetDate`는 "YYYY-MM-DD" (예: "2024-12-31")
- **PeriodDataType 구조**:
  - `current`와 `previous` 모두 동일한 `PeriodDataType` 구조 사용
  - 예상매출은 클라이언트에서 계산 (targetRevenue × possibility)
  - 예: 목표매출 1억 × 가능성 90% = 예상매출 9천만원
  - 타입 재사용으로 일관성 보장
- 진행상태(T/Q/A/C)는 boolean 값으로, true면 해당 단계 완료를 의미합니다.
- 변화가 없는 경우에도 `previous`와 `current` 모두 포함해야 합니다.

---

## 변경 이력

### 2024-12-17: 조회 기간 타입 변경 및 제품 사용 필드 추가
- **조회 기간 타입 변경**:
  - **변경 전**: `period: TimePeriodType` ("WEEK" | "MONTH" | "HALF_YEAR" | "YEAR")
  - **변경 후**: `dateRange: { startDate: string; endDate: string }` (YYYY-MM-DD 형식)
  - **사유**: UI에서 RangePicker로 직접 날짜 범위를 선택하므로, API도 정확한 날짜 범위를 받도록 변경
  - **API 메서드 변경**: GET → POST (날짜 범위를 바디로 전달)
  - **데이터 비교 기준**: `previous`는 startDate 시점, `current`는 endDate 시점 데이터
- **제품 사용 필드 추가**:
  - `productUsage: ProductType[]` 필드 추가
  - 고객이 사용 중인 제품 목록 표시 (예: ["ATS"], ["역검"], ["ATS", "역검SR"])

