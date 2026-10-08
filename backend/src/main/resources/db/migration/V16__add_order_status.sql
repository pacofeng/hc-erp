ALTER TABLE orders
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT '草稿',
    ADD CONSTRAINT chk_orders_status CHECK (status IN ('草稿', '进行中', '已完成', '已取消'));

CREATE INDEX idx_orders_status ON orders(status);
