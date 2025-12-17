/**
 * MSW Handlers Index
 * 모든 API handler를 통합하여 export
 */

import {
  getDashboardCompaniesHandler,
  getFilterOptionsHandler,
} from './dashboard.handler';

/**
 * 모든 MSW handlers
 * 새로운 API handler를 추가할 때 여기에 추가하세요.
 */
export const handlers = [
  // Dashboard API
  getFilterOptionsHandler,
  getDashboardCompaniesHandler,

  // TODO: 다른 API handlers 추가
  // Customer Detail API
  // Sales History API
  // Trust Change Detail API
];

