/**
 * Cookie 관리 유틸리티
 * Access Token과 Refresh Token을 관리합니다.
 */

const COOKIE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

class CookieUtil {
  /**
   * 쿠키 설정
   */
  private setCookie(name: string, value: string, days: number = 7): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }

  /**
   * 쿠키 가져오기
   */
  private getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }

    return null;
  }

  /**
   * 쿠키 삭제
   */
  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
  }

  /**
   * Access Token 설정
   */
  setAccessToken(token: string): void {
    // Bearer 접두사 제거
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    this.setCookie(COOKIE_KEYS.ACCESS_TOKEN, cleanToken, 1); // 1일
  }

  /**
   * Access Token 가져오기
   */
  getAccessToken(): string | null {
    return this.getCookie(COOKIE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Refresh Token 설정
   */
  setRefreshToken(token: string): void {
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    this.setCookie(COOKIE_KEYS.REFRESH_TOKEN, cleanToken, 30); // 30일
  }

  /**
   * Refresh Token 가져오기
   */
  getRefreshToken(): string | null {
    return this.getCookie(COOKIE_KEYS.REFRESH_TOKEN);
  }

  /**
   * 모든 토큰 삭제 (로그아웃)
   */
  clearTokens(): void {
    this.deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);
    this.deleteCookie(COOKIE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Access Token 존재 여부 확인
   */
  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }
}

export default new CookieUtil();

