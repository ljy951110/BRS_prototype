# 전체현황 탭 - 고객 상세 모달 (영업 히스토리 탭) API 인터페이스

테이블에서 행 클릭 시 표시되는 모달의 **영업 히스토리 탭** 정보에 필요한 요청/응답 스펙입니다.

## 타입 정의 (공유)

```ts
export type TimePeriodType = "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR"; // 기간 필터
export type SalesActionType = "CALL" | "MEETING"; // 영업 활동 유형
export type PossibilityType = "90%" | "40%" | "0%"; // 계약 가능성
```

## 요청 (Request)

```ts
export interface SalesHistoryRequest {
  companyId: number;
  period: TimePeriodType; // 기간 필터
}
```

### 필드 설명 (Request)
- `companyId`: 조회할 고객사 ID
- `period`: 조회 기간 (해당 기간 내의 영업 액션만 반환)

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
- `possibility`: 가능성 (0%/40%/90%)
- `targetRevenue`: 목표매출 (원)
- `targetDate`: 목표일자 "YYYY-MM-DD"
- `test/quote/approval/contract`: 진행상태 (T/Q/A/C), boolean으로 true면 해당 단계 완료

#### 화면 표시 방식
- 영업 액션은 **최신순(날짜 내림차순)**으로 표시
- 각 액션의 `stateChange`가 있으면 변화 표시:
  - `before → after` 형태로 비교 표시
  - 변경된 항목만 하이라이트
  - 증가/개선: 녹색, 감소/후퇴: 빨간색
- 타임라인 형태로 시각화

## API 엔드포인트 예시
- `GET /dashboard/customer/:companyId/sales-history` → `SalesHistoryResponse`  
  - 쿼리스트링: `?period=MONTH`
  - 예시: `GET /dashboard/customer/123/sales-history?period=MONTH`

## 주요 규칙

- 기간(`period`)에 따라 반환되는 영업 액션을 필터링합니다.
  - `WEEK`: 최근 1주일 내 액션
  - `MONTH`: 최근 1개월 내 액션
  - `HALF_YEAR`: 최근 6개월 내 액션
  - `YEAR`: 최근 1년 내 액션
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

## 사용 예시

### 요청
```
GET /dashboard/customer/123/sales-history?period=MONTH
```
```
