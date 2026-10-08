WITH selectable_departments AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY RANDOM()) AS position
    FROM departments
    WHERE status = '启用' AND code <> 'SYS'
),
unassigned_employees AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY RANDOM()) AS position
    FROM employees
    WHERE department_id IS NULL
),
department_count AS (
    SELECT COUNT(*) AS total FROM selectable_departments
)
UPDATE employees AS employee
SET department_id = department.id,
    updated_at = NOW()
FROM unassigned_employees AS unassigned
JOIN department_count AS counts ON counts.total > 0
JOIN selectable_departments AS department
    ON department.position = ((unassigned.position - 1) % counts.total) + 1
WHERE employee.id = unassigned.id;
