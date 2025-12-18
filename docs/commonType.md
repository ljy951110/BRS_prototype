```ts
export type ProgressStageType = "TEST" | "QUOTE" | "APPROVAL" | "CLOSING"; // 계약 진행상태
export type TimePeriodType = "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR"; // 기간 필터
export type CategoryType = "채용" | "공공" | "성과"; // 카테고리
export type CompanySizeType = "T0" | "T1" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | null;
export type TrustLevelType = "P1" | "P2" | "P3" | null; // 신뢰 레벨
export type PossibilityType = "90%" | "40%" | "0%"; // 계약 가능성
export type SalesActionType = "CALL" | "MEETING"; // 영업 활동 유형
```