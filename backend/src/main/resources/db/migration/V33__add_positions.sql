CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT '启用',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_position_code CHECK (code ~ '^[A-Z_]+$'),
    CONSTRAINT chk_position_status CHECK (status IN ('启用', '停用'))
);

ALTER TABLE permissions DROP CONSTRAINT chk_module_code;
ALTER TABLE permissions ADD CONSTRAINT chk_module_code
    CHECK (module_code IN ('EMPLOYEE', 'ACCOUNT', 'DEPARTMENT', 'POSITION', 'ORDER', 'CUSTOMER', 'PRODUCT'));

INSERT INTO permissions (code, name, description, module_code)
VALUES
    ('POSITION_VIEW', '查看职位', '查看职位资料和职位详情', 'POSITION'),
    ('POSITION_CREATE', '创建职位', '创建职位资料', 'POSITION'),
    ('POSITION_EDIT', '编辑职位', '编辑职位资料', 'POSITION'),
    ('POSITION_DELETE', '删除职位', '删除职位资料', 'POSITION')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    module_code = EXCLUDED.module_code;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'SYSTEM_ADMIN'
  AND permissions.module_code = 'POSITION'
ON CONFLICT (role_id, permission_id) DO NOTHING;
