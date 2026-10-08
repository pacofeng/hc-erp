WITH samples (number, customer_name, machine_models, machine_configuration) AS (
    VALUES
        (1, '佛山锦源家纺（示例）', 'HC3300H (1台)', '10寸，半寸，带分条刀'),
        (2, '南通舒雅床品（示例）', 'HC-QG-C (1台)', '常规配置'),
        (3, '杭州云锦纺织（示例）', 'HC3300H (2台)', '10寸，半寸，双机同配置'),
        (4, '绍兴瑞丰家纺（示例）', 'HC3300H (1台), HC-QG-C (1台)', E'HC3300H：10寸，半寸，带分条刀\nHC-QG-C：常规'),
        (5, '苏州雅居寝具（示例）', 'HC-QG-C (2台)', '常规配置，分批交付'),
        (6, '青岛海悦纺织（示例）', 'HC3300H (1台)', '10寸，半寸，加强包装'),
        (7, '成都安逸家纺（示例）', 'HC3300H (3台)', '10寸，半寸，带分条刀'),
        (8, '武汉晨曦床品（示例）', 'HC-QG-C (1台)', '常规配置，附安装清单'),
        (9, '东莞恒美寝具（示例）', 'HC3300H (1台), HC-QG-C (2台)', E'HC3300H：10寸，半寸\nHC-QG-C：常规配置'),
        (10, '宁波远航贸易（示例）', 'HC3300H (2台)', '10寸，半寸，带分条刀，出口包装')
)
INSERT INTO orders (
    customer_name, contract_number, machine_models, machine_configuration,
    voltage, xy_motor, z_motor, packaging, nameplate, system_heading,
    system_language, delivery_method, customized, custom_requirements,
    equipment, photo_before_packing, beam_style, manual_language, remarks,
    expected_date, completed_date, prepared_by, reviewed_by, order_date, created_by
)
SELECT
    sample.customer_name,
    'HC-SAMPLE-' || LPAD(sample.number::TEXT, 3, '0'),
    sample.machine_models,
    sample.machine_configuration,
    '380V 50HZ',
    CASE WHEN sample.number % 2 = 0 THEN '松下' ELSE '汇川' END,
    CASE WHEN sample.number % 2 = 0 THEN '安川' ELSE '汇川' END,
    (ARRAY['薄膜', '木托', '木箱'])[((sample.number - 1) % 3) + 1],
    CASE WHEN sample.number % 3 = 0 THEN '客户铭牌' ELSE '恒昌铭牌' END,
    CASE WHEN sample.number % 3 = 0 THEN '客户' ELSE '恒昌' END,
    CASE WHEN sample.number = 10 THEN '英文' ELSE '中文' END,
    (ARRAY['客户安排货柜', '我司安排货柜', '我司安排车'])[((sample.number - 1) % 3) + 1],
    sample.number IN (3, 6, 9),
    CASE WHEN sample.number IN (3, 6, 9) THEN '机身为乳白色，使用客户提供的铭牌图样' ELSE NULL END,
    (ARRAY['无', '卷布机', '稳压机', '空压机', '减震器', '编带'])[((sample.number - 1) % 6) + 1],
    sample.number % 2 = 0,
    CASE WHEN sample.machine_models LIKE '%HC3300%'
        THEN CASE WHEN sample.number % 2 = 0 THEN '2500款' ELSE '3300款' END
        ELSE NULL END,
    CASE WHEN sample.number = 10 THEN '中英文' ELSE '中文' END,
    '示例订单，仅用于功能演示，不代表真实客户或交易。',
    CASE WHEN sample.number <= 3 THEN CURRENT_DATE - 10 + sample.number ELSE CURRENT_DATE + 20 + sample.number END,
    CASE WHEN sample.number <= 3 THEN CURRENT_DATE - 12 + sample.number ELSE NULL END,
    (ARRAY['张敏', '李华', '陈晨'])[((sample.number - 1) % 3) + 1],
    CASE WHEN sample.number <= 6 THEN '王宁' ELSE NULL END,
    CASE WHEN sample.number <= 3 THEN CURRENT_DATE - 45 + sample.number ELSE CURRENT_DATE - sample.number END,
    'sample-data'
FROM samples sample
WHERE NOT EXISTS (
    SELECT 1 FROM orders existing
    WHERE existing.contract_number = 'HC-SAMPLE-' || LPAD(sample.number::TEXT, 3, '0')
);
