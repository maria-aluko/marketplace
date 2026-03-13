const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Server-side fetch utility for Next.js server components.
 * Centralises API_URL and provides consistent caching defaults.
 * Unwraps `{ data: T }` envelope automatically.
 */
export async function serverFetch<T>(
  path: string,
  options?: { revalidate?: number; tags?: string[] },
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: {
        revalidate: options?.revalidate ?? 60,
        tags: options?.tags,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Server-side fetch that returns the full JSON without unwrapping `.data`.
 * Useful for endpoints that don't use the `{ data: T }` envelope (e.g. search).
 */
export async function serverFetchRaw<T>(
  path: string,
  options?: { revalidate?: number; tags?: string[] },
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: {
        revalidate: options?.revalidate ?? 60,
        tags: options?.tags,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
