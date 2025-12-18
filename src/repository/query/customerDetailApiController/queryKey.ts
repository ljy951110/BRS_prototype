/**
 * Customer Detail API Query Keys
 * React Query 캐싱을 위한 Query Key Factory
 * @lukemorales/query-key-factory 사용
 */

import type { CustomerSummaryRequest, SalesHistoryRequest } from '@/repository/openapi/model';
import { createQueryKeys } from '@lukemorales/query-key-factory';

export const customerDetailQueryKeys = createQueryKeys('customerDetail', {
  // 고객 요약 정보 조회
  summary: (companyId: number, params: CustomerSummaryRequest) => ({
    queryKey: [companyId, params],
  }),

  // 영업 히스토리 조회
  salesHistory: (companyId: number, params: SalesHistoryRequest) => ({
    queryKey: [companyId, params],
  }),
});

