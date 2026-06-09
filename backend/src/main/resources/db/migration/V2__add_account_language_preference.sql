ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) NOT NULL DEFAULT 'zh-CN';

UPDATE accounts
SET preferred_language = 'zh-CN'
WHERE preferred_language IS NULL OR preferred_language NOT IN ('en', 'zh-CN');

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'accounts'::regclass
            AND conname = 'chk_accounts_preferred_language'
    ) THEN
        ALTER TABLE accounts
            ADD CONSTRAINT chk_accounts_preferred_language CHECK (preferred_language IN ('en', 'zh-CN'));
    END IF;
END $$;
