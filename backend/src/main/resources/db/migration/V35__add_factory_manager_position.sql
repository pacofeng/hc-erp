INSERT INTO positions (code, name, status)
VALUES ('FACTORY_MANAGER', '厂长', '启用')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = NOW();
