UPDATE roles AS target
SET description = translation.chinese
FROM (VALUES
    ('Full system administration access', '拥有全部系统管理权限'),
    ('Manage employees and accounts', '管理员工和账号'),
    ('Read employees and accounts', '查看员工和账号')
) AS translation(english, chinese)
WHERE target.description = translation.english;

UPDATE permissions AS target
SET description = translation.chinese
FROM (VALUES
    ('Read employee records', '查看员工记录'),
    ('Create employee records', '创建员工记录'),
    ('Update employee records', '更新员工记录'),
    ('Delete employee records', '删除员工记录'),
    ('Read account records', '查看账号记录'),
    ('Create account records', '创建账号记录'),
    ('Update account records', '更新账号记录'),
    ('Delete account records', '删除账号记录'),
    ('Read department records', '查看部门记录'),
    ('Create department records', '创建部门记录'),
    ('Update department records', '更新部门记录'),
    ('Delete department records', '删除部门记录')
) AS translation(english, chinese)
WHERE target.description = translation.english;
