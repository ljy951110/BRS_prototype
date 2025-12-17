/**
 * Dashboard API Query Keys
 * React Query 캐싱을 위한 Query Key Factory
 * @lukemorales/query-key-factory 사용
 */

import type { DashboardTableRequest } from '@/repository/openapi/model';
import { createQueryKeys } from '@lukemorales/query-key-factory';

export const dashboardQueryKeys = createQueryKeys('dashboard', {
  // 대시보드 테이블 데이터 - companies list
  companiesList: (params: DashboardTableRequest) => ({
    queryKey: [params],
  }),

  // 필터 옵션
  filters: null,
});

