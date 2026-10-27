INSERT INTO departments (name, description, status)
SELECT '其它', '未匹配的部门', '启用'
WHERE NOT EXISTS (
    SELECT 1 FROM departments WHERE name = '其它'
);

INSERT INTO positions (name, description, status)
SELECT '其它', '未匹配的职位', '启用'
WHERE NOT EXISTS (
    SELECT 1 FROM positions WHERE name = '其它'
);
