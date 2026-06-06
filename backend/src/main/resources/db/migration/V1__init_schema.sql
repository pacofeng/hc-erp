CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    manager_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_department_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_no VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(50) NOT NULL,
    display_name VARCHAR(200),
    phone VARCHAR(50),
    department_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES employees(id),
    job_title VARCHAR(100),
    hire_date DATE,
    termination_date DATE,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_employee_gender CHECK (gender IN ('MALE', 'FEMALE')),
    CONSTRAINT chk_employee_status CHECK (status IN ('ACTIVE', 'TERMINATED'))
);

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES employees(id);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE REFERENCES employees(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    failed_login_count INTEGER DEFAULT 0,
    must_change_password BOOLEAN DEFAULT FALSE,
    password_changed_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_account_status CHECK (status IN ('ACTIVE', 'LOCKED', 'TERMINATED')),
    CONSTRAINT chk_account_type CHECK (account_type IN ('USER', 'SYSTEM'))
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
    CONSTRAINT chk_permission_code CHECK (code IN ('EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_EDIT', 'EMPLOYEE_DELETE')),
    CONSTRAINT chk_module_code CHECK (module_code IN ('EMPLOYEE'))
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
CREATE INDEX idx_accounts_employee_id ON accounts(employee_id);
CREATE INDEX idx_account_roles_account_id ON account_roles(account_id);
CREATE INDEX idx_account_roles_role_id ON account_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

INSERT INTO departments (code, name, status)
VALUES ('ADMIN', 'Administration', 'ACTIVE'), ('HR', 'Human Resources', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (name, code, status, description)
VALUES
    ('System Administrator', 'SYSTEM_ADMIN', 'ACTIVE', 'Full administration access'),
    ('HR Manager', 'HR_MANAGER', 'ACTIVE', 'Human resources management access'),
    ('HR Office', 'HR_OFFICE', 'ACTIVE', 'Human resources office access')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, name, description, module_code)
VALUES
    ('EMPLOYEE_VIEW', 'View employees', 'Read employee records', 'EMPLOYEE'),
    ('EMPLOYEE_CREATE', 'Create employees', 'Create employee records', 'EMPLOYEE'),
    ('EMPLOYEE_EDIT', 'Edit employees', 'Update employee records', 'EMPLOYEE'),
    ('EMPLOYEE_DELETE', 'Delete employees', 'Soft-delete employee records', 'EMPLOYEE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SYSTEM_ADMIN', 'HR_MANAGER')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'EMPLOYEE_VIEW'
WHERE r.code = 'HR_OFFICE'
ON CONFLICT (role_id, permission_id) DO NOTHING;
