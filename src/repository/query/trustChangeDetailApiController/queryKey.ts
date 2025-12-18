/**
 * Trust Change Detail API Query Keys
 * React Query 캐싱을 위한 Query Key Factory
 * @lukemorales/query-key-factory 사용
 */

import type { TrustChangeDetailRequest } from '@/repository/openapi/model';
import { createQueryKeys } from '@lukemorales/query-key-factory';

export const trustChangeDetailQueryKeys = createQueryKeys('trustChangeDetail', {
  // 신뢰지수 변동 상세 조회
  detail: (params: TrustChangeDetailRequest) => ({
    queryKey: [params],
  }),
});

