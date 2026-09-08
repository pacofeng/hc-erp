ALTER TABLE accounts DROP CONSTRAINT chk_account_status;

UPDATE accounts
SET status = CASE status
    WHEN 'ACTIVE' THEN '启用'
    WHEN 'LOCKED' THEN '锁定'
    WHEN 'TERMINATED' THEN '停用'
    ELSE status END;

ALTER TABLE accounts
    ALTER COLUMN status SET DEFAULT '启用',
    ADD CONSTRAINT chk_account_status CHECK (status IN ('启用', '锁定', '停用'));
