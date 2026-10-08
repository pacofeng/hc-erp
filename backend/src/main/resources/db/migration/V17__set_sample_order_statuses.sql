UPDATE orders
SET status = CASE contract_number
    WHEN 'HC-SAMPLE-001' THEN '已完成'
    WHEN 'HC-SAMPLE-002' THEN '已完成'
    WHEN 'HC-SAMPLE-003' THEN '已完成'
    WHEN 'HC-SAMPLE-004' THEN '进行中'
    WHEN 'HC-SAMPLE-005' THEN '进行中'
    WHEN 'HC-SAMPLE-006' THEN '进行中'
    WHEN 'HC-SAMPLE-007' THEN '草稿'
    WHEN 'HC-SAMPLE-008' THEN '草稿'
    WHEN 'HC-SAMPLE-009' THEN '草稿'
    WHEN 'HC-SAMPLE-010' THEN '已取消'
    ELSE status
END
WHERE contract_number LIKE 'HC-SAMPLE-%';
