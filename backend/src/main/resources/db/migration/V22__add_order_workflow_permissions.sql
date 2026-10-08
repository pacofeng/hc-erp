ALTER TABLE orders DROP CONSTRAINT chk_orders_status;

UPDATE orders
SET status = CASE status
    WHEN '进行中' THEN '生产中'
    WHEN '已完成' THEN '完成'
    WHEN '已取消' THEN '草稿'
    ELSE status
END;

ALTER TABLE orders
    ADD CONSTRAINT chk_orders_status CHECK (
        status IN ('草稿', '待审核', '生产中', '生产中（延误）', '待出货', '已结清', '已发货', '完成')
    );

DELETE FROM role_permissions
WHERE permission_id = (SELECT id FROM permissions WHERE code = 'ORDER_EDIT');

DELETE FROM permissions WHERE code = 'ORDER_EDIT';

INSERT INTO permissions (code, name, description, module_code)
VALUES
    ('ORDER_REVIEW', '审核订单', '将订单提交或处理至待审核状态', 'ORDER'),
    ('ORDER_PRODUCTION', '生产订单', '更新生产中或生产中（延误）状态', 'ORDER'),
    ('ORDER_SHIPPING', '出货订单', '更新待出货或已发货状态', 'ORDER'),
    ('ORDER_SETTLE', '结清订单', '更新订单为已结清状态', 'ORDER'),
    ('ORDER_COMPLETE', '完成订单', '更新订单为完成状态', 'ORDER')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    module_code = EXCLUDED.module_code;

INSERT INTO roles (code, name, status, description)
VALUES ('ORDER_PROCESSOR', '订单处理员', 'ACTIVE', '审核、生产、出货、发货和完成订单')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

UPDATE roles
SET name = CASE code
        WHEN 'ORDER_MANAGER' THEN '订单管理员'
        WHEN 'ORDER_CLERK' THEN '订单文员'
        ELSE name
    END,
    description = CASE code
        WHEN 'ORDER_MANAGER' THEN '管理订单全流程'
        WHEN 'ORDER_CLERK' THEN '查看订单'
        ELSE description
    END
WHERE code IN ('ORDER_MANAGER', 'ORDER_CLERK');

DELETE FROM role_permissions
WHERE role_id IN (
    SELECT id FROM roles WHERE code IN ('SYSTEM_ADMIN', 'ORDER_MANAGER', 'ORDER_CLERK', 'ORDER_PROCESSOR')
)
AND permission_id IN (SELECT id FROM permissions WHERE module_code = 'ORDER');

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code IN ('SYSTEM_ADMIN', 'ORDER_MANAGER')
  AND permissions.code IN (
      'ORDER_VIEW', 'ORDER_CREATE', 'ORDER_REVIEW', 'ORDER_PRODUCTION',
      'ORDER_SHIPPING', 'ORDER_SETTLE', 'ORDER_COMPLETE', 'ORDER_DELETE'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'ORDER_CLERK'
  AND permissions.code = 'ORDER_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.code = 'ORDER_PROCESSOR'
  AND permissions.code IN (
      'ORDER_VIEW', 'ORDER_REVIEW', 'ORDER_PRODUCTION', 'ORDER_SHIPPING', 'ORDER_COMPLETE'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
