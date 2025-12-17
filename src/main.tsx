import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig
} from '@tanstack/react-query';
import { ConfigProvider, message, theme } from 'antd';
import 'antd/dist/reset.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/global.scss';

// 전역 에러 핸들러
const handleGlobalError = (error: Error) => {
  const errorData = error as { message?: string };
  const errorMsg = errorData?.message || '오류가 발생했습니다.';

  message.error(errorMsg);
  console.error('[React Query Error]:', error);
};

const queryClientConfig: QueryClientConfig = {
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: Error) => {
        // Axios 에러 타입 체크
        const status = (error as { response?: { status?: number } })?.response?.status;
        switch (status) {
          case 403:
            return failureCount < 1; // 403 에러일 경우 재시도 1번
          default:
            return failureCount < 1; // 기본 재시도 1번
        }
      },
      staleTime: 1000,
    },
    mutations: {
      retry: false,
    },
  },
};

const queryClient = new QueryClient(queryClientConfig);

async function enableMocking() {
  if (!import.meta.env.DEV) {
    console.log('[MSW] Skipping in production mode');
    return;
  }

  console.log('[MSW] Initializing...');
  console.log('[MSW] DEV mode:', import.meta.env.DEV);
  console.log('[MSW] Service Worker support:', 'serviceWorker' in navigator);

  try {
    const { worker } = await import('./api');
    console.log('[MSW] Worker imported successfully');

    // `worker.start()` returns a Promise that resolves
    // once the Service Worker is up and ready to intercept requests.
    const registration = await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: false, // 디버깅용 로그 활성화
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });

    console.log('[MSW] ✅ Mock Service Worker started successfully', registration);
  } catch (error) {
    console.error('[MSW] Failed to initialize:', error);
    throw error;
  }
}

enableMocking()
  .then(() => {
    console.log('[App] Starting to render...');
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#3b82f6',
                borderRadius: 8,
                fontFamily: 'Noto Sans KR, -apple-system, BlinkMacSystemFont, sans-serif',
              },
            }}
          >
            <App />
          </ConfigProvider>
        </QueryClientProvider>
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error('[MSW] ❌ Failed to start:', error);
    // MSW 실패해도 앱은 렌더링 (실제 API 호출하게 됨)
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#3b82f6',
                borderRadius: 8,
                fontFamily: 'Noto Sans KR, -apple-system, BlinkMacSystemFont, sans-serif',
              },
            }}
          >
            <App />
          </ConfigProvider>
        </QueryClientProvider>
      </StrictMode>
    );
  });
