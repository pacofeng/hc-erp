CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT '启用',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_products_status CHECK (status IN ('启用', '停用'))
);

CREATE INDEX idx_products_name ON products(name);

ALTER TABLE permissions DROP CONSTRAINT chk_module_code;
ALTER TABLE permissions ADD CONSTRAINT chk_module_code
    CHECK (module_code IN ('EMPLOYEE', 'ACCOUNT', 'DEPARTMENT', 'ORDER', 'CUSTOMER', 'PRODUCT'));

INSERT INTO permissions (code, name, description, module_code)
VALUES
    ('PRODUCT_VIEW', '查看产品', '查看产品资料和产品详情', 'PRODUCT'),
    ('PRODUCT_CREATE', '创建产品', '创建产品资料', 'PRODUCT'),
    ('PRODUCT_EDIT', '编辑产品', '编辑产品资料', 'PRODUCT'),
    ('PRODUCT_DELETE', '删除产品', '删除产品资料', 'PRODUCT')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    module_code = EXCLUDED.module_code;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'SYSTEM_ADMIN'
  AND permissions.module_code = 'PRODUCT'
ON CONFLICT (role_id, permission_id) DO NOTHING;
