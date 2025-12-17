/**
 * Application Entry Point
 * React Query, Ant Design, MSW 초기화 및 앱 렌더링
 */

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig
} from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import 'antd/dist/reset.css';
import type { MessageInstance } from 'antd/es/message/interface';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/global.scss';

/* ============================================================
 * Constants
 * ============================================================ */

const THEME_CONFIG = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#3b82f6',
    borderRadius: 8,
    fontFamily: 'Noto Sans KR, -apple-system, BlinkMacSystemFont, sans-serif',
  },
} as const;

const QUERY_CONFIG = {
  retry: {
    maxAttempts: 1,
    forbidden: 1,
  },
  cache: {
    staleTime: 1000, // 1초
  },
} as const;

/* ============================================================
 * Global State
 * ============================================================ */

let messageInstance: MessageInstance;

/* ============================================================
 * Error Handling
 * ============================================================ */

/**
 * React Query 전역 에러 핸들러
 */
const handleQueryError = (error: Error) => {
  const errorMessage = (error as { message?: string })?.message || '오류가 발생했습니다.';

  console.error('[React Query Error]:', error);

  if (messageInstance) {
    messageInstance.error(errorMessage);
  } else {
    console.error('[Error Message]:', errorMessage);
  }
};

/**
 * Axios 에러 재시도 정책
 */
const shouldRetry = (failureCount: number, error: Error): boolean => {
  const status = (error as { response?: { status?: number } })?.response?.status;

  switch (status) {
    case 403:
      return failureCount < QUERY_CONFIG.retry.forbidden;
    default:
      return failureCount < QUERY_CONFIG.retry.maxAttempts;
  }
};

/* ============================================================
 * React Query Setup
 * ============================================================ */

const queryClientConfig: QueryClientConfig = {
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleQueryError,
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      staleTime: QUERY_CONFIG.cache.staleTime,
    },
    mutations: {
      retry: false,
    },
  },
};

const queryClient = new QueryClient(queryClientConfig);

/* ============================================================
 * MSW (Mock Service Worker) Setup
 * ============================================================ */

/**
 * MSW 초기화 (MODE가 'local'일 때만 활성화)
 */
async function initializeMSW() {
  const mode = import.meta.env.VITE_MODE || import.meta.env.MODE;

  if (mode !== 'local') {
    console.log(`[MSW] Skipping - MODE is not "local" (current: ${mode})`);
    return;
  }

  console.log('[MSW] Initializing... (MODE: local)');
  console.log('[MSW] DEV mode:', import.meta.env.DEV);
  console.log('[MSW] Service Worker support:', 'serviceWorker' in navigator);

  try {
    const { worker } = await import('./api');
    console.log('[MSW] Worker imported successfully');

    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: false,
    });

    console.log('[MSW] ✅ Mock Service Worker started successfully');
  } catch (error) {
    console.error('[MSW] ❌ Failed to initialize:', error);
    console.warn('[MSW] Continuing without MSW - will use actual API if available');
  }
}

/* ============================================================
 * Components
 * ============================================================ */

/**
 * Message Provider - Ant Design 메시지 인스턴스 초기화
 */
function MessageProvider() {
  const { message } = AntdApp.useApp();
  messageInstance = message;
  return null;
}

/**
 * Root Component - 앱의 최상위 컴포넌트
 */
function Root() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={THEME_CONFIG}>
          <AntdApp>
            <MessageProvider />
            <App />
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

/* ============================================================
 * App Initialization
 * ============================================================ */

/**
 * 앱 렌더링
 */
function renderApp() {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  console.log('[App] Starting to render...');
  createRoot(rootElement).render(<Root />);
}

/**
 * 앱 시작 - MSW 초기화 후 렌더링
 */
initializeMSW()
  .then(renderApp)
  .catch((error) => {
    console.error('[App] ❌ Failed to initialize:', error);
    // MSW 실패해도 앱은 렌더링 (실제 API 호출로 fallback)
    renderApp();
  });

// Fast refresh를 위한 빈 export
export { };

