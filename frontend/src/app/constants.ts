export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://localhost:8080/api";
export const LOGO_SRC = "/images/logo.png";

export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;
export const IMAGE_UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/gif,image/webp,image/bmp,.png,.jpg,.jpeg,.gif,.webp,.bmp";
export const IMAGE_UPLOAD_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/bmp",
]);

export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
export const INACTIVITY_WARNING_MS = INACTIVITY_TIMEOUT_MS - 60 * 1000;
export const INACTIVITY_WARNING_SECONDS = Math.ceil(
  (INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_MS) / 1000,
);

export const RESOURCE_STORAGE_KEY = "hcerp-resource";
export const POST_LOGIN_RESOURCE_KEY = "hcerp-post-login-resource";
export const AUTH_EXPIRED_EVENT = "hcerp-auth-expired";
export const USER_ACTIVITY_EVENT = "hcerp-user-activity";
export const LOGIN_PATH = "/login";

export const dateOnlyColumns = new Set([
  "dateOfBirth",
  "hireDate",
  "terminationDate",
]);
export const pageSizeOptions = [5, 10, 20, 30, 40, 50, 100, 200];
