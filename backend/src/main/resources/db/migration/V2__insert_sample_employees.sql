WITH hr_department AS (
    SELECT id
    FROM departments
    WHERE code = 'HR'
),
sample_employees AS (
    SELECT
        series.value AS row_no,
        CASE WHEN series.value <= 25 THEN NULL ELSE hr_department.id END AS department_id,
        (ARRAY[
            'Olivia Chen', 'Noah Wang', 'Emma Li', 'Liam Zhang', 'Ava Liu',
            'Mason Yang', 'Sophia Huang', 'Ethan Zhao', 'Mia Wu', 'Lucas Zhou',
            'Amelia Xu', 'Logan Sun', 'Harper Ma', 'James Zhu', 'Evelyn Hu',
            'Benjamin Guo', 'Abigail He', 'Henry Gao', 'Emily Lin', 'Alexander Luo',
            'Ella Zheng', 'Daniel Liang', 'Scarlett Xie', 'Michael Song', 'Grace Tang',
            'Chloe Pan', 'Jacob Cai', 'Victoria Fang', 'Samuel Deng', 'Lily Han',
            'David Qin', 'Nora Yu', 'Isaac Shen', 'Zoey Jiang', 'Owen Cheng',
            'Hannah Ye', 'Leo Fu', 'Stella Wei', 'Nathan Jin', 'Aurora Qian',
            'Ryan Lu', 'Bella Xiong', 'Caleb Shi', 'Lucy Ren', 'Dylan Tian',
            'Alice Cao', 'Aaron Fan', 'Ruby Yao', 'Julian Kong', 'Ivy Meng'
        ])[series.value] AS full_name,
        (ARRAY[
            'HR Specialist', 'Payroll Analyst', 'Recruiter', 'Benefits Coordinator', 'Training Coordinator',
            'Office Administrator', 'Operations Associate', 'Compliance Associate', 'People Operations Analyst',
            'Employee Relations Specialist'
        ])[((series.value - 1) % 10) + 1] AS job_title
    FROM generate_series(1, 50) AS series(value)
    CROSS JOIN hr_department
),
inserted_employees AS (
    INSERT INTO employees (
        employee_no,
        full_name,
        id_card_number,
        gender,
        date_of_birth,
        married_status,
        phone,
        department_id,
        manager_id,
        job_title,
        hire_date,
        termination_date,
        status
    )
    SELECT
        'EMP' || LPAD(row_no::TEXT, 5, '0'),
        full_name,
        '9' || LPAD(row_no::TEXT, 17, '0'),
        CASE WHEN row_no % 2 = 0 THEN 'FEMALE' ELSE 'MALE' END,
        (CURRENT_DATE - ((25 + (row_no % 20)) || ' years')::INTERVAL)::DATE,
        CASE WHEN row_no % 3 = 0 THEN 'MARRIED' ELSE 'SINGLE' END,
        '139000' || LPAD((10000 + row_no)::TEXT, 5, '0'),
        department_id,
        NULL,
        job_title,
        (CURRENT_DATE - ((30 + (row_no * 17)) || ' days')::INTERVAL)::DATE,
        NULL,
        'ACTIVE'
    FROM sample_employees
    RETURNING id, full_name, phone
)
INSERT INTO emergency_contact (employee_id, full_name, phone, relation)
SELECT id, full_name, phone, 'Emergency Contact'
FROM inserted_employees;
