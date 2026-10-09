import {
  API_BASE,
  AUTH_EXPIRED_EVENT,
  LOGIN_PATH,
  POST_LOGIN_RESOURCE_KEY,
} from "./constants";
import { getResourceFromPath, navigate } from "./resources";
import type { Session } from "./types";
import { messages } from "./i18n";

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

export function clearCsrfToken() {
  csrfToken = null;
  csrfRequest = null;
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = fetch(`${API_BASE}/auth/csrf`, { credentials: "include" })
      .then(async response => {
        if (!response.ok) throw new Error("无法初始化安全会话");
        const body = await response.json() as { token: string };
        csrfToken = body.token;
        return csrfToken;
      })
      .finally(() => { csrfRequest = null; });
  }
  return csrfRequest;
}

function requiresCsrf(method?: string) {
  return !["GET", "HEAD", "OPTIONS"].includes((method ?? "GET").toUpperCase());
}

export async function api<T>(
  path: string,
  session?: Session,
  init: RequestInit = {},
): Promise<T> {
  const method = init.method ?? "GET";
  const request = async (token?: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["X-XSRF-TOKEN"] = token;
    return fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: { ...headers, ...init.headers },
    });
  };

  let response = await request(requiresCsrf(method) ? await getCsrfToken() : undefined);
  if (response.status === 403 && requiresCsrf(method)) {
    clearCsrfToken();
    response = await request(await getCsrfToken());
  }
  const text = await response.text();
  if (!response.ok) {
    if (session && response.status === 401) {
      expireSession();
    }
    const body = text ? tryParseJson(text) : {};
    const message = body.message;
    const required = typeof message === "string"
      ? message.match(/^(\S+) must not be (?:null|blank|empty)$/)
      : null;
    if (required) {
      const field = required[1] as keyof typeof messages.fields;
      throw new Error(messages.requiredFields + (messages.fields[field] ?? field));
    }
    throw new Error(message === "Duplicate value already exists"
      ? "数据已存在，请检查员工编号、身份证号码等唯一字段"
      : message ?? `请求失败（${response.status}）`);
  }
  if (path === "/auth/login") clearCsrfToken();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

function tryParseJson(text: string): Record<string, string> {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function expireSession() {
  const requestedResource = getResourceFromPath();
  if (requestedResource && requestedResource !== "dashboard") {
    sessionStorage.setItem(POST_LOGIN_RESOURCE_KEY, requestedResource);
  }
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  navigate(LOGIN_PATH, true);
}
