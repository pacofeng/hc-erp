ALTER TABLE products ADD COLUMN supply_mode VARCHAR(20);

UPDATE products
SET supply_mode = CASE
    WHEN is_outsourced THEN '外购'
    ELSE '自制'
END;

UPDATE products
SET supply_mode = '自制及外购'
WHERE model IN ('HC-QG-C', 'HC-ST-A');

DELETE FROM products
WHERE model IN ('HC-QG-C（外购）', 'HC-ST-A（外购）');

UPDATE products
SET model = 'HC-QG-S',
    supply_mode = '外购'
WHERE model = 'HC-QG-S（外购）';

UPDATE products
SET model = 'HC-ST-S',
    supply_mode = '外购'
WHERE model = 'HC-ST-S（外购）';

ALTER TABLE products
    ALTER COLUMN supply_mode SET NOT NULL,
    ADD CONSTRAINT chk_products_supply_mode CHECK (supply_mode IN ('自制', '外购', '自制及外购')),
    DROP COLUMN is_outsourced;
