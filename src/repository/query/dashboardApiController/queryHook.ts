/**
 * Dashboard API Query Hooks
 * React Query를 사용한 API 호출 훅
 */

import { DashboardApiFactory } from '@/repository/openapi/api/dashboard-api';
import type {
  DashboardTableRequest,
  DashboardTableResponse
} from '@/repository/openapi/model';
import { axios } from '@/repository/query/Axios';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { dashboardQueryKeys } from './queryKey';

// DashboardApi 인스턴스 생성 (커스텀 axios 사용)
export const dashboardApiController = DashboardApiFactory(undefined, undefined, axios);

/**
 * 대시보드 테이블 데이터 조회
 * @param request - 테이블 요청 파라미터 (dateRange, filters, sort, pagination)
 * @param options - React Query 옵션
 */
export const useGetDashboardCompanies = (
  request: DashboardTableRequest,
  options?: Omit<
    UseQueryOptions<DashboardTableResponse, Error, DashboardTableResponse, readonly unknown[]>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<DashboardTableResponse, Error> => {
  return useQuery({
    ...dashboardQueryKeys.companiesList(request),
    queryFn: async () => {
      const response = await dashboardApiController.getDashboardCompaniesApiV1DashboardCompaniesPost({
        dashboardTableRequest: request,
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 10, // 10분간 캐시 유지 (구 cacheTime)
    ...options,
  });
};

/**
 * 대시보드 필터 옵션 조회
 * @param options - React Query 옵션
 */
export const useGetFilterOptions = (
  options?: Omit<
    UseQueryOptions<unknown, Error, unknown, readonly unknown[]>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<unknown, Error> => {
  return useQuery({
    ...dashboardQueryKeys.filters,
    queryFn: async () => {
      const response = await dashboardApiController.getFilterOptionsApiV1DashboardCompaniesFiltersGet();
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // 30분간 fresh 상태 유지 (필터 옵션은 자주 변경되지 않음)
    gcTime: 1000 * 60 * 60, // 1시간 캐시 유지
    ...options,
  });
};

