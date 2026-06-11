UPDATE employees employee
SET phone = '139' || LPAD(invalid_phone.row_no::TEXT, 8, '0')
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY employee_no, id) AS row_no
    FROM employees
    WHERE phone IS NULL
       OR phone !~ '^[0-9]{11}$'
) invalid_phone
WHERE employee.id = invalid_phone.id;

UPDATE emergency_contact contact
SET phone = employee.phone
FROM employees employee
WHERE contact.employee_id = employee.id
  AND (contact.phone IS NULL OR contact.phone !~ '^[0-9]{11}$');

UPDATE emergency_contact contact
SET phone = '13800000000'
WHERE contact.phone IS NULL
   OR contact.phone !~ '^[0-9]{11}$';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_employees_phone_11_digits'
          AND conrelid = 'employees'::regclass
    ) THEN
        ALTER TABLE employees
            ADD CONSTRAINT chk_employees_phone_11_digits
            CHECK (phone ~ '^[0-9]{11}$');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_emergency_contact_phone_11_digits'
          AND conrelid = 'emergency_contact'::regclass
    ) THEN
        ALTER TABLE emergency_contact
            ADD CONSTRAINT chk_emergency_contact_phone_11_digits
            CHECK (phone ~ '^[0-9]{11}$');
    END IF;
END $$;
