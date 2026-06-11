ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS married_status VARCHAR(50) NOT NULL DEFAULT 'SINGLE',
    ADD COLUMN IF NOT EXISTS address TEXT;

DO $$
DECLARE
    has_first_name BOOLEAN;
    has_last_name BOOLEAN;
    has_display_name BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'employees'
          AND column_name = 'first_name'
    ) INTO has_first_name;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'employees'
          AND column_name = 'last_name'
    ) INTO has_last_name;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'employees'
          AND column_name = 'display_name'
    ) INTO has_display_name;

    IF has_display_name THEN
        EXECUTE 'UPDATE employees SET full_name = NULLIF(TRIM(display_name), '''') WHERE full_name IS NULL';
    END IF;

    IF has_first_name AND has_last_name THEN
        EXECUTE 'UPDATE employees SET full_name = NULLIF(TRIM(CONCAT_WS('' '', first_name, last_name)), '''') WHERE full_name IS NULL';
    END IF;
END $$;

UPDATE employees
SET full_name = employee_no
WHERE full_name IS NULL;

UPDATE employees
SET date_of_birth = DATE '1970-01-01'
WHERE date_of_birth IS NULL;

UPDATE employees
SET phone = '13800000000'
WHERE phone IS NULL;

UPDATE employees
SET phone = '13800000000'
WHERE phone = 'Unknown';

UPDATE employees
SET address = NULL
WHERE address = 'Unknown';

ALTER TABLE employees
    ALTER COLUMN full_name SET NOT NULL,
    ALTER COLUMN date_of_birth SET NOT NULL,
    ALTER COLUMN phone SET NOT NULL,
    ALTER COLUMN address DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_employee_married_status'
          AND conrelid = 'employees'::regclass
    ) THEN
        ALTER TABLE employees
            ADD CONSTRAINT chk_employee_married_status
            CHECK (married_status IN ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'));
    END IF;
END $$;

ALTER TABLE employees
    DROP COLUMN IF EXISTS display_name,
    DROP COLUMN IF EXISTS first_name,
    DROP COLUMN IF EXISTS last_name;

CREATE TABLE IF NOT EXISTS emergency_contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    full_name VARCHAR(200),
    phone VARCHAR(50),
    relation VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'emergency_contact'
          AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'emergency_contact'
          AND column_name = 'full_name'
    ) THEN
        ALTER TABLE emergency_contact RENAME COLUMN name TO full_name;
    END IF;
END $$;

ALTER TABLE emergency_contact
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);

ALTER TABLE emergency_contact
    ALTER COLUMN full_name DROP NOT NULL,
    ALTER COLUMN phone DROP NOT NULL,
    ALTER COLUMN relation DROP NOT NULL;

UPDATE emergency_contact
SET full_name = NULL
WHERE full_name = 'Unknown';

UPDATE emergency_contact
SET phone = NULL
WHERE phone = 'Unknown';

UPDATE emergency_contact
SET relation = NULL
WHERE relation = 'Unknown';

ALTER TABLE emergency_contact
    DROP COLUMN IF EXISTS address;

DELETE FROM emergency_contact
WHERE full_name IS NULL
  AND phone IS NULL
  AND relation IS NULL;

INSERT INTO emergency_contact (employee_id, full_name, phone, relation)
SELECT employee.id, employee.full_name, employee.phone, 'Emergency Contact'
FROM employees employee
WHERE NOT EXISTS (
    SELECT 1
    FROM emergency_contact contact
    WHERE contact.employee_id = employee.id
);

UPDATE emergency_contact contact
SET full_name = employee.full_name
FROM employees employee
WHERE contact.employee_id = employee.id
  AND contact.full_name IS NULL;

UPDATE emergency_contact contact
SET phone = employee.phone
FROM employees employee
WHERE contact.employee_id = employee.id
  AND contact.phone IS NULL;

UPDATE emergency_contact
SET relation = 'Emergency Contact'
WHERE relation IS NULL;

ALTER TABLE emergency_contact
    ALTER COLUMN full_name SET NOT NULL,
    ALTER COLUMN phone SET NOT NULL,
    ALTER COLUMN relation SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_emergency_contact_employee_id ON emergency_contact(employee_id);
