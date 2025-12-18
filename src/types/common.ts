/**
 * 공통 타입 정의
 * 여러 컴포넌트에서 공통으로 사용되는 타입들
 */

/**
 * 시간 기간 타입
 * UI에서 사용하는 기간 필터링용
 */
export type TimePeriodType = "1w" | "1m" | "6m" | "1y";

/**
 * 기간별 일수 매핑
 */
export const PERIOD_DAYS: Record<TimePeriodType, number> = {
  "1w": 7,
  "1m": 30,
  "6m": 180,
  "1y": 365,
};

