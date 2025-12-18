/**
 * MSW Handlers Index
 * 모든 API handler를 통합하여 export
 */

import {
  getCustomerSummaryHandler,
  getSalesHistoryHandler,
} from '@/repository/query/customerDetailApiController/handler';
import {
  getDashboardCompaniesHandler,
  getFilterOptionsHandler,
} from '@/repository/query/dashboardApiController/handler';

/**
 * 모든 MSW handlers
 * 새로운 API handler를 추가할 때 여기에 추가하세요.
 */
export const handlers = [
  // Dashboard API
  getFilterOptionsHandler,
  getDashboardCompaniesHandler,

  // Customer Detail API
  getCustomerSummaryHandler,
  getSalesHistoryHandler,

  // TODO: 다른 API handlers 추가
  // Trust Change Detail API
];

