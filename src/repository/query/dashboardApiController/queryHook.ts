/**
 * Dashboard API Query Hooks
 * React Query를 사용한 API 호출 훅
 */

import { DashboardApiFactory } from '@/repository/openapi/api/dashboard-api';
import type {
  Category,
  DashboardTableRequest,
  DashboardTableResponse,
  Possibility,
  ProgressStage,
} from '@/repository/openapi/model';
import { axios } from '@/repository/query/Axios';
import { CUSTOM_QUERY_OPTIONS } from '@/repository/query/ReactQueryCustomType';
import { CompanySizeType } from '@/types/customer';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryKeys } from './queryKey';

/**
 * Custom Query Options 타입
 */
// type CustomQueryOptions<TData> = Omit<
//   UseQueryOptions<TData, Error>,
//   'queryKey' | 'queryFn'
// >;

/**
 * 필터 옵션 응답 타입
 * (OpenAPI 스펙에 미정의되어 있어 수동으로 정의)
 */
export interface Manager {
  owner_id: string;
  name: string;
}

export interface DashboardFilterOptionsResponse {
  managers: Manager[];
  categories: Category[];
  companySizes: CompanySizeType[];
  possibilities: Possibility[];
  mbmPipelineStatuses: ProgressStage[];
}

// DashboardApi 인스턴스 생성 (커스텀 axios 사용)
// basePath를 빈 문자열로 설정하여 상대 경로 사용 (MSW intercept를 위해)
export const dashboardApiController = DashboardApiFactory(undefined, '', axios);

/**
 * 대시보드 테이블 데이터 조회
 * @param request - 테이블 요청 파라미터 (dateRange, filters, sort, pagination)
 * @param options - React Query 옵션
 */
export const useGetDashboardCompanies = (
  request: DashboardTableRequest,
  options?: CUSTOM_QUERY_OPTIONS<DashboardTableResponse>
) => {
  return useQuery({
    ...options,
    queryKey: dashboardQueryKeys.companiesList(request).queryKey,
    queryFn: () => dashboardApiController.getDashboardCompaniesApiV1DashboardCompaniesPost({ dashboardTableRequest: request }),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
  });
};

/**
 * 대시보드 필터 옵션 조회
 * @param options - React Query 옵션
 * @returns 필터 옵션 응답 (managers, categories, companySizes, possibilities, mbmPipelineStatuses)
 */
export const useGetFilterOptions = (
  options?: CUSTOM_QUERY_OPTIONS<DashboardFilterOptionsResponse>
) => {
  return useQuery({
    ...options,
    queryKey: dashboardQueryKeys.filters.queryKey,
    queryFn: () => dashboardApiController.getFilterOptionsApiV1DashboardCompaniesFiltersGet(),
    staleTime: 1000 * 60 * 30, // 30분
    gcTime: 1000 * 60 * 60, // 1시간
  });
};

