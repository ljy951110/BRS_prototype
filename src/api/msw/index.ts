/**
 * MSW Worker Setup
 * Mock Service Worker 설정 및 export
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW Worker 인스턴스
 * main.tsx에서 import하여 사용
 */
export const worker = setupWorker(...handlers);

