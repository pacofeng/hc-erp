# HC ERP Functional Specification

| Document | Value |
| --- | --- |
| Product | HC ERP |
| Frontend version | 1.0.0 |
| Document status | As implemented |
| Last updated | June 20, 2026 |

## 1. Purpose

HC ERP provides an identity, access-control, and human-resources foundation for managing:

- Employees and emergency contacts
- Departments and reporting relationships
- User accounts
- Roles and permissions
- Account-to-role and role-to-permission assignments
- Personal profile settings
- Authentication, security questions, and password recovery

This document describes the current implemented behavior of the Next.js frontend, Spring Boot APIs, and PostgreSQL database.

## 2. Technology and Architecture

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, local shadcn-style components |
| Backend | Java 21, Spring Boot 4, Spring Web, Spring Data JPA |
| Security | Spring Security, stateless JWT, BCrypt |
| Database | PostgreSQL, Flyway, `pgcrypto` UUID generation |
| API base URL | `http://localhost:8080/api` by default |
| Frontend language | Simplified Chinese by default; English supported |

The frontend stores the current session, preferred language, and last selected module in browser storage. The backend remains stateless and validates the JWT on every protected request.

## 3. Users, Roles, and Permissions

### 3.1 Roles

| Role code | Intended access |
| --- | --- |
| `SYSTEM_ADMIN` | Full system administration, including accounts, roles, permissions, employees, and departments |
| Authenticated account without these authorities | Dashboard and own Settings page only |

There is no separately implemented `DEPARTMENT_MANAGER` role.

### 3.2 Permission codes

| Module | Permission codes |
| --- | --- |
| Employee | `EMPLOYEE_VIEW`, `EMPLOYEE_CREATE`, `EMPLOYEE_EDIT`, `EMPLOYEE_DELETE` |
| Department | `DEPARTMENT_VIEW`, `DEPARTMENT_CREATE`, `DEPARTMENT_EDIT`, `DEPARTMENT_DELETE` |

### 3.3 Default role grants

| Role | Granted permissions |
| --- | --- |
| `SYSTEM_ADMIN` | All employee and department permissions |

### 3.4 UI visibility matrix

| View or action | System Admin | Other authenticated account |
| --- | ---: | ---: |
| Dashboard | Yes | Yes |
| Employee list | Yes | No |
| Create/edit/delete employee | Yes | No |
| Department list | Yes | No |
| Create/edit/delete department | Yes | No |
| Account administration | Yes | No |
| Role administration | Yes | No |
| Permission administration | Yes | No | No | No |
| Own Settings page | Yes | Yes | Yes | Yes |

Unauthorized modules are hidden from the sidebar and dashboard. Unauthorized create, edit, and delete controls are also hidden. Backend authorization is still authoritative.

## 4. Routing and Session Flows

### 4.1 Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/login` | Login and forgot-password entry | Public |
| `/security-questions` | Initial security-question setup | Authenticated account without configured questions |
| `/dashboard` | Landing page after successful login | Authenticated |
| `/employees` | Employee list and maintenance | Permission controlled |
| `/departments` | Department list and maintenance | Permission controlled |
| `/accounts` | Account administration | System Admin |
| `/roles` | Role administration | System Admin |
| `/permissions` | Permission administration | System Admin |
| `/settings` | Current user's profile settings | Any authenticated account |

Direct module URLs open that module when authorized. Refreshing the browser preserves the current route. An unauthorized or unknown protected route resolves to the first allowed resource.

### 4.2 Login flow

1. The login page defaults to Simplified Chinese and permits language selection.
2. The user enters username and password.
3. The frontend validates both fields without HTML5 native validation.
4. `POST /api/auth/login` authenticates the credentials.
5. The returned JWT, username, authorities, language, and security-question status are saved in local storage.
6. If security questions are configured, the user is sent to `/dashboard`.
7. If security questions are not configured, the user is sent to `/security-questions`.

The language selected on the login page is retained after login and is persisted to the account when it differs from the stored preference.

### 4.3 Mandatory security-question setup

1. The system loads the supported question list.
2. The user selects three unique questions.
3. Each answer is required.
4. The backend normalizes and BCrypt-hashes each answer.
5. After successful save, the account is marked as configured and the user is sent to `/dashboard`.

### 4.4 Forgot-password flow

1. The user opens **Forgot Password?** from the login page.
2. The username is submitted to obtain one randomly selected question from the account's three saved questions.
3. The user answers the selected question.
4. A correct answer produces a one-time reset token valid for 10 minutes.
5. The user enters and confirms a new password.
6. The password must contain at least eight characters, a letter, a number, and a special character.
7. The backend BCrypt-hashes the password, increments `password_version`, and clears the reset token.
8. Existing JWTs become invalid because their password version no longer matches the account.

### 4.5 Token expiration and logout

- Protected API calls use `Authorization: Bearer <token>`.
- A `401` response clears the stored session and redirects to `/login`.
- JWT expiration is 480 minutes by default and is configurable.
- Password changes invalidate older JWTs through `password_version`.
- Manual logout clears the browser session and redirects to `/login`.

### 4.6 Inactivity logout

- The inactivity period is 10 minutes.
- Tracked activity includes mouse movement, mouse button input, keyboard input, touch, scroll, and wheel events.
- A warning dialog appears one minute before logout.
- The dialog shows a seconds countdown.
- Clicking outside the warning actions does not reset inactivity.
- **Stay signed in** explicitly resets the timers.
- Timers and listeners are removed when the component unmounts.

## 5. Shared UI Behavior

### 5.1 Application chrome

- Sticky header with company logo
- Language selector with `简体中文` first and `English` second
- Logged-in username indicator
- Logout icon
- Permission-aware sidebar
- Sticky footer showing the version read from `frontend/package.json`

### 5.2 Tables

All administration tables:

- Hide internal UUID columns
- Support one active sortable column at a time
- Keep Actions unsortable
- Use client-side sorting
- Use client-side pagination
- Default to 20 rows per page
- Permit page sizes `5, 10, 20, 30, 40, 50, 100, 200`
- Provide Previous and Next page controls
- Show skeleton rows while loading
- Vertically center action icons
- Refresh after successful delete

Sorting and pagination are not written to the URL.

### 5.3 Forms and validation

- Inputs and selects use compact sizing.
- Required-field validation runs for all fields on Save or Submit.
- Field errors appear beneath their respective fields.
- Error text switches when the UI language changes.
- Forms do not use browser-native HTML5 validation messages.
- Password fields provide show/hide controls.
- Successful and failed operations display top-right toast messages.
- Delete operations require confirmation, except removing role/permission relationships inside assignment dropdowns.

### 5.4 Image upload behavior

Employee photos and account avatars:

- Are optional
- Accept JPG/JPEG, PNG, GIF, WebP, and BMP
- Have a maximum file size of 20 MB
- Support click-to-upload, preview, replace, and remove
- Are converted to base64 data URLs by the frontend
- Are stored directly in PostgreSQL `TEXT` columns

### 5.5 Address behavior

The Current Address section contains:

- Province
- City
- District / County
- Street/building/room address

Province, city, and district use searchable/clearable autocomplete fields backed by China administrative-division data. City options depend on Province, and District options depend on City. Changing a parent selection clears dependent values.

## 6. Dashboard

The dashboard is the default landing page for all authenticated accounts with completed security questions.

It displays:

- Dashboard title
- Welcome message with username
- Current localized date
- Buttons for modules the current account is authorized to access

## 7. Employee Management

### 7.1 Employee list

Displayed columns, in order:

1. Employee Number
2. Full Name
3. Job Title
4. Department name
5. Manager name
6. Hire Date
7. Actions

The table excludes internal UUIDs, termination date, and status.

### 7.2 Create and update dialog

The dialog uses a dedicated photo column on the left and a responsive
three-column form area on the right. On small screens, the photo appears first
and the remaining form sections stack below it.

#### Photo

| Field | Type | Required | Validation |
| --- | --- | ---: | --- |
| Photo | Image upload | No | Supported image type; maximum 20 MB |

#### Personal Info

| Field | Type | Required | Validation |
| --- | --- | ---: | --- |
| Full Name | Text | Yes | Nonblank |
| ID Card Number | Text | Yes | Exactly 18 UI characters; database unique |
| Gender | Select | Yes | `MALE`, `FEMALE` |
| Date of Birth | Date | Yes | Cannot be a future date in the UI |
| Marital Status | Select | Yes | `SINGLE`, `MARRIED`, `DIVORCED`, `WIDOWED` |
| Phone | Numeric text | Yes | Exactly 11 digits |

#### Current Address

| Field | Type | Required |
| --- | --- | ---: |
| Province | Autocomplete | No |
| City | Dependent autocomplete | No |
| District / County | Dependent autocomplete | No |
| Address | Text | No |

The Address field spans the full section width.

#### Emergency Contact

| Field | Type | Required | Validation |
| --- | --- | ---: | --- |
| Full Name | Text | Yes | Nonblank |
| Phone | Numeric text | Yes | Exactly 11 digits |
| Relation | Select | Yes | Supported relation code |

Relation values:

`SPOUSE`, `PARENT`, `CHILD`, `SIBLING`, `GRANDPARENT`, `AUNT_UNCLE`, `COUSIN`, `NIECE_NEPHEW`, `OTHER`.

#### Employment Info

| Field | Type | Required | Notes |
| --- | --- | ---: | --- |
| Employee Number | Text | Yes | Unique |
| Department | Select | No | Displays department name from the database |
| Manager | Searchable autocomplete | No | Displays employee name, supports clearing, and excludes the employee being edited |
| Job Title | Text | Yes | Nonblank |
| Hire Date | Date | Yes | |
| Termination Date | Date | No | Hidden when creating |
| Status | Select | Yes | Hidden on create; defaults to `ACTIVE` |

### 7.3 Employee deletion

- A confirmation dialog is required.
- If the employee owns an account, the dialog shows the associated account warning.
- Deleting an employee also deletes the linked account.
- Account role links are removed by database cascade.
- Emergency contact is deleted.
- Department-manager and employee-manager references to the employee are set to null.
- Assignment audit references created by the deleted account are set to null.

## 8. Department Management

| Field | Type | Required | Values or behavior |
| --- | --- | ---: | --- |
| Code | Text | Yes | Uppercase letters, numbers, `_`, or `-`; unique; editable only during create |
| Name | Text | Yes | Editable only during create |
| Manager | Searchable autocomplete | No | Displays employee names and stores the selected employee UUID |
| Status | Select | Yes | `ACTIVE`, `INACTIVE` |

The department table includes a read-only `Num of employees` column calculated from employees assigned to each department.

The create department dialog warns users that Code and Name cannot be changed after the department is created.

Deleting a department is blocked while any employee is assigned to it. The UI shows this warning in the delete confirmation dialog and the backend rejects the delete request.

## 9. Account Management

Account administration is restricted to `SYSTEM_ADMIN`.

| Field | Type | Required | Behavior |
| --- | --- | ---: | --- |
| Employee | Searchable autocomplete | Yes | Only active employees without an account are offered on create; current employee remains available during edit |
| Username | Text | Yes | Unique; editable only during create and read-only after the account is created |
| Password | Password | Create only | BCrypt-hashed; optional on update; must meet the password strength rule |
| Status | Select | Yes | `ACTIVE`, `LOCKED`, `TERMINATED` |
| Avatar | Image upload | No | Supported image type; maximum 20 MB |
| Preferred Language | Select | Yes | Defaults to `zh-CN`; values `zh-CN`, `en` |

The accounts table shows Employee, Username, Status, Preferred Language, Security Questions Configured, Last Login At, and Actions. It does not show Failed Login Count or Avatar.

The account edit dialog also contains an Account Roles multi-select. Changes are staged locally and written only when Save is clicked. Unselecting a role removes only the `account_roles` relationship and does not delete the role.

Deleting an account removes its account-role links by cascade and clears assignment audit references created by that account.

## 10. Role and Permission Management

### 10.1 Roles

| Field | Required | Values |
| --- | ---: | --- |
| Name | Yes | Text |
| Code | Yes | `SYSTEM_ADMIN`; unique |
| Status | Yes | `ACTIVE`, `INACTIVE` |
| Description | No | Text |

The role edit dialog includes a Role Permissions multi-select. Changes are persisted only when Save is clicked. Unselecting a permission removes only the relationship.

### 10.2 Permissions

| Field | Required | Values |
| --- | ---: | --- |
| Code | Yes | One of the eight employee/department permission codes |
| Name | Yes | Text |
| Description | No | Text |
| Module | Yes | `EMPLOYEE`, `DEPARTMENT` |

Deleting a role or permission removes related assignment rows through database cascade.

## 11. Settings

The Settings page is available to every authenticated account but requires the account to be linked to an employee.

The page uses a dedicated Avatar column on the left and a three-column profile
form on the right. On small screens, the Avatar appears first and the form
sections stack below it.

### 11.1 Avatar

The Avatar is editable and uses the same portrait preview, upload, replace, and
remove behavior as the employee Photo field.

### 11.2 Personal Info

| Field | Editable |
| --- | ---: |
| Username | No; disabled |
| Full Name | No; disabled |
| ID Card Number | No; disabled |
| Gender | No; disabled |
| Date of Birth | No; disabled |
| Marital Status | No; disabled |
| Phone | Yes |

### 11.3 Current Address

Province, City, District / County, and Address are editable.

### 11.4 Emergency Contact

Full Name, Phone, and Relation are editable and required.

### 11.5 Employment Info

Employee Number, Department, Manager, Job Title, Hire Date, Termination Date, and Status are displayed as disabled fields.

Saving updates only:

- Account avatar
- Employee phone
- Employee address fields
- Emergency-contact fields

## 12. REST API Specification

### 12.1 General conventions

- Base path: `/api`
- Content type: `application/json`
- Protected endpoints require `Authorization: Bearer <JWT>`.
- UUID values are strings.
- Dates use `YYYY-MM-DD`.
- Timestamps use ISO-8601 with timezone.
- Current create endpoints return `200 OK`, not `201 Created`.
- Current delete endpoints return `200 OK` with an empty body.
- There are no implemented item-level `GET /{id}` endpoints.
- There are no implemented `PATCH` endpoints.
- List endpoints currently return complete arrays; pagination, filtering, and sorting are performed by the frontend.

### 12.2 Common error response

```json
{
  "timestamp": "2026-06-20T08:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "phone Phone must be 11 digits"
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `200` | Successful operation |
| `400` | Invalid request or business validation failure |
| `401` | Invalid credentials or invalid/expired JWT |
| `403` | Authenticated but not authorized |
| `404` | Requested entity or linked profile not found |

### 12.3 Authentication APIs

#### `POST /api/auth/login`

Public.

Request:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:

```json
{
  "token": "<jwt>",
  "accountId": "uuid",
  "username": "admin",
  "language": "zh-CN",
  "securityQuestionsConfigured": false,
  "authorities": [
    "ROLE_SYSTEM_ADMIN",
    "EMPLOYEE_VIEW",
    "EMPLOYEE_CREATE"
  ]
}
```

#### `GET /api/auth/me`

Returns the current account identity, linked employee ID, language, security-question state, and authorities.

#### `PUT /api/auth/language`

Request:

```json
{
  "language": "zh-CN"
}
```

Response:

```json
{
  "language": "zh-CN"
}
```

#### `GET /api/auth/security-questions/options`

Public. Returns the supported English source question texts. The frontend translates their display labels.

#### `PUT /api/auth/security-questions`

Request:

```json
{
  "answers": [
    {
      "question": "What city were you born in?",
      "answer": "Guangzhou"
    },
    {
      "question": "What was the name of your first school?",
      "answer": "Example School"
    },
    {
      "question": "What was your first pet's name?",
      "answer": "Lucky"
    }
  ]
}
```

Response:

```json
{
  "securityQuestionsConfigured": true
}
```

#### `POST /api/auth/forgot-password/questions`

Public.

Request:

```json
{
  "username": "admin"
}
```

Response:

```json
{
  "questionIndex": 1,
  "question": "What was the name of your first school?"
}
```

#### `POST /api/auth/forgot-password/verify`

Public.

Request:

```json
{
  "username": "admin",
  "questionIndex": 1,
  "answer": "Example School"
}
```

Response:

```json
{
  "resetToken": "<one-time-token>"
}
```

#### `POST /api/auth/forgot-password/reset`

Public.

Request:

```json
{
  "username": "admin",
  "resetToken": "<one-time-token>",
  "newPassword": "NewPassword1!",
  "confirmPassword": "NewPassword1!"
}
```

Response:

```json
{
  "success": true
}
```

### 12.4 Employee APIs

| Method and path | Required authority | Description |
| --- | --- | --- |
| `GET /api/employees` | `EMPLOYEE_VIEW` or `ROLE_SYSTEM_ADMIN` | List all employees with emergency contacts |
| `POST /api/employees` | `EMPLOYEE_CREATE` or `ROLE_SYSTEM_ADMIN` | Create employee and emergency contact |
| `PUT /api/employees/{id}` | `EMPLOYEE_EDIT` or `ROLE_SYSTEM_ADMIN` | Replace editable employee/contact values |
| `DELETE /api/employees/{id}` | `EMPLOYEE_DELETE` or `ROLE_SYSTEM_ADMIN` | Hard-delete employee and linked data |

Employee request:

```json
{
  "employeeNo": "EMP-0100",
  "fullName": "Example Employee",
  "idCardNumber": "440100199001010001",
  "gender": "MALE",
  "dateOfBirth": "1990-01-01",
  "marriedStatus": "SINGLE",
  "addressProvince": "广东省",
  "addressCity": "广州市",
  "addressDistrict": "天河区",
  "address": "Example Street 1",
  "phone": "13800000001",
  "photo": null,
  "departmentId": "uuid-or-null",
  "managerId": "uuid-or-null",
  "jobTitle": "Engineer",
  "hireDate": "2026-06-20",
  "terminationDate": null,
  "status": "ACTIVE",
  "emergencyContact": {
    "fullName": "Example Contact",
    "phone": "13900000001",
    "relation": "SPOUSE"
  }
}
```

The response adds `id`, `createdAt`, `updatedAt`, and `emergencyContact.id`.

### 12.5 Department APIs

| Method and path | Required authority |
| --- | --- |
| `GET /api/departments` | `DEPARTMENT_VIEW` or `ROLE_SYSTEM_ADMIN` |
| `POST /api/departments` | `DEPARTMENT_CREATE` or `ROLE_SYSTEM_ADMIN` |
| `PUT /api/departments/{id}` | `DEPARTMENT_EDIT` or `ROLE_SYSTEM_ADMIN` |
| `DELETE /api/departments/{id}` | `DEPARTMENT_DELETE` or `ROLE_SYSTEM_ADMIN` |

Request:

```json
{
  "code": "ADMIN",
  "name": "Administration",
  "managerId": "uuid-or-null",
  "status": "ACTIVE"
}
```

### 12.6 Account APIs

All account APIs require `ROLE_SYSTEM_ADMIN`.

| Method and path | Description |
| --- | --- |
| `GET /api/accounts` | List account-safe views without password hashes or security-answer hashes |
| `POST /api/accounts` | Create an account |
| `PUT /api/accounts/{id}` | Update an account; password is optional |
| `DELETE /api/accounts/{id}` | Hard-delete an account |

Request:

```json
{
  "employeeId": "uuid-or-null",
  "username": "employee.user",
  "password": "Password1!",
  "status": "ACTIVE",
  "avatar": null,
  "preferredLanguage": "zh-CN"
}
```

Response:

```json
{
  "id": "uuid",
  "employeeId": "uuid-or-null",
  "username": "employee.user",
  "status": "ACTIVE",
  "accountType": "USER",
  "failedLoginCount": 0,
  "mustChangePassword": false,
  "preferredLanguage": "zh-CN",
  "avatar": null,
  "securityQuestionsConfigured": false,
  "lastLoginAt": null
}
```

### 12.7 Role APIs

All role APIs require `ROLE_SYSTEM_ADMIN`.

| Method and path | Description |
| --- | --- |
| `GET /api/roles` | List roles |
| `POST /api/roles` | Create role |
| `PUT /api/roles/{id}` | Update role |
| `DELETE /api/roles/{id}` | Delete role |

Request:

```json
{
  "name": "System Administrator",
  "code": "SYSTEM_ADMIN",
  "status": "ACTIVE",
  "description": "Full system administration access"
}
```

### 12.8 Permission APIs

All permission APIs require `ROLE_SYSTEM_ADMIN`.

| Method and path | Description |
| --- | --- |
| `GET /api/permissions` | List permissions |
| `POST /api/permissions` | Create permission |
| `PUT /api/permissions/{id}` | Update permission |
| `DELETE /api/permissions/{id}` | Delete permission |

Request:

```json
{
  "code": "EMPLOYEE_VIEW",
  "name": "View employees",
  "description": "Read employee records",
  "moduleCode": "EMPLOYEE"
}
```

### 12.9 Assignment APIs

All assignment APIs require `ROLE_SYSTEM_ADMIN`.

| Method and path | Description |
| --- | --- |
| `GET /api/assignments/accounts/{accountId}/roles` | List account-role links |
| `POST /api/assignments/accounts/{accountId}/roles/{roleId}` | Add account-role link idempotently |
| `DELETE /api/assignments/accounts/{accountId}/roles/{roleId}` | Remove account-role link |
| `GET /api/assignments/roles/{roleId}/permissions` | List role-permission links |
| `POST /api/assignments/roles/{roleId}/permissions/{permissionId}` | Add role-permission link idempotently |
| `DELETE /api/assignments/roles/{roleId}/permissions/{permissionId}` | Remove role-permission link |

### 12.10 Settings APIs

Any authenticated account may call these endpoints. A linked employee record is required.

| Method and path | Description |
| --- | --- |
| `GET /api/settings/profile` | Get account, personal, address, emergency-contact, and employment data |
| `PUT /api/settings/profile` | Update avatar, phone, address, and emergency contact |

Update request:

```json
{
  "avatar": null,
  "phone": "13800000001",
  "addressProvince": "广东省",
  "addressCity": "广州市",
  "addressDistrict": "天河区",
  "address": "Example Street 1",
  "emergencyContact": {
    "fullName": "Example Contact",
    "phone": "13900000001",
    "relation": "PARENT"
  }
}
```

## 13. Database Specification

### 13.1 Relationships

- A department may have one employee manager.
- An employee may belong to one department.
- An employee may report to another employee.
- An employee has at most one emergency-contact row.
- An employee has at most one account.
- Accounts and roles have a many-to-many relationship through `account_roles`.
- Roles and permissions have a many-to-many relationship through `role_permissions`.

### 13.2 `departments`

| Column | Type | Null | Constraints/default |
| --- | --- | ---: | --- |
| `id` | UUID | No | PK, `gen_random_uuid()` |
| `code` | VARCHAR(50) | No | Unique; uppercase department code |
| `name` | VARCHAR(100) | No | |
| `manager_id` | UUID | Yes | FK to `employees.id` |
| `status` | VARCHAR(50) | No | Default `ACTIVE`; `ACTIVE` or `INACTIVE` |
| `created_at` | TIMESTAMPTZ | No | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | |

### 13.3 `employees`

| Column | Type | Null | Constraints/default |
| --- | --- | ---: | --- |
| `id` | UUID | No | PK, `gen_random_uuid()` |
| `employee_no` | VARCHAR(50) | No | Unique |
| `full_name` | VARCHAR(200) | No | |
| `id_card_number` | VARCHAR(18) | No | Unique |
| `gender` | VARCHAR(50) | No | `MALE` or `FEMALE` |
| `date_of_birth` | DATE | No | |
| `married_status` | VARCHAR(50) | No | Default `SINGLE`; supported marital values |
| `address_province` | VARCHAR(100) | Yes | |
| `address_city` | VARCHAR(100) | Yes | |
| `address_district` | VARCHAR(100) | Yes | |
| `address` | TEXT | Yes | |
| `phone` | VARCHAR(50) | No | Exactly 11 digits |
| `photo` | TEXT | Yes | Base64 image data URL |
| `department_id` | UUID | Yes | FK to `departments.id`; indexed |
| `manager_id` | UUID | Yes | Self-FK to `employees.id`; indexed |
| `job_title` | VARCHAR(100) | No | |
| `hire_date` | DATE | No | |
| `termination_date` | DATE | Yes | |
| `status` | VARCHAR(50) | No | Default `ACTIVE`; `ACTIVE` or `TERMINATED` |
| `created_at` | TIMESTAMPTZ | No | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | No | Default `NOW()` |

### 13.4 `emergency_contact`

| Column | Type | Null | Constraints/default |
| --- | --- | ---: | --- |
| `id` | UUID | No | PK, `gen_random_uuid()` |
| `employee_id` | UUID | No | Unique FK to `employees.id`, `ON DELETE CASCADE` |
| `full_name` | VARCHAR(200) | No | |
| `phone` | VARCHAR(50) | No | Exactly 11 digits |
| `relation` | VARCHAR(100) | No | |
| `created_at` | TIMESTAMPTZ | No | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | No | Default `NOW()` |

### 13.5 `accounts`

| Column | Type | Null | Constraints/default |
| --- | --- | ---: | --- |
| `id` | UUID | No | PK, `gen_random_uuid()` |
| `employee_id` | UUID | Yes | Unique FK to `employees.id`; indexed |
| `username` | VARCHAR(100) | No | Unique |
| `password_hash` | VARCHAR(255) | No | BCrypt hash |
| `status` | VARCHAR(50) | No | Default `ACTIVE`; `ACTIVE`, `LOCKED`, `TERMINATED` |
| `account_type` | VARCHAR(50) | No | Default `USER`; `USER` or `SYSTEM` |
| `failed_login_count` | INTEGER | Yes | Default `0` |
| `must_change_password` | BOOLEAN | Yes | Default `FALSE` |
| `preferred_language` | VARCHAR(10) | No | Default `zh-CN`; `en` or `zh-CN` |
| `avatar` | TEXT | Yes | Base64 image data URL |
| `security_questions_configured` | BOOLEAN | No | Default `FALSE` |
| `security_question_1..3` | TEXT | Yes | Stored question codes |
| `security_answer_hash_1..3` | VARCHAR(255) | Yes | BCrypt hashes |
| `password_version` | INTEGER | No | Default `0`; invalidates older JWTs |
| `password_reset_token_hash` | VARCHAR(255) | Yes | BCrypt reset-token hash |
| `password_reset_token_expires_at` | TIMESTAMPTZ | Yes | |
| `password_changed_at` | TIMESTAMPTZ | Yes | |
| `last_login_at` | TIMESTAMPTZ | Yes | |
| `last_login_ip` | VARCHAR(45) | Yes | IPv4/IPv6 text |
| `created_at` | TIMESTAMPTZ | No | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | No | Default `NOW()` |

When `security_questions_configured` is true, all three question and answer-hash pairs must be populated.

### 13.6 `roles`

| Column | Type | Null | Constraints/default |
| --- | --- | ---: | --- |
| `id` | UUID | No | PK, `gen_random_uuid()` |
| `name` | VARCHAR(100) | No | |
| `code` | VARCHAR(50) | No | Unique; one of the three role codes |
| `status` | VARCHAR(50) | No | Default `ACTIVE`; `ACTIVE` or `INACTIVE` |
| `description` | TEXT | Yes | |
| `created_at` | TIMESTAMPTZ | No | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | |

### 13.7 `permissions`

| Column | Type | Null | Constraints/default |
| --- | --- | ---: | --- |
| `id` | UUID | No | PK, `gen_random_uuid()` |
| `code` | VARCHAR(50) | No | Unique; one of the eight permission codes |
| `name` | VARCHAR(100) | No | |
| `description` | TEXT | Yes | |
| `module_code` | VARCHAR(50) | No | `EMPLOYEE` or `DEPARTMENT` |
| `created_at` | TIMESTAMPTZ | No | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | |

### 13.8 `account_roles`

| Column | Type | Null | Constraints/default |
| --- | --- | ---: | --- |
| `id` | UUID | No | PK, `gen_random_uuid()` |
| `account_id` | UUID | No | FK to `accounts.id`, `ON DELETE CASCADE` |
| `role_id` | UUID | No | FK to `roles.id`, `ON DELETE CASCADE` |
| `created_at` | TIMESTAMPTZ | No | Default `NOW()` |
| `created_by` | UUID | Yes | FK to `accounts.id` |

The pair `(account_id, role_id)` is unique.

### 13.9 `role_permissions`

| Column | Type | Null | Constraints/default |
| --- | --- | ---: | --- |
| `id` | UUID | No | PK, `gen_random_uuid()` |
| `role_id` | UUID | No | FK to `roles.id`, `ON DELETE CASCADE` |
| `permission_id` | UUID | No | FK to `permissions.id`, `ON DELETE CASCADE` |
| `created_at` | TIMESTAMPTZ | No | Default `NOW()` |
| `created_by` | UUID | Yes | FK to `accounts.id` |

The pair `(role_id, permission_id)` is unique.

## 14. Initial and Sample Data

The Flyway migrations establish:

- 17 default departments:

| Code | Name |
| --- | --- |
| `SYS` | System |
| `MGMT` | Management |
| `FIN` | Finance |
| `PROC` | Procurement |
| `DS` | Domestic Sales |
| `IS` | International Sales |
| `ADMIN` | Administration |
| `AFTER` | After-Sales |
| `RES` | Research |
| `MECH` | Mechanical Processing |
| `FIT` | Fitter Workshop |
| `QASM` | Quilting Machine Assembly |
| `CASM` | Cutting Machine Assembly |
| `PAINT` | Painting |
| `ELEC` | Electrical |
| `WH` | Warehouse |
| `LOG` | Logistics |

- Three roles
- Eight permissions
- Default role-permission grants

Application startup creates the default administrator when absent:

| Property | Value |
| --- | --- |
| Username | `admin` |
| Initial password | `admin123` |
| Employee number | `EMP-0001` |
| Department | System |
| Role | System Administrator |

Flyway `V1__init_schema.sql` inserts 50 active sample employees:

- 25 without a department
- 25 assigned to Administration
- No managers
- No termination dates
- One emergency-contact row per employee

## 15. Security and Data Rules

- Passwords, security answers, and reset tokens are never stored in plaintext.
- Account API responses exclude hashes and reset-token fields.
- JWTs are signed using the configured secret.
- CSRF is disabled because the API uses stateless bearer tokens.
- CORS allows configured origins and local development origins.
- Locked and terminated accounts cannot authenticate as active users.
- Only active roles contribute authorities.
- Employee and account deletion are hard deletes; there are no soft-delete columns.
- IDs are retained in API/database contracts but hidden in UI tables.

## 16. Current Implementation Boundaries

The following are not currently implemented:

- Server-side list pagination, search, or filtering
- Item-level `GET /api/{resource}/{id}` endpoints
- `PATCH` endpoints
- Multi-column sorting
- URL-persisted sorting or pagination
- A separate Department Manager role
- External object storage for photos or avatars
- Refresh tokens or server-side session records
- Account lockout escalation based on failed-login count
- A user-facing forced-password-change flow for `must_change_password`

These boundaries should be treated as future enhancements rather than current requirements.
