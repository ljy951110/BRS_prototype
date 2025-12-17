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

// Message instance를 전역에서 사용하기 위한 변수
let messageInstance: MessageInstance;

// 전역 에러 핸들러
const handleGlobalError = (error: Error) => {
  const errorData = error as { message?: string };
  const errorMsg = errorData?.message || '오류가 발생했습니다.';

  console.error('[React Query Error]:', error);

  // messageInstance가 있을 때만 토스트 표시
  if (messageInstance) {
    messageInstance.error(errorMsg);
  } else {
    console.error('[Error Message]:', errorMsg);
  }
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
  const mode = import.meta.env.VITE_MODE || import.meta.env.MODE;

  // MODE가 'local'이 아니면 MSW를 사용하지 않음 (실제 API 호출)
  if (mode !== 'local') {
    console.log('[MSW] Skipping - MODE is not "local" (current:', mode, ')');
    return;
  }

  console.log('[MSW] Initializing... (MODE: local)');
  console.log('[MSW] DEV mode:', import.meta.env.DEV);
  console.log('[MSW] Service Worker support:', 'serviceWorker' in navigator);

  try {
    const { worker } = await import('./api');
    console.log('[MSW] Worker imported successfully');

    // `worker.start()` returns a Promise that resolves
    // once the Service Worker is up and ready to intercept requests.
    await worker.start({
      onUnhandledRequest: 'bypass', // 'warn' 대신 'bypass' 사용
      quiet: false, // 디버깅용 로그 활성화
    });

    console.log('[MSW] ✅ Mock Service Worker started successfully');
  } catch (error) {
    console.error('[MSW] Failed to initialize:', error);
    // MSW 초기화 실패해도 앱은 계속 실행 (실제 API 호출로 fallback)
    console.warn('[MSW] Continuing without MSW - will use actual API if available');
  }
}

// Message Provider 컴포넌트
function MessageProvider() {
  const { message } = AntdApp.useApp();
  messageInstance = message;
  return null;
}

// Root 컴포넌트
function Root() {
  return (
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
          <AntdApp>
            <MessageProvider />
            <App />
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

enableMocking()
  .then(() => {
    console.log('[App] Starting to render...');
    createRoot(document.getElementById('root')!).render(<Root />);
  })
  .catch((error) => {
    console.error('[MSW] ❌ Failed to start:', error);
    // MSW 실패해도 앱은 렌더링 (실제 API 호출하게 됨)
    createRoot(document.getElementById('root')!).render(<Root />);
  });
