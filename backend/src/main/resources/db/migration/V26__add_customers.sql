CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    country VARCHAR(100),
    source VARCHAR(100),
    contact_name VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(254),
    website VARCHAR(500),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_customers_phone_11_digits CHECK (phone IS NULL OR phone ~ '^[0-9]{11}$')
);

CREATE INDEX idx_customers_company_name ON customers(company_name);

ALTER TABLE permissions DROP CONSTRAINT chk_module_code;
ALTER TABLE permissions ADD CONSTRAINT chk_module_code
    CHECK (module_code IN ('EMPLOYEE', 'ACCOUNT', 'DEPARTMENT', 'ORDER', 'CUSTOMER'));

INSERT INTO permissions (code, name, description, module_code)
VALUES
    ('CUSTOMER_VIEW', '查看客户', '查看客户资料和客户详情', 'CUSTOMER'),
    ('CUSTOMER_CREATE', '创建客户', '创建客户资料', 'CUSTOMER'),
    ('CUSTOMER_EDIT', '编辑客户', '编辑客户资料', 'CUSTOMER'),
    ('CUSTOMER_DELETE', '删除客户', '删除客户资料', 'CUSTOMER')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    module_code = EXCLUDED.module_code;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'SYSTEM_ADMIN'
  AND permissions.module_code = 'CUSTOMER'
ON CONFLICT (role_id, permission_id) DO NOTHING;
