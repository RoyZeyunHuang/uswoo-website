
/** 用得到的请求选项 */
export interface ApiOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

interface Envelope<T> {
  status: "success" | "error";
  data: T;
  message?: string;
  error_key?: string;
}

/** 接口返回了业务错误（信封里 status = error，或 HTTP 状态非 2xx） */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorKey: string
  ) {
    super(message);
  }
}

/**
 * 公开接口的统一请求。
 * 浏览器端请求 https://uswoo.com/api/uswoo/public/*；服务端渲染配置了内网基址时直连 Vectra 后端（同一组接口）。
 */
export function useApi() {
  const config = useRuntimeConfig();
  const serverBase = import.meta.server ? String(config.apiBaseServer || "") : "";
  const base = (serverBase || config.public.apiBase).replace(/\/$/, "");
  const headers: Record<string, string> = {};
  if (serverBase && config.apiHostHeader) headers.host = String(config.apiHostHeader);

  return async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
    try {
      const response = await $fetch<Envelope<T>>(`${base}${path}`, { timeout: 10000, ...options, headers: { ...headers, ...options.headers } });
      if (response?.status !== "success") throw new ApiError(response?.message || "Request failed", 502, response?.error_key || "");
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const failure = error as { statusCode?: number; status?: number; data?: Partial<Envelope<unknown>>; message?: string };
      throw new ApiError(failure.data?.message || failure.message || "Request failed", failure.statusCode ?? failure.status ?? 502, failure.data?.error_key || "");
    }
  };
}

/** 接口 404（内容还没发布、地区不存在等）时返回 null，其余错误照常抛出 */
export async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
