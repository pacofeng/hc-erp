# HC ERP

A complete ERP identity and HR foundation module built from the provided PostgreSQL schema.

## Stack

- Backend: Java 21, Spring Boot 4, Spring Security, JWT, Spring Data JPA, Flyway
- Frontend: React 19, Material UI 9, Vite
- Database: PostgreSQL

## Structure

- `backend/` - Spring Boot API and PostgreSQL migrations
- `frontend/` - React/MUI client

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
   npm install
   npm run dev
   ```

Default backend configuration can be overridden with environment variables such as `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET`.
