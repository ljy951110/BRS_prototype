# 전체현황 탭 - 신뢰지수 변동 카드 API 인터페이스

신뢰지수 변동 카드(평균 신뢰지수, 전기 대비 증감, 상승/하락 리스트, 모달 데이터)에 필요한 요청/응답 스펙입니다. 전체 집합을 기준으로 계산하며, 테이블 필터를 따로 적용하지 않습니다.

## 타입 정의 (공유)

```ts
export type TimePeriodType = "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR"; // 기간 필터
export type CategoryType = "채용" | "공공" | "성과"; // 카테고리
export type CompanySizeType = "T0" | "T1" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | null;
export type TrustLevelType = "P1" | "P2" | "P3" | null; // 신뢰 레벨
```

## 요청 (Request)

```ts
export interface TrustIndexCardRequest {
  period: TimePeriodType;
  category?: CategoryType; // 카테고리 필터 (선택적)
}
```

### 필드 설명 (Request)
- `period`: 조회 기간
- `category`: 카테고리 필터 (선택적). 미지정 시 전체 카테고리 대상

## 응답 (Response)

```ts
export interface TrustIndexCardResponse {
  trustUp: TrustChangeItem[];           // 신뢰지수 상승 목록
  trustDown: TrustChangeItem[];         // 신뢰지수 하락 목록
}

export interface TrustChangeItem {
  companyId: number;
  companyName: string;
  manager: string;
  category: CategoryType;
  companySize: CompanySizeType;
  pastTrustIndex: number;               // 전기 신뢰지수
  currentTrustIndex: number;            // 현재 신뢰지수
}

```

### 필드 설명 (Response)
- `trustUp/trustDown`: 모달 리스트에 사용. 신뢰지수 상승/하락 기업 목록
  - `companyId`, `companyName`: 기업 식별 정보
  - `manager`: 담당자명
  - `category`: 카테고리 (채용/공공/성과)
  - `companySize`: 기업 규모 (T0~T10)
  - `pastTrustIndex`: 전기 신뢰지수
  - `currentTrustIndex`: 현재 신뢰지수
  - **변화량, 신뢰레벨**: 클라이언트에서 계산/조회 (테이블 데이터 활용)

## API 엔드포인트 예시
- `GET /dashboard/trust-index` → `TrustIndexCardResponse`  
  - 쿼리스트링: `?period=MONTH&category=채용`
  - 카테고리 미지정 시: `?period=MONTH` (전체 카테고리)

## 사용 예시

### 요청
```
GET /dashboard/trust-index?period=MONTH&category=채용
```


## 화면 표시 가이드

### 카드 요약 (클라이언트 계산)
- **평균 신뢰지수**: 
  - 전기 평균: `trustUp + trustDown` 배열의 `pastTrustIndex` 평균
  - 현재 평균: `trustUp + trustDown` 배열의 `currentTrustIndex` 평균
  - 표시: `{pastAvg} → {currentAvg}` (변화량은 currentAvg - pastAvg)
- **상승 기업 수**: `{trustUp.length}개`
- **하락 기업 수**: `{trustDown.length}개`

### 모달 리스트
- 각 항목:
  - 기업명, 담당자, 카테고리, 기업규모
  - 신뢰지수 변화: `{pastTrustIndex} → {currentTrustIndex}`
  - 변화량: 클라이언트에서 계산 `currentTrustIndex - pastTrustIndex`
  - 색상: 증가(녹색), 감소(빨간색)
