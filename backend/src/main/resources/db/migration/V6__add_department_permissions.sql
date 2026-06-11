ALTER TABLE permissions
    DROP CONSTRAINT IF EXISTS chk_permission_code,
    DROP CONSTRAINT IF EXISTS chk_module_code;

ALTER TABLE permissions
    ADD CONSTRAINT chk_permission_code CHECK (code IN (
        'EMPLOYEE_VIEW',
        'EMPLOYEE_CREATE',
        'EMPLOYEE_EDIT',
        'EMPLOYEE_DELETE',
        'DEPARTMENT_VIEW',
        'DEPARTMENT_CREATE',
        'DEPARTMENT_EDIT',
        'DEPARTMENT_DELETE'
    )),
    ADD CONSTRAINT chk_module_code CHECK (module_code IN ('EMPLOYEE', 'DEPARTMENT'));

INSERT INTO permissions (code, name, description, module_code)
VALUES
    ('DEPARTMENT_VIEW', 'View departments', 'Read department records', 'DEPARTMENT'),
    ('DEPARTMENT_CREATE', 'Create departments', 'Create department records', 'DEPARTMENT'),
    ('DEPARTMENT_EDIT', 'Edit departments', 'Update department records', 'DEPARTMENT'),
    ('DEPARTMENT_DELETE', 'Delete departments', 'Delete department records', 'DEPARTMENT')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.code IN ('SYSTEM_ADMIN', 'HR_MANAGER')
  AND permission.code IN ('DEPARTMENT_VIEW', 'DEPARTMENT_CREATE', 'DEPARTMENT_EDIT', 'DEPARTMENT_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
JOIN permissions permission ON permission.code = 'DEPARTMENT_VIEW'
WHERE role.code = 'HR_OFFICE'
ON CONFLICT (role_id, permission_id) DO NOTHING;
