INSERT INTO permissions (code, name, description, module_code)
VALUES
    ('ORDER_VIEW', '查看订单', '查看下单列表和订单详情', 'ORDER'),
    ('ORDER_CREATE', '新增订单', '创建下单记录', 'ORDER'),
    ('ORDER_EDIT', '编辑订单', '修改下单记录', 'ORDER'),
    ('ORDER_DELETE', '删除订单', '删除下单记录', 'ORDER')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (code, name, status, description)
VALUES ('ORDER_MANAGER', '订单管理员', 'ACTIVE', '负责订单的查看、新增、编辑和删除')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code IN ('SYSTEM_ADMIN', 'ORDER_MANAGER')
  AND permissions.code IN ('ORDER_VIEW', 'ORDER_CREATE', 'ORDER_EDIT', 'ORDER_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;
