UPDATE accounts
SET preferred_language = 'zh-CN'
WHERE preferred_language IS DISTINCT FROM 'zh-CN';

ALTER TABLE accounts
    ALTER COLUMN preferred_language SET DEFAULT 'zh-CN';

ALTER TABLE accounts
    DROP CONSTRAINT IF EXISTS chk_accounts_preferred_language;

ALTER TABLE accounts
    ADD CONSTRAINT chk_accounts_preferred_language CHECK (preferred_language = 'zh-CN');
