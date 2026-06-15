CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    manager_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_department_code CHECK (code IN ('SYS', 'HR')),
    CONSTRAINT chk_department_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    id_card_number VARCHAR(18) UNIQUE NOT NULL,
    gender VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    married_status VARCHAR(50) NOT NULL DEFAULT 'SINGLE',
    address_province VARCHAR(100),
    address_city VARCHAR(100),
    address_district VARCHAR(100),
    address TEXT,
    phone VARCHAR(50) NOT NULL,
    photo TEXT,
    department_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES employees(id),
    job_title VARCHAR(100),
    hire_date DATE,
    termination_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_employee_gender CHECK (gender IN ('MALE', 'FEMALE')),
    CONSTRAINT chk_employee_status CHECK (status IN ('ACTIVE', 'TERMINATED')),
    CONSTRAINT chk_employee_married_status CHECK (married_status IN ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED')),
    CONSTRAINT chk_employees_phone_11_digits CHECK (phone ~ '^[0-9]{11}$')
);

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES employees(id);

CREATE TABLE emergency_contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    relation VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_emergency_contact_phone_11_digits CHECK (phone ~ '^[0-9]{11}$')
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE REFERENCES employees(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    account_type VARCHAR(50) NOT NULL DEFAULT 'USER',
    failed_login_count INTEGER DEFAULT 0,
    must_change_password BOOLEAN DEFAULT FALSE,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'zh-CN',
    avatar TEXT,
    security_questions_configured BOOLEAN NOT NULL DEFAULT FALSE,
    security_question_1 TEXT,
    security_answer_hash_1 VARCHAR(255),
    security_question_2 TEXT,
    security_answer_hash_2 VARCHAR(255),
    security_question_3 TEXT,
    security_answer_hash_3 VARCHAR(255),
    password_version INTEGER NOT NULL DEFAULT 0,
    password_reset_token_hash VARCHAR(255),
    password_reset_token_expires_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_account_status CHECK (status IN ('ACTIVE', 'LOCKED', 'TERMINATED')),
    CONSTRAINT chk_account_type CHECK (account_type IN ('USER', 'SYSTEM')),
    CONSTRAINT chk_accounts_preferred_language CHECK (preferred_language IN ('en', 'zh-CN')),
    CONSTRAINT chk_security_questions_complete CHECK (
        security_questions_configured = FALSE
        OR (
            security_question_1 IS NOT NULL
            AND security_answer_hash_1 IS NOT NULL
            AND security_question_2 IS NOT NULL
            AND security_answer_hash_2 IS NOT NULL
            AND security_question_3 IS NOT NULL
            AND security_answer_hash_3 IS NOT NULL
        )
    )
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_role_code CHECK (code IN ('SYSTEM_ADMIN', 'HR_MANAGER', 'HR_OFFICE')),
    CONSTRAINT chk_role_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    module_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_permission_code CHECK (code IN (
        'EMPLOYEE_VIEW',
        'EMPLOYEE_CREATE',
        'EMPLOYEE_EDIT',
        'EMPLOYEE_DELETE',
        'DEPARTMENT_VIEW',
        'DEPARTMENT_CREATE',
        'DEPARTMENT_EDIT',
        'DEPARTMENT_DELETE'
    )),
    CONSTRAINT chk_module_code CHECK (module_code IN ('EMPLOYEE', 'DEPARTMENT'))
);

CREATE TABLE account_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES accounts(id),
    CONSTRAINT uq_account_roles UNIQUE (account_id, role_id)
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES accounts(id),
    CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_emergency_contact_employee_id ON emergency_contact(employee_id);
CREATE INDEX idx_accounts_employee_id ON accounts(employee_id);
CREATE INDEX idx_account_roles_account_id ON account_roles(account_id);
CREATE INDEX idx_account_roles_role_id ON account_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

INSERT INTO departments (code, name, status)
VALUES
    ('SYS', 'System', 'ACTIVE'),
    ('HR', 'Human Resources', 'ACTIVE');

INSERT INTO roles (name, code, status, description)
VALUES
    ('System Administrator', 'SYSTEM_ADMIN', 'ACTIVE', 'Full system administration access'),
    ('HR Manager', 'HR_MANAGER', 'ACTIVE', 'Human resources management access'),
    ('HR Office', 'HR_OFFICE', 'ACTIVE', 'Human resources office access');

INSERT INTO permissions (code, name, description, module_code)
VALUES
    ('EMPLOYEE_VIEW', 'View employees', 'Read employee records', 'EMPLOYEE'),
    ('EMPLOYEE_CREATE', 'Create employees', 'Create employee records', 'EMPLOYEE'),
    ('EMPLOYEE_EDIT', 'Edit employees', 'Update employee records', 'EMPLOYEE'),
    ('EMPLOYEE_DELETE', 'Delete employees', 'Delete employee records', 'EMPLOYEE'),
    ('DEPARTMENT_VIEW', 'View departments', 'Read department records', 'DEPARTMENT'),
    ('DEPARTMENT_CREATE', 'Create departments', 'Create department records', 'DEPARTMENT'),
    ('DEPARTMENT_EDIT', 'Edit departments', 'Update department records', 'DEPARTMENT'),
    ('DEPARTMENT_DELETE', 'Delete departments', 'Delete department records', 'DEPARTMENT');

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.code IN ('SYSTEM_ADMIN', 'HR_MANAGER');

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
JOIN permissions permission ON permission.code IN ('EMPLOYEE_VIEW', 'DEPARTMENT_VIEW')
WHERE role.code = 'HR_OFFICE';
