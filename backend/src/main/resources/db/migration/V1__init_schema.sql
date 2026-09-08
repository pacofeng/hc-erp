CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    chinese_name VARCHAR(100) NOT NULL,
    manager_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_department_code CHECK (code ~ '^[A-Z_]+$'),
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
    job_title VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
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
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    account_type VARCHAR(50) NOT NULL DEFAULT 'USER',
    failed_login_count INTEGER DEFAULT 0,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
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
    chinese_name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_role_code CHECK (code ~ '^[A-Z_]+$'),
    CONSTRAINT chk_role_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    chinese_name VARCHAR(100) NOT NULL,
    description TEXT,
    module_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_permission_code CHECK (code ~ '^[A-Z_]+$'),
    CONSTRAINT chk_module_code CHECK (module_code IN ('EMPLOYEE', 'ACCOUNT', 'DEPARTMENT'))
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

INSERT INTO departments (code, name, chinese_name, status)
VALUES
    ('SYS', 'System', '系统管理员', 'ACTIVE'),
    ('MGMT', 'Management', '管理层', 'ACTIVE'),
    ('FIN', 'Finance', '财务', 'ACTIVE'),
    ('PROC', 'Procurement', '采购', 'ACTIVE'),
    ('DS', 'Domestic Sales', '国内业务', 'ACTIVE'),
    ('IS', 'International Sales', '外贸业务', 'ACTIVE'),
    ('ADMIN', 'Administration', '行政', 'ACTIVE'),
    ('AFTER', 'After-Sales', '售后', 'ACTIVE'),
    ('RES', 'Research', '研发', 'ACTIVE'),
    ('MECH', 'Mechanical Processing', '机械加工', 'ACTIVE'),
    ('FIT', 'Fitter Workshop', '钳工房', 'ACTIVE'),
    ('QASM', 'Quilting Machine Assembly', '一楼装配', 'ACTIVE'),
    ('CASM', 'Cutting Machine Assembly', '二楼装配', 'ACTIVE'),
    ('PAINT', 'Painting', '油漆', 'ACTIVE'),
    ('ELEC', 'Electrical', '电工', 'ACTIVE'),
    ('WH', 'Warehouse', '仓库', 'ACTIVE'),
    ('LOG', 'Logistics', '后勤', 'ACTIVE');

INSERT INTO roles (name, chinese_name, code, status, description)
VALUES
    ('System Administrator', '系统管理员', 'SYSTEM_ADMIN', 'ACTIVE', 'Full system administration access'),
    ('Admin Manager', '管理员', 'ADMIN_MANAGER', 'ACTIVE', 'Manage employees and accounts'),
    ('Admin Clerk', '行政文员', 'ADMIN_CLERK', 'ACTIVE', 'Read employees and accounts');

INSERT INTO permissions (code, name, chinese_name, description, module_code)
VALUES
    ('EMPLOYEE_VIEW', 'View employees', '查看员工', 'Read employee records', 'EMPLOYEE'),
    ('EMPLOYEE_CREATE', 'Create employees', '创建员工', 'Create employee records', 'EMPLOYEE'),
    ('EMPLOYEE_EDIT', 'Edit employees', '编辑员工', 'Update employee records', 'EMPLOYEE'),
    ('EMPLOYEE_DELETE', 'Delete employees', '删除员工', 'Delete employee records', 'EMPLOYEE'),
    ('ACCOUNT_VIEW', 'View accounts', '查看账号', 'Read account records', 'ACCOUNT'),
    ('ACCOUNT_CREATE', 'Create accounts', '创建账号', 'Create account records', 'ACCOUNT'),
    ('ACCOUNT_EDIT', 'Edit accounts', '编辑账号', 'Update account records', 'ACCOUNT'),
    ('ACCOUNT_DELETE', 'Delete accounts', '删除账号', 'Delete account records', 'ACCOUNT'),
    ('DEPARTMENT_VIEW', 'View departments', '查看部门', 'Read department records', 'DEPARTMENT'),
    ('DEPARTMENT_CREATE', 'Create departments', '创建部门', 'Create department records', 'DEPARTMENT'),
    ('DEPARTMENT_EDIT', 'Edit departments', '编辑部门', 'Update department records', 'DEPARTMENT'),
    ('DEPARTMENT_DELETE', 'Delete departments', '删除部门', 'Delete department records', 'DEPARTMENT');

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.code = 'SYSTEM_ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.code = 'ADMIN_MANAGER'
  AND permission.code IN (
      'EMPLOYEE_VIEW',
      'EMPLOYEE_CREATE',
      'EMPLOYEE_EDIT',
      'EMPLOYEE_DELETE',
      'ACCOUNT_VIEW',
      'ACCOUNT_CREATE',
      'ACCOUNT_EDIT',
      'ACCOUNT_DELETE'
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.code = 'ADMIN_CLERK'
  AND permission.code IN (
      'EMPLOYEE_VIEW',
      'ACCOUNT_VIEW'
  );

WITH admin_department AS (
    SELECT id
    FROM departments
    WHERE code = 'ADMIN'
),
sample_employees AS (
    SELECT
        series.value AS row_no,
        CASE WHEN series.value <= 25 THEN NULL ELSE admin_department.id END AS department_id,
        (ARRAY[
            'Olivia Chen', 'Noah Wang', 'Emma Li', 'Liam Zhang', 'Ava Liu',
            'Mason Yang', 'Sophia Huang', 'Ethan Zhao', 'Mia Wu', 'Lucas Zhou',
            'Amelia Xu', 'Logan Sun', 'Harper Ma', 'James Zhu', 'Evelyn Hu',
            'Benjamin Guo', 'Abigail He', 'Henry Gao', 'Emily Lin', 'Alexander Luo',
            'Ella Zheng', 'Daniel Liang', 'Scarlett Xie', 'Michael Song', 'Grace Tang',
            'Chloe Pan', 'Jacob Cai', 'Victoria Fang', 'Samuel Deng', 'Lily Han',
            'David Qin', 'Nora Yu', 'Isaac Shen', 'Zoey Jiang', 'Owen Cheng',
            'Hannah Ye', 'Leo Fu', 'Stella Wei', 'Nathan Jin', 'Aurora Qian',
            'Ryan Lu', 'Bella Xiong', 'Caleb Shi', 'Lucy Ren', 'Dylan Tian',
            'Alice Cao', 'Aaron Fan', 'Ruby Yao', 'Julian Kong', 'Ivy Meng'
        ])[series.value] AS full_name,
        (ARRAY[
            'HR Specialist', 'Payroll Analyst', 'Recruiter', 'Benefits Coordinator', 'Training Coordinator',
            'Office Administrator', 'Operations Associate', 'Compliance Associate', 'People Operations Analyst',
            'Employee Relations Specialist'
        ])[((series.value - 1) % 10) + 1] AS job_title
    FROM generate_series(1, 50) AS series(value)
    CROSS JOIN admin_department
),
inserted_employees AS (
    INSERT INTO employees (
        employee_no,
        full_name,
        id_card_number,
        gender,
        date_of_birth,
        married_status,
        phone,
        department_id,
        manager_id,
        job_title,
        hire_date,
        termination_date,
        status
    )
    SELECT
        'EMP' || LPAD(row_no::TEXT, 5, '0'),
        full_name,
        '9' || LPAD(row_no::TEXT, 17, '0'),
        CASE WHEN row_no % 2 = 0 THEN 'FEMALE' ELSE 'MALE' END,
        (CURRENT_DATE - ((25 + (row_no % 20)) || ' years')::INTERVAL)::DATE,
        CASE WHEN row_no % 3 = 0 THEN 'MARRIED' ELSE 'SINGLE' END,
        '139000' || LPAD((10000 + row_no)::TEXT, 5, '0'),
        department_id,
        NULL,
        job_title,
        (CURRENT_DATE - ((30 + (row_no * 17)) || ' days')::INTERVAL)::DATE,
        NULL,
        'ACTIVE'
    FROM sample_employees
    RETURNING id, full_name, phone
)
INSERT INTO emergency_contact (employee_id, full_name, phone, relation)
SELECT id, full_name, phone, 'Emergency Contact'
FROM inserted_employees;
