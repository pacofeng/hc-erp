CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(200) NOT NULL,
    contract_number VARCHAR(100) NOT NULL,
    machine_models VARCHAR(2000) NOT NULL,
    machine_configuration VARCHAR(4000),
    voltage VARCHAR(100),
    xy_motor VARCHAR(50) CHECK (xy_motor IN ('汇川', '松下')),
    z_motor VARCHAR(50) CHECK (z_motor IN ('汇川', '安川')),
    packaging VARCHAR(50) CHECK (packaging IN ('薄膜', '木托', '木箱', '其他')),
    nameplate VARCHAR(50) CHECK (nameplate IN ('恒昌铭牌', '客户铭牌')),
    system_heading VARCHAR(50) CHECK (system_heading IN ('恒昌', '客户')),
    system_language VARCHAR(50) CHECK (system_language IN ('中文', '英文', '其他')),
    delivery_method VARCHAR(100) CHECK (delivery_method IN ('客户安排货柜', '我司安排货柜', '我司安排车')),
    customized BOOLEAN,
    custom_requirements VARCHAR(4000),
    equipment VARCHAR(50) CHECK (equipment IN ('无', '卷布机', '稳压机', '空压机', '减震器', '编带', '其他')),
    photo_before_packing BOOLEAN,
    beam_style VARCHAR(50) CHECK (beam_style IN ('3300款', '2500款')),
    manual_language VARCHAR(50) CHECK (manual_language IN ('中文', '英文', '中英文', '其他')),
    remarks VARCHAR(4000),
    expected_date DATE,
    completed_date DATE,
    prepared_by VARCHAR(100) NOT NULL,
    reviewed_by VARCHAR(100),
    order_date DATE NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_order_custom_requirements CHECK (
        customized IS NOT TRUE OR NULLIF(BTRIM(custom_requirements), '') IS NOT NULL
    )
);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX idx_orders_contract_number ON orders(contract_number);

ALTER TABLE permissions DROP CONSTRAINT chk_module_code;
ALTER TABLE permissions ADD CONSTRAINT chk_module_code
    CHECK (module_code IN ('EMPLOYEE', 'ACCOUNT', 'DEPARTMENT', 'ORDER'));

INSERT INTO permissions (code, name, description, module_code)
VALUES
    ('ORDER_VIEW', '查看订单', '查看下单列表和订单详情', 'ORDER'),
    ('ORDER_CREATE', '新增订单', '创建下单记录', 'ORDER'),
    ('ORDER_EDIT', '编辑订单', '修改下单记录', 'ORDER'),
    ('ORDER_DELETE', '删除订单', '删除下单记录', 'ORDER');

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id FROM roles CROSS JOIN permissions
WHERE roles.code = 'SYSTEM_ADMIN' AND permissions.module_code = 'ORDER'
ON CONFLICT (role_id, permission_id) DO NOTHING;
