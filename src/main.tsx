import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import 'antd/dist/reset.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/global.scss';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
