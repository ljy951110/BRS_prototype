// repository/Axios.ts
import _axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

import CookieUtil from '@utils/CookieUtil';

/* ============================================================
 * Types
 * ============================================================ */

interface ApiErrorRs<T extends string = string> {
  code?: T;
  errors?: unknown[];
  httpStatus?: string;
  customCode?: string;
  message?: string;
  data?: unknown;
}

/* ============================================================
 * Base URL Resolver
 * ============================================================ */

/**
 * 환경변수에 따른 API baseURL을 반환합니다.
 * - VITE_MODE=local: MSW 사용 (baseURL 빈 문자열)
 * - VITE_API_URL 설정: 지정된 URL 사용
 * - 기타: 기본 API 서버 URL
 */
export const getBaseUrl = (): string => {
  const mode = import.meta.env.VITE_MODE || import.meta.env.MODE;
  const apiUrl = import.meta.env.VITE_API_URL;

  console.log('[Axios] Environment check:', {
    VITE_MODE: import.meta.env.VITE_MODE,
    MODE: import.meta.env.MODE,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    resolved_mode: mode,
  });

  // MODE가 'local'이면 MSW 사용 (빈 문자열 = 상대 경로)
  if (mode === 'local') {
    console.log('[Axios] ✅ Using MSW (MODE: local, baseURL: "")');
    return '';
  }

  // 환경 변수로 명시적으로 API URL이 설정된 경우
  if (apiUrl) {
    console.log('[Axios] Using API URL from env:', apiUrl);
    return apiUrl;
  }

  // 기본: 실제 API 서버 URL
  console.log('[Axios] Using default API URL');
  return 'https://dashboardapi-mu.vercel.app';
};

const baseURL = getBaseUrl();

/* ============================================================
 * Request Client
 * - 토큰 자동첨부
 * - 401 재발급 큐 처리
 * - 표준 에러 처리
 * ============================================================ */

export class RequestClient {
  private axiosInstance!: AxiosInstance;
  /** 바깥으로 노출할 axios 인스턴스 */
  get axios() {
    return this.axiosInstance;
  }

  /* ---------------- Initialization ---------------- */
  private init() {
    this.axiosInstance = _axios.create({
      baseURL,
      withCredentials: true,
      timeout: 30000, // 30초 타임아웃
      headers: {
        'Content-Type': 'application/json',
      }
    });
    // 기본 paramsSerializer 교체
    this.axiosInstance.defaults.paramsSerializer = this.defaultParamsSerializer;
    // 인터셉터
    this.setRequestInterceptor();
    this.setResponseInterceptor();
  }

  constructor() {
    this.init();
  }

  /* ---------------- Utils: Params Serializer ---------------- */

  /**
   * 기본 axios는 배열을 a[]=1&a[]=2 형태로 직렬화합니다.
   * 여기서는 백엔드 요구사항에 맞춰 key=1&key=2 형태로 직렬화합니다.
   * (필요 시 정책에 맞춰 조정하세요)
   */
  private defaultParamsSerializer = (paramObj: Record<string, unknown>) => {
    const params = new URLSearchParams();

    Object.entries(paramObj)
      .filter(([, value]) => value !== undefined && value !== null)
      .forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      });

    return params.toString();
  };

  /* ---------------- Interceptors ---------------- */

  /** Request: Authorization 자동주입 */
  private setRequestInterceptor() {
    this.axiosInstance.interceptors.request.use((config) => {
      const accessToken = CookieUtil.getAccessToken();

      if (accessToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    });
  }

  /** Response: 에러 표준 처리 + 401 재발급 */
  private setResponseInterceptor() {
    this.axiosInstance.interceptors.response.use(
      // 성공
      (response) => response,
      // 실패
      (e: AxiosError<ApiErrorRs>) => this.formatErrorResponse(e),
    );
  }

  /* ---------------- Error Handling ---------------- */

  private async formatErrorResponse(e: AxiosError<ApiErrorRs>): Promise<AxiosResponse | never> {
    const { response } = e;

    // 네트워크 에러 또는 타임아웃
    if (!response) {
      console.error('[Axios] Network Error:', e.message);
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: '네트워크 연결을 확인해주세요.',
        httpStatus: 'NETWORK_ERROR',
      });
    }

    // HTTP 에러 처리
    const { status, data } = response;
    const errorMsg = data?.message || '오류가 발생했습니다.';

    console.error(`[Axios] HTTP Error ${status}:`, data);

    return Promise.reject({
      ...data,
      code: data?.code || `HTTP_${status}`,
      message: errorMsg,
      httpStatus: status,
    });
  }
}

/**
 * 토큰을 저장하고, 공용 Authorization 헤더를 갱신합니다.
 * (주의: 여기서의 axios는 아래에서 export한 **인스턴스**입니다.)
 */
export const setAxiosHeader = (key: string = 'Authorization', value: string) => {
  CookieUtil.setAccessToken(value);
  axios.defaults.headers.common[key] = `Bearer ${value}`;
};

// 싱글턴 인스턴스 노출
const axios = new RequestClient().axios;

export { axios };
