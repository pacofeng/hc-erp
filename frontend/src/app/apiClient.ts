import {
  API_BASE,
  AUTH_EXPIRED_EVENT,
  LOGIN_PATH,
  POST_LOGIN_RESOURCE_KEY,
} from "./constants";
import { getResourceFromPath, navigate } from "./resources";
import type { Session } from "./types";
import { messages } from "./i18n";

export function authHeaders(session: Session) {
  return {
    Authorization: `Bearer ${session.token}`,
    "Content-Type": "application/json",
  };
}

export async function api<T>(
  path: string,
  session?: Session,
  init: RequestInit = {},
): Promise<T> {
  const headers = session
    ? authHeaders(session)
    : { "Content-Type": "application/json" };
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
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
  localStorage.removeItem("hcerp-session");
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  navigate(LOGIN_PATH, true);
}
