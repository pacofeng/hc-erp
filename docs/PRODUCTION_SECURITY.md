# Production Security Checklist

## Required environment

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and a randomly generated `JWT_SECRET` are required. Do not use the PostgreSQL superuser for the application.
- Set `AUTH_COOKIE_SECURE=true`, `AUTH_COOKIE_SAME_SITE=Strict`, and `CORS_ALLOWED_ORIGINS` to the exact HTTPS frontend origin.
- Run the application behind an HTTPS reverse proxy. Redirect HTTP to HTTPS and retain the `X-Forwarded-For` header only from trusted proxies.

## Database access

Create a dedicated login role with only the privileges required on the `hcerp` database. Do not use `postgres` for the deployed service. Restrict database network access to the application hosts and encrypt backups.

## Authentication

The application uses an HttpOnly authentication cookie, CSRF protection, a 30-minute JWT expiry, password-version invalidation, public-authentication rate limits, and a 15-minute account lock after five failed logins.

The built-in rate limiter is intentionally in-process. Deploy a gateway/WAF and shared Redis-backed rate limiting before operating multiple backend instances. Security-question password reset is a fallback only; integrate a verified email, SMS, or identity provider MFA flow before exposing the application publicly.

## Operations

- Terminate TLS with a maintained certificate and enable monitoring for authentication failures, authorization failures, and unexpected 5xx responses.
- Apply operating-system, Java, PostgreSQL, npm, and Maven dependency updates on a defined schedule.
- Perform encrypted backup and restore tests regularly.
