import type { ApiResponse } from '@eventtrust/shared';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@eventtrust/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match ? match.split('=')[1] ?? null : null;
}

class ApiClient {
  private baseUrl: string;
  private refreshing: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      cache?: RequestCache;
      next?: NextFetchRequestConfig;
      skipRefreshRetry?: boolean;
    },
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add CSRF token for mutating requests
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        headers[CSRF_HEADER_NAME] = csrfToken;
      }
    }

    const res = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      cache: options?.cache,
      next: options?.next,
    });

    // On 401, try token refresh once
    if (res.status === 401 && !options?.skipRefreshRetry) {
      const refreshed = await this.attemptRefresh();
      if (refreshed) {
        return this.request<T>(method, path, { ...options, skipRefreshRetry: true });
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      return { success: false, error: error.message || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { success: true, data };
  }

  private async attemptRefresh(): Promise<boolean> {
    // Deduplicate concurrent refresh attempts
    if (this.refreshing) return this.refreshing;

    this.refreshing = (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  get<T>(path: string, options?: { cache?: RequestCache; next?: NextFetchRequestConfig }) {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, { body });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, { body });
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

export const apiClient = new ApiClient(API_URL);
