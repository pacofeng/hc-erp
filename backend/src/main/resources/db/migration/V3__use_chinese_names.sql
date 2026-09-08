UPDATE departments SET name = chinese_name;
UPDATE roles SET name = chinese_name;
UPDATE permissions SET name = chinese_name;

ALTER TABLE departments DROP COLUMN chinese_name;
ALTER TABLE roles DROP COLUMN chinese_name;
ALTER TABLE permissions DROP COLUMN chinese_name;
