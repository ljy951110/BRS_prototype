/**
 * Trust Change Detail API Query Hooks
 * React Query를 사용한 API 호출 훅
 */

import { TrustChangeDetailApiFactory } from '@/repository/openapi/api/trust-change-detail-api';
import type { TrustChangeDetailResponse } from '@/repository/openapi/model';
import { axios } from '@/repository/query/Axios';
import { CUSTOM_QUERY_OPTIONS } from '@/repository/query/ReactQueryCustomType';
import { useQuery } from '@tanstack/react-query';
import { trustChangeDetailQueryKeys } from './queryKey';

// TrustChangeDetailApi 인스턴스 생성 (커스텀 axios 사용)
// basePath를 빈 문자열로 설정하여 상대 경로 사용 (MSW intercept를 위해)
export const trustChangeDetailApiController = TrustChangeDetailApiFactory(
  undefined,
  '',
  axios
);

/**
 * 신뢰지수 변동 상세 조회
 * @param companyId - 조회할 기업 ID
 * @param request - 조회 기간 (dateRange)
 * @param options - React Query 옵션
 * @returns 신뢰지수 변동 상세 데이터 (changeAmount, engagementItems)
 */
export const useGetTrustChangeDetail = (
  companyId: number,
  request: { dateRange: { startDate: string; endDate: string } },
  options?: CUSTOM_QUERY_OPTIONS<TrustChangeDetailResponse>
) => {
  return useQuery({
    ...options,
    queryKey: trustChangeDetailQueryKeys.detail({ companyId, ...request }).queryKey,
    queryFn: async () => {
      console.log('[useGetTrustChangeDetail] Calling API with:', {
        companyId,
        dateRange: request.dateRange,
      });
      const response =
        await trustChangeDetailApiController.getTrustChangeDetailApiV1DashboardTrustChangeDetailPost(
          {
            trustChangeDetailRequest: {
              companyId,
              dateRange: request.dateRange,
            },
          }
        );
      console.log('[useGetTrustChangeDetail] API response:', response);
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
  });
};

