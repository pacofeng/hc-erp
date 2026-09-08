ALTER TABLE departments DROP CONSTRAINT chk_department_status;

UPDATE departments
SET status = CASE status
    WHEN 'ACTIVE' THEN '启用'
    WHEN 'INACTIVE' THEN '停用'
    ELSE status END;

ALTER TABLE departments
    ALTER COLUMN status SET DEFAULT '启用',
    ADD CONSTRAINT chk_department_status CHECK (status IN ('启用', '停用'));
