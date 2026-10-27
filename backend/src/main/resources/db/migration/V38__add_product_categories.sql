CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT '启用',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_product_categories_status CHECK (status IN ('启用', '停用'))
);

INSERT INTO product_categories (name, description, status)
VALUES
    ('无梭机', '无梭绗缝设备', '启用'),
    ('单针机', '单针绗缝设备', '启用'),
    ('有梭机', '有梭绗缝设备', '启用'),
    ('裁剪机', '裁剪设备', '启用'),
    ('堆叠机', '堆叠设备', '启用'),
    ('小机器', '辅助及小型设备', '启用'),
    ('材料', '生产用材料', '启用');
