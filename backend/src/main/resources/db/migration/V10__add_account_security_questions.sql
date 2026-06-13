ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS security_questions_configured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS security_question_1 TEXT,
    ADD COLUMN IF NOT EXISTS security_answer_hash_1 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS security_question_2 TEXT,
    ADD COLUMN IF NOT EXISTS security_answer_hash_2 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS security_question_3 TEXT,
    ADD COLUMN IF NOT EXISTS security_answer_hash_3 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_version INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS password_reset_token_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_reset_token_expires_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_security_questions_complete'
    ) THEN
        ALTER TABLE accounts
            ADD CONSTRAINT chk_security_questions_complete CHECK (
                security_questions_configured = FALSE
                OR (
                    security_question_1 IS NOT NULL
                    AND security_answer_hash_1 IS NOT NULL
                    AND security_question_2 IS NOT NULL
                    AND security_answer_hash_2 IS NOT NULL
                    AND security_question_3 IS NOT NULL
                    AND security_answer_hash_3 IS NOT NULL
                )
            );
    END IF;
END $$;
