ALTER TABLE accounts
    ALTER COLUMN username DROP NOT NULL,
    ALTER COLUMN password_hash DROP NOT NULL,
    ADD COLUMN activation_token_hash VARCHAR(64),
    ADD COLUMN activation_expires_at TIMESTAMPTZ,
    ADD COLUMN activated_at TIMESTAMPTZ;

ALTER TABLE accounts DROP CONSTRAINT chk_account_status;

ALTER TABLE accounts
    ADD CONSTRAINT chk_account_status
        CHECK (status IN ('启用', '锁定', '停用', '待激活'));

CREATE UNIQUE INDEX uq_accounts_activation_token_hash
    ON accounts (activation_token_hash)
    WHERE activation_token_hash IS NOT NULL;
