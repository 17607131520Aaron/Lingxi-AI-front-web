import axios, { type AxiosRequestConfig } from "axios";
import { getErrorMessageByCode } from "@/lib/errorCodeMap";
import { clearAuthSession } from "@/utils/authSession";
import { publishNavigate } from "@/utils/navigationBus";
import { tokenStorage } from "@/utils/tokenStorage";

export interface ApiEnvelope<T> {
  code: number;
  data: T;
  messages?: string;
}

interface RequestOptions {
  raw?: boolean;
}

export class ApiRequestError extends Error {
  code: number;
  status?: number;

  constructor(message: string, code: number, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const networkCode: string | undefined = error?.code;
    if (!error?.response && (networkCode === "ECONNREFUSED" || networkCode === "ERR_NETWORK")) {
      throw new ApiRequestError("后端服务连接失败，请确认服务已启动并检查端口配置", 50300, 503);
    }
    const status: number | undefined = error?.response?.status;
    const data = error?.response?.data as ApiEnvelope<unknown> | undefined;
    const code = data?.code ?? status ?? 50000;
    const msg = data?.messages ?? getErrorMessageByCode(code, "请求失败，请稍后重试");
    if (status === 401 || code === 40102 || code === 40103) {
      await clearAuthSession();
      publishNavigate({ to: "/login", replace: true });
    }
    throw new ApiRequestError(msg, code, status);
  },
);

export function request<T>(config: AxiosRequestConfig): Promise<T>;
export function request<T>(config: AxiosRequestConfig, options: { raw: true }): Promise<ApiEnvelope<T>>;
export function request<T>(config: AxiosRequestConfig, options: { raw?: false }): Promise<T>;
export async function request<T>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T | ApiEnvelope<T>> {
  const response = await api.request<ApiEnvelope<T>>(config);
  const body = response.data;
  if (body.code !== 0) {
    throw new ApiRequestError(body.messages ?? getErrorMessageByCode(body.code), body.code, response.status);
  }
  if (options?.raw) {
    return body;
  }
  return body.data;
}

export const http = {
  get<T>(url: string, config?: Omit<AxiosRequestConfig, "url" | "method">) {
    return request<T>({ ...config, method: "GET", url });
  },
  post<T>(url: string, data?: unknown, config?: Omit<AxiosRequestConfig, "url" | "method" | "data">) {
    return request<T>({ ...config, method: "POST", url, data });
  },
  put<T>(url: string, data?: unknown, config?: Omit<AxiosRequestConfig, "url" | "method" | "data">) {
    return request<T>({ ...config, method: "PUT", url, data });
  },
  delete<T>(url: string, config?: Omit<AxiosRequestConfig, "url" | "method">) {
    return request<T>({ ...config, method: "DELETE", url });
  },
  getRaw<T>(url: string, config?: Omit<AxiosRequestConfig, "url" | "method">) {
    return request<T>({ ...config, method: "GET", url }, { raw: true });
  },
  postRaw<T>(url: string, data?: unknown, config?: Omit<AxiosRequestConfig, "url" | "method" | "data">) {
    return request<T>({ ...config, method: "POST", url, data }, { raw: true });
  },
  putRaw<T>(url: string, data?: unknown, config?: Omit<AxiosRequestConfig, "url" | "method" | "data">) {
    return request<T>({ ...config, method: "PUT", url, data }, { raw: true });
  },
  deleteRaw<T>(url: string, config?: Omit<AxiosRequestConfig, "url" | "method">) {
    return request<T>({ ...config, method: "DELETE", url }, { raw: true });
  },
};
