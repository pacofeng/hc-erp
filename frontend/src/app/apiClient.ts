import {
  API_BASE,
  AUTH_EXPIRED_EVENT,
  LOGIN_PATH,
  POST_LOGIN_RESOURCE_KEY,
} from "./constants";
import { getResourceFromPath, navigate } from "./resources";
import type { Session } from "./types";

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
    throw new Error(body.message ?? `Request failed: ${response.status}`);
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
