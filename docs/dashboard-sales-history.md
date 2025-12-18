# 전체현황 탭 - 고객 상세 모달 (영업 히스토리 탭) API 인터페이스

테이블에서 행 클릭 시 표시되는 모달의 **영업 히스토리 탭** 정보에 필요한 요청/응답 스펙입니다.

## 타입 정의 (공유)

```ts
export type SalesActionType = "CALL" | "MEETING"; // 영업 활동 유형
export type PossibilityType = "100%" | "90%" | "40%" | "0%"; // 계약 가능성
```

## 요청 (Request)

```ts
export interface SalesHistoryRequest {
  dateRange: { startDate: string; endDate: string }; // 조회 기간 (YYYY-MM-DD)
}
```

### 필드 설명 (Request)
- `dateRange`: 조회 기간 (startDate ~ endDate 범위 내의 영업 액션만 반환)
  - `companyId`는 URL path parameter로 전달됨

## 응답 (Response)

```ts
export interface SalesHistoryResponse {
  companyId: number;
  companyName: string;
  salesActions: SalesAction[]; // 영업 액션 목록 (최신순)
}

export interface SalesAction {
  actionId?: number;                          // 액션 ID (선택)
  type: SalesActionType;                      // CALL | MEETING
  title: string;                              // 액션 제목
  content: string;                            // 액션 내용
  date: string;                               // 액션 일자 "YYYY-MM-DD"
  
  // 액션 전후 상태 변화
  stateChange?: StateChange;                  // 액션으로 인한 상태 변화 (선택)
}

export interface StateChange {
  before: ActionState;                        // 액션 수행 전 상태
  after: ActionState;                         // 액션 수행 후 상태
}

export interface ActionState {
  possibility: PossibilityType;               // 가능성
  targetRevenue?: number | null;              // 목표매출 (원)
  targetDate?: string | null;                 // 목표일자 "YYYY-MM-DD"
  test: boolean;                              // 진행상태: 테스트
  quote: boolean;                             // 진행상태: 견적
  approval: boolean;                          // 진행상태: 품의
  contract: boolean;                          // 진행상태: 계약
}
```

### 필드 설명 (Response)

#### SalesHistoryResponse
- `companyId`: 고객사 ID
- `companyName`: 고객사명
- `salesActions`: 영업 액션 목록 (기간 내, 최신순 정렬)

#### SalesAction
- `actionId`: 액션 고유 ID (옵션, 추후 수정/삭제 시 사용)
- `type`: 영업 액션 타입
  - `CALL`: 전화 상담
  - `MEETING`: 대면 미팅
- `title`: 액션 제목 (예: "제품 데모 미팅", "계약 조건 협의 통화")
- `content`: 액션 상세 내용
- `date`: 액션 수행 일자

#### StateChange (선택적)
- 해당 영업 액션으로 인한 **상태 변화**
- `before`: 액션 수행 전 상태
- `after`: 액션 수행 후 상태
- 상태 변화가 없으면 `stateChange` 전체를 생략 가능

#### ActionState
- `possibility`: 가능성 (0%/40%/90%/100%)
- `targetRevenue`: 목표매출 (원)
- `targetDate`: 목표일자 "YYYY-MM-DD"
- `test/quote/approval/contract`: 진행상태 (T/Q/A/C), boolean으로 true면 해당 단계 완료

#### 화면 표시 방식

**영업 액션 타임라인:**
- 영업 액션은 **최신순(날짜 내림차순)**으로 표시
- 각 액션의 `stateChange`가 있으면 변화 표시:
  - `before → after` 형태로 비교 표시
  - 변경된 항목만 하이라이트
  - 증가/개선: 녹색, 감소/후퇴: 빨간색
- 타임라인 형태로 시각화

**주차별 추이 그래프:**
- 프론트엔드에서 `salesActions` 데이터를 가공하여 표시
- 각 액션의 날짜를 기준으로 시계열 정렬
- 각 액션의 `stateChange.after` 값을 차트에 표시:
  - `possibility` → possibilityIndex로 변환 (0%→0, 40%→40, 90%→90, 100%→100)
  - `targetRevenue` → 만원 단위로 변환
  - `expectedRevenue` = targetRevenue × (possibility를 숫자로 변환)
- 왼쪽 Y축: 가능성 지수 (0~100)
- 오른쪽 Y축: 매출 (만원 단위)

## API 엔드포인트 예시
- `POST /dashboard/customer/:companyId/sales-history` → `SalesHistoryResponse`  
  - 요청 바디: `{ "dateRange": { "startDate": "2024-11-01", "endDate": "2024-12-01" } }`
  - 예시: `POST /dashboard/customer/123/sales-history`
  - 날짜 범위가 길어질 수 있으므로 POST 방식 권장

## 주요 규칙

- **조회 기간 (`dateRange`)**:
  - `startDate`와 `endDate` 범위 내의 영업 액션만 반환
  - 날짜 형식: YYYY-MM-DD (예: "2024-11-01", "2024-12-01")
  - 해당 기간에 수행된 액션만 필터링하여 반환
  - 예시: `{ startDate: "2024-11-01", endDate: "2024-12-01" }`
- 금액은 모두 **원 단위**로 응답합니다.
- 날짜 형식:
  - `date`: "YYYY-MM-DD"
  - `targetDate`: "YYYY-MM-DD"
- **정렬**:
  - `salesActions`는 최신순(날짜 내림차순)으로 정렬되어야 합니다.
  - 같은 날짜면 `actionId` 내림차순
- **StateChange 처리**:
  - 액션으로 인한 상태 변화가 있을 때만 포함
  - `before`와 `after` 모두 제공하여 변화를 명확히 표시
  - 변경사항이 없으면 `stateChange` 전체 생략 가능
  - 프론트엔드에서 before/after 비교하여 변화 시각화
- 해당 기간에 영업 액션이 없으면 `salesActions`는 빈 배열 `[]`로 반환합니다.

---

## 변경 이력

### 2024-12-17: 조회 기간 타입 변경
- **변경 전**: `period: TimePeriodType` ("WEEK" | "MONTH" | "HALF_YEAR" | "YEAR")
- **변경 후**: `dateRange: { startDate: string; endDate: string }` (YYYY-MM-DD 형식)
- **사유**: UI에서 RangePicker로 직접 날짜 범위를 선택하므로, API도 정확한 날짜 범위를 받도록 변경
- **API 메서드 변경**: GET → POST (날짜 범위를 바디로 전달)
- **필터링 방식**: startDate ~ endDate 범위 내의 영업 액션만 반환

## 사용 예시

### 요청
```
POST /dashboard/customer/123/sales-history
Content-Type: application/json

{
  "dateRange": {
    "startDate": "2024-11-01",
    "endDate": "2024-12-01"
  }
}
```
