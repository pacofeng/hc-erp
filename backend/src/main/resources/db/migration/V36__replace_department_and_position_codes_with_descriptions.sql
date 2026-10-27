ALTER TABLE departments ADD COLUMN description TEXT;
ALTER TABLE positions ADD COLUMN description TEXT;

ALTER TABLE departments DROP COLUMN code;
ALTER TABLE positions DROP COLUMN code;
