# HC ERP

A complete ERP identity and HR foundation module built from the provided PostgreSQL schema.

See the [Functional Specification](docs/FUNCTIONAL_SPECIFICATION.md) for the implemented UI flows, REST APIs, permissions, validation rules, and database design.

## Stack

- Backend: Java 21, Spring Boot 4, Spring Security, JWT, Spring Data JPA, Flyway
- Frontend: Next.js, React 19, Tailwind CSS, shadcn-style components
- Database: PostgreSQL

## Structure

- `backend/` - Spring Boot API and PostgreSQL migrations
- `frontend/` - Next.js client

## Run Locally

1. Create a PostgreSQL database named `hcerp`.
2. Start the backend:

   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. Start the frontend:

   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

Default backend configuration can be overridden with environment variables such as `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET`.
