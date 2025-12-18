/**
 * Customer Detail API Query Hooks
 * React Query를 사용한 API 호출 훅
 */

import { CustomerDetailApiFactory } from '@/repository/openapi/api/customer-detail-api';
import type {
  CustomerSummaryRequest,
  CustomerSummaryResponse,
  SalesHistoryRequest,
  SalesHistoryResponse,
} from '@/repository/openapi/model';
import { axios } from '@/repository/query/Axios';
import { CUSTOM_QUERY_OPTIONS } from '@/repository/query/ReactQueryCustomType';
import { useQuery } from '@tanstack/react-query';
import { customerDetailQueryKeys } from './queryKey';

// CustomerDetailApi 인스턴스 생성 (커스텀 axios 사용)
// basePath를 빈 문자열로 설정하여 상대 경로 사용 (MSW intercept를 위해)
export const customerDetailApiController = CustomerDetailApiFactory(undefined, '', axios);

/**
 * 고객 요약 정보 조회
 * 테이블에서 행 클릭 시 표시되는 모달의 요약 탭 정보
 * 
 * @param companyId - 조회할 고객사 ID
 * @param request - 조회 기간 (dateRange)
 * @param options - React Query 옵션
 * @returns 고객 요약 정보 (현재/과거 데이터)
 */
export const useGetCustomerSummary = (
  companyId: number,
  request: CustomerSummaryRequest,
  options?: CUSTOM_QUERY_OPTIONS<CustomerSummaryResponse>
) => {
  return useQuery({
    ...options,
    queryKey: customerDetailQueryKeys.summary(companyId, request).queryKey,
    queryFn: () =>
      customerDetailApiController.getCustomerSummaryApiV1DashboardCustomerCompanyIdSummaryPost({
        companyId,
        customerSummaryRequest: request,
      }),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
  });
};

/**
 * 영업 히스토리 조회
 * 테이블에서 행 클릭 시 표시되는 모달의 영업 히스토리 탭 정보
 * 
 * @param companyId - 조회할 고객사 ID
 * @param request - 조회 기간 (dateRange)
 * @param options - React Query 옵션
 * @returns 영업 액션 목록 (최신순)
 */
export const useGetSalesHistory = (
  companyId: number,
  request: SalesHistoryRequest,
  options?: CUSTOM_QUERY_OPTIONS<SalesHistoryResponse>
) => {
  return useQuery({
    ...options,
    queryKey: customerDetailQueryKeys.salesHistory(companyId, request).queryKey,
    queryFn: () =>
      customerDetailApiController.getSalesHistoryApiV1DashboardCustomerCompanyIdSalesHistoryPost({
        companyId,
        salesHistoryRequest: request,
      }),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
  });
};

