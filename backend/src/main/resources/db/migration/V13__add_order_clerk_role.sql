INSERT INTO roles (code, name, status, description)
VALUES ('ORDER_CLERK', '订单文员', 'ACTIVE', '仅可查看订单列表和订单详情')
ON CONFLICT (code) DO NOTHING;

DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE code = 'ORDER_CLERK')
  AND permission_id NOT IN (SELECT id FROM permissions WHERE code = 'ORDER_VIEW');

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'ORDER_CLERK' AND permissions.code = 'ORDER_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;
