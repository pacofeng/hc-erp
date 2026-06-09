DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'accounts'
            AND column_name = 'deleted_at'
    ) THEN
        UPDATE account_roles
        SET created_by = NULL
        WHERE created_by IN (
            SELECT id
            FROM accounts
            WHERE deleted_at IS NOT NULL
        );

        UPDATE role_permissions
        SET created_by = NULL
        WHERE created_by IN (
            SELECT id
            FROM accounts
            WHERE deleted_at IS NOT NULL
        );

        DELETE FROM accounts
        WHERE deleted_at IS NOT NULL;

        ALTER TABLE accounts
        DROP COLUMN deleted_at;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'employees'
            AND column_name = 'deleted_at'
    ) THEN
        UPDATE account_roles
        SET created_by = NULL
        WHERE created_by IN (
            SELECT a.id
            FROM accounts a
            JOIN employees e ON e.id = a.employee_id
            WHERE e.deleted_at IS NOT NULL
        );

        UPDATE role_permissions
        SET created_by = NULL
        WHERE created_by IN (
            SELECT a.id
            FROM accounts a
            JOIN employees e ON e.id = a.employee_id
            WHERE e.deleted_at IS NOT NULL
        );

        DELETE FROM accounts
        WHERE employee_id IN (
            SELECT id
            FROM employees
            WHERE deleted_at IS NOT NULL
        );

        UPDATE departments
        SET manager_id = NULL
        WHERE manager_id IN (
            SELECT id
            FROM employees
            WHERE deleted_at IS NOT NULL
        );

        UPDATE employees
        SET manager_id = NULL
        WHERE manager_id IN (
            SELECT id
            FROM employees
            WHERE deleted_at IS NOT NULL
        );

        DELETE FROM employees
        WHERE deleted_at IS NOT NULL;

        ALTER TABLE employees
        DROP COLUMN deleted_at;
    END IF;
END $$;
