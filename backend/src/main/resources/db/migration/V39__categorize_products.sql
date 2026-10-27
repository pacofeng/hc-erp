ALTER TABLE products RENAME COLUMN name TO model;
ALTER TABLE products ALTER COLUMN model TYPE VARCHAR(100);
ALTER TABLE products ADD COLUMN name VARCHAR(200);
ALTER TABLE products ADD COLUMN category_id UUID REFERENCES product_categories(id);
ALTER TABLE products ADD COLUMN is_outsourced BOOLEAN NOT NULL DEFAULT FALSE;

DROP INDEX IF EXISTS idx_products_name;
CREATE INDEX idx_products_model ON products(model);
CREATE INDEX idx_products_category_id ON products(category_id);

UPDATE products p
SET category_id = c.id,
    is_outsourced = FALSE
FROM product_categories c
WHERE c.name = '无梭机'
  AND p.model IN ('HC4000', 'HC4000H', 'HC3600', 'HC3600H', 'HC3300', 'HC3300H', 'HC3200', 'HC3200H', 'HC3000', 'HC3000H', 'HC2500', 'HC2500H');

UPDATE products p
SET category_id = c.id,
    is_outsourced = FALSE
FROM product_categories c
WHERE c.name = '裁剪机'
  AND p.model IN ('HC-FQ2500', 'HC-QG-C', 'HC-QG-E');

UPDATE products p
SET model = 'HC-QG-S（外购）',
    category_id = c.id,
    is_outsourced = TRUE
FROM product_categories c
WHERE c.name = '裁剪机'
  AND p.model = 'HC-QG-S';

UPDATE products p
SET category_id = c.id,
    is_outsourced = FALSE
FROM product_categories c
WHERE c.name = '堆叠机'
  AND p.model = 'HC-ST-A';

INSERT INTO products (model, name, description, category_id, is_outsourced, status)
SELECT item.model, item.name, item.description, category.id, item.is_outsourced, '启用'
FROM (
    VALUES
        ('HC-DB3000', NULL::VARCHAR, '单针机型号', '单针机', FALSE),
        ('HC-S3000', NULL::VARCHAR, '单针机型号', '单针机', FALSE),
        ('HC-D3000', NULL::VARCHAR, '单针机型号', '单针机', FALSE),
        ('HC-64', NULL::VARCHAR, '有梭机型号', '有梭机', FALSE),
        ('HC-80', NULL::VARCHAR, '有梭机型号', '有梭机', FALSE),
        ('HC-94', NULL::VARCHAR, '有梭机型号', '有梭机', FALSE),
        ('HC-110', NULL::VARCHAR, '有梭机型号', '有梭机', FALSE),
        ('HC-128', NULL::VARCHAR, '有梭机型号', '有梭机', FALSE),
        ('HC-QG-C（外购）', NULL::VARCHAR, '裁剪机型号（外购）', '裁剪机', TRUE),
        ('HC-ST-A（外购）', NULL::VARCHAR, '堆叠机型号（外购）', '堆叠机', TRUE),
        ('HC-ST-S（外购）', NULL::VARCHAR, '堆叠机型号（外购）', '堆叠机', TRUE),
        ('HC-FHD', '四头打点机', '小机器', '小机器', TRUE),
        ('HC-DSH', '双头锁边机', '小机器', '小机器', TRUE),
        ('HC-LM', '直线机', '贴牌设备', '小机器', TRUE),
        ('HC-TE', '围边机', '贴牌设备', '小机器', TRUE),
        ('HC-FTM', '假三边缝纫机', '贴牌设备', '小机器', TRUE),
        ('HC-HSM', '拉手缝纫机', '贴牌设备', '小机器', TRUE),
        ('HC-FMMX', '锁边机', '贴牌设备', '小机器', TRUE),
        ('HC-30H', '30L热熔胶机', '贴牌设备', '小机器', TRUE),
        ('40S/2', '涤纶线', '材料', '材料', TRUE),
        ('210D/3', '涤纶线', '材料', '材料', TRUE)
) AS item(model, name, description, category_name, is_outsourced)
JOIN product_categories category ON category.name = item.category_name
WHERE NOT EXISTS (SELECT 1 FROM products product WHERE product.model = item.model);

UPDATE products p
SET is_outsourced = TRUE
FROM product_categories c
WHERE p.category_id = c.id
  AND c.name IN ('小机器', '材料');
