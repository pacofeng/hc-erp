ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(18);

WITH numbered_employees AS (
    SELECT
        id,
        LPAD(ROW_NUMBER() OVER (ORDER BY employee_no, id)::TEXT, 18, '0') AS generated_id_card_number
    FROM employees
    WHERE id_card_number IS NULL
)
UPDATE employees e
SET id_card_number = n.generated_id_card_number
FROM numbered_employees n
WHERE e.id = n.id;

ALTER TABLE employees
    ALTER COLUMN id_card_number SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_employees_id_card_number'
    ) THEN
        ALTER TABLE employees
            ADD CONSTRAINT uq_employees_id_card_number UNIQUE (id_card_number);
    END IF;
END $$;
