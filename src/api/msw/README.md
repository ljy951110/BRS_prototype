# MSW (Mock Service Worker) 구조

MSW를 사용한 API mocking 구조입니다. API별로 파일을 분리하여 관리합니다.

## 📁 디렉토리 구조

```
src/api/msw/
├── index.ts                      # MSW Worker 설정
├── handlers/                     # API Handlers
│   ├── index.ts                 # 모든 handler 통합 export
│   └── dashboard.handler.ts     # 대시보드 API handlers
└── README.md                     # 이 파일
```

## 📝 파일별 역할

### `index.ts`
- MSW Worker 설정 및 초기화
- `main.tsx`에서 import하여 사용

### `handlers/index.ts`
- 모든 API handler를 통합하여 export
- 새로운 API handler 추가 시 여기에 등록

### `handlers/dashboard.handler.ts`
- **대시보드 API handlers**
  - `GET /api/v1/dashboard/companies/filters` - 필터 옵션 조회
  - `POST /api/v1/dashboard/companies` - 테이블 데이터 조회
- **Helper Functions**
  - `mapCategory`: Customer 타입 → OpenAPI 타입 매핑
  - `mapPossibility`: 가능성 타입 매핑
  - `calculatePeriod`: dateRange → TimePeriod 계산
  - `toMonth`: 날짜 → 월 변환
  - `getExpectedRevenue`: 예상 매출 계산
  - `inRange`: 숫자 범위 체크
- **Mock Data**: `@/data/mockData`에서 import

## 🔧 새로운 API Handler 추가하기

### 1. 새 handler 파일 생성

```typescript
// handlers/customer.handler.ts
import { http, HttpResponse } from "msw";
import type { CustomerDetailRequest, CustomerDetailResponse } from "@/repository/openapi/model";

// Mock 데이터
const mockCustomerData = { /* ... */ };

// Helper 함수들
const helperFunction = () => { /* ... */ };

// API Handlers
export const getCustomerDetailHandler = http.post(
  "/api/v1/customer/detail",
  async ({ request }) => {
    const body = await request.json() as CustomerDetailRequest;
    // 로직 처리...
    return HttpResponse.json(response);
  }
);

export const getCustomerSalesHistoryHandler = http.post(
  "/api/v1/customer/sales-history",
  async ({ request }) => {
    // ...
  }
);
```

### 2. `handlers/index.ts`에 등록

```typescript
import { getDashboardCompaniesHandler, getFilterOptionsHandler } from './dashboard.handler';
import { getCustomerDetailHandler, getCustomerSalesHistoryHandler } from './customer.handler';

export const handlers = [
  // Dashboard API
  getFilterOptionsHandler,
  getDashboardCompaniesHandler,
  
  // Customer API
  getCustomerDetailHandler,
  getCustomerSalesHistoryHandler,
];
```

## 📋 Handler 작성 가이드

### ✅ DO

1. **파일명 규칙**: `{domain}.handler.ts`
2. **함수명 규칙**: `get{Name}Handler`, `post{Name}Handler`
3. **섹션 구분**: 주석으로 Helper Functions, API Handlers 구분
4. **로깅**: 요청/응답 로깅 추가
5. **타입 안전성**: OpenAPI 생성 타입 사용

```typescript
// ✅ Good
export const getDashboardCompaniesHandler = http.post(
  "/api/v1/dashboard/companies",
  async ({ request }) => {
    console.log('[MSW] 📥 Intercepted POST /api/v1/dashboard/companies');
    const body = await request.json() as DashboardTableRequest;
    // ...
    console.log('[MSW] 📤 Sending response:', response);
    return HttpResponse.json(response);
  }
);
```

### ❌ DON'T

1. 하나의 파일에 너무 많은 handler (5개 이상이면 분리 고려)
2. 실제 API와 다른 경로 사용
3. 타입 없이 `any` 사용
4. 에러 처리 누락

## 🧪 테스트

MSW는 개발 환경(`VITE_MODE=local`)에서만 활성화됩니다.

### 활성화 확인

브라우저 콘솔에서:
```
[MSW] Initializing... (MODE: local)
[MSW] ✅ Mock Service Worker started successfully
[MSW] 📥 Intercepted POST /api/v1/dashboard/companies
[MSW] 📤 Sending response: { totalRows: 50, ... }
```

## 📚 참고 자료

- [MSW 공식 문서](https://mswjs.io/)
- [OpenAPI Generator 문서](https://openapi-generator.tech/)
- [프로젝트 API 문서](../../../docs/)

