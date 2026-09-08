ALTER TABLE employees
    DROP CONSTRAINT chk_employee_gender,
    DROP CONSTRAINT chk_employee_married_status,
    DROP CONSTRAINT chk_employee_status;

UPDATE employees
SET gender = CASE gender WHEN 'MALE' THEN '男' WHEN 'FEMALE' THEN '女' ELSE gender END,
    married_status = CASE married_status
        WHEN 'SINGLE' THEN '未婚'
        WHEN 'MARRIED' THEN '已婚'
        WHEN 'DIVORCED' THEN '离异'
        WHEN 'WIDOWED' THEN '丧偶'
        ELSE married_status END,
    status = CASE status WHEN 'ACTIVE' THEN '在职' WHEN 'TERMINATED' THEN '离职' ELSE status END;

ALTER TABLE employees
    ALTER COLUMN married_status SET DEFAULT '未婚',
    ALTER COLUMN status SET DEFAULT '在职',
    ADD CONSTRAINT chk_employee_gender CHECK (gender IN ('男', '女')),
    ADD CONSTRAINT chk_employee_married_status CHECK (married_status IN ('未婚', '已婚', '离异', '丧偶')),
    ADD CONSTRAINT chk_employee_status CHECK (status IN ('在职', '离职'));

UPDATE employees AS employee
SET job_title = translation.chinese
FROM (VALUES
    ('HR Specialist', '人力资源专员'),
    ('Payroll Analyst', '薪酬分析员'),
    ('Recruiter', '招聘专员'),
    ('Benefits Coordinator', '福利协调员'),
    ('Training Coordinator', '培训协调员'),
    ('Office Administrator', '办公室行政专员'),
    ('Operations Associate', '运营专员'),
    ('Compliance Associate', '合规专员'),
    ('People Operations Analyst', '人力资源运营分析员'),
    ('Employee Relations Specialist', '员工关系专员'),
    ('System Administrator', '系统管理员')
) AS translation(english, chinese)
WHERE employee.job_title = translation.english;
