DO $$
DECLARE
    has_legacy_name_columns BOOLEAN;
BEGIN
    IF EXISTS (
        SELECT 1
        FROM employees
        WHERE phone LIKE '13900010___'
    ) THEN
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'employees'
          AND column_name = 'first_name'
    ) INTO has_legacy_name_columns;

    IF has_legacy_name_columns THEN
        EXECUTE $sql$
            WITH hr_department AS (
                SELECT id
                FROM departments
                WHERE code = 'HR'
            ),
            max_employee_no AS (
                SELECT COALESCE(MAX(substring(employee_no FROM '([0-9]+)$')::INTEGER), 0) AS value
                FROM employees
                WHERE employee_no ~ '[0-9]+$'
            ),
            sample_employees AS (
                SELECT
                    series.value AS row_no,
                    max_employee_no.value + series.value AS employee_no_value,
                    (ARRAY[
                        'Olivia', 'Noah', 'Emma', 'Liam', 'Ava', 'Mason', 'Sophia', 'Ethan', 'Mia', 'Lucas',
                        'Amelia', 'Logan', 'Harper', 'James', 'Evelyn', 'Benjamin', 'Abigail', 'Henry',
                        'Emily', 'Alexander', 'Ella', 'Daniel', 'Scarlett', 'Michael', 'Grace'
                    ])[((series.value - 1) % 25) + 1] AS first_name,
                    (ARRAY[
                        'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
                        'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Gao', 'Lin', 'Luo',
                        'Zheng', 'Liang', 'Xie', 'Song', 'Tang'
                    ])[((series.value - 1) % 25) + 1] AS last_name,
                    (ARRAY[
                        'HR Specialist', 'Payroll Analyst', 'Recruiter', 'Benefits Coordinator', 'Training Coordinator',
                        'Office Administrator', 'Operations Associate', 'Compliance Associate', 'People Operations Analyst',
                        'Employee Relations Specialist'
                    ])[((series.value - 1) % 10) + 1] AS job_title,
                    CASE WHEN series.value % 2 = 0 THEN 'FEMALE' ELSE 'MALE' END AS gender,
                    CASE WHEN series.value <= 25 THEN NULL ELSE hr_department.id END AS department_id,
                    (CURRENT_DATE - ((30 + (series.value * 17)) || ' days')::INTERVAL)::DATE AS hire_date
                FROM generate_series(1, 50) AS series(value)
                CROSS JOIN max_employee_no
                CROSS JOIN hr_department
            )
            INSERT INTO employees (
                employee_no,
                first_name,
                last_name,
                gender,
                display_name,
                phone,
                department_id,
                manager_id,
                job_title,
                hire_date,
                termination_date,
                status
            )
            SELECT
                'EMP' || LPAD(employee_no_value::TEXT, 5, '0'),
                first_name,
                last_name,
                gender,
                first_name || ' ' || last_name,
                '139000' || LPAD((10000 + row_no)::TEXT, 5, '0'),
                department_id,
                NULL,
                job_title,
                hire_date,
                NULL,
                'ACTIVE'
            FROM sample_employees
            ON CONFLICT (employee_no) DO NOTHING
        $sql$;
    ELSE
        EXECUTE $sql$
            WITH hr_department AS (
                SELECT id
                FROM departments
                WHERE code = 'HR'
            ),
            max_employee_no AS (
                SELECT COALESCE(MAX(substring(employee_no FROM '([0-9]+)$')::INTEGER), 0) AS value
                FROM employees
                WHERE employee_no ~ '[0-9]+$'
            ),
            sample_employees AS (
                SELECT
                    series.value AS row_no,
                    max_employee_no.value + series.value AS employee_no_value,
                    (ARRAY[
                        'Olivia', 'Noah', 'Emma', 'Liam', 'Ava', 'Mason', 'Sophia', 'Ethan', 'Mia', 'Lucas',
                        'Amelia', 'Logan', 'Harper', 'James', 'Evelyn', 'Benjamin', 'Abigail', 'Henry',
                        'Emily', 'Alexander', 'Ella', 'Daniel', 'Scarlett', 'Michael', 'Grace'
                    ])[((series.value - 1) % 25) + 1] AS first_name,
                    (ARRAY[
                        'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
                        'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Gao', 'Lin', 'Luo',
                        'Zheng', 'Liang', 'Xie', 'Song', 'Tang'
                    ])[((series.value - 1) % 25) + 1] AS last_name,
                    (ARRAY[
                        'HR Specialist', 'Payroll Analyst', 'Recruiter', 'Benefits Coordinator', 'Training Coordinator',
                        'Office Administrator', 'Operations Associate', 'Compliance Associate', 'People Operations Analyst',
                        'Employee Relations Specialist'
                    ])[((series.value - 1) % 10) + 1] AS job_title,
                    CASE WHEN series.value % 2 = 0 THEN 'FEMALE' ELSE 'MALE' END AS gender,
                    (CURRENT_DATE - ((25 + (series.value % 20)) || ' years')::INTERVAL)::DATE AS date_of_birth,
                    CASE WHEN series.value % 3 = 0 THEN 'MARRIED' ELSE 'SINGLE' END AS married_status,
                    (100 + series.value)::TEXT || ' Sample Street, Springfield' AS address,
                    CASE WHEN series.value <= 25 THEN NULL ELSE hr_department.id END AS department_id,
                    (CURRENT_DATE - ((30 + (series.value * 17)) || ' days')::INTERVAL)::DATE AS hire_date
                FROM generate_series(1, 50) AS series(value)
                CROSS JOIN max_employee_no
                CROSS JOIN hr_department
            )
            INSERT INTO employees (
                employee_no,
                full_name,
                gender,
                date_of_birth,
                married_status,
                address,
                phone,
                department_id,
                manager_id,
                job_title,
                hire_date,
                termination_date,
                status
            )
            SELECT
                'EMP' || LPAD(employee_no_value::TEXT, 5, '0'),
                first_name || ' ' || last_name,
                gender,
                date_of_birth,
                married_status,
                address,
                '139000' || LPAD((10000 + row_no)::TEXT, 5, '0'),
                department_id,
                NULL,
                job_title,
                hire_date,
                NULL,
                'ACTIVE'
            FROM sample_employees
            ON CONFLICT (employee_no) DO NOTHING
        $sql$;
    END IF;
END $$;
