
ALTER TABLE orders ADD CONSTRAINT uk_orders_code UNIQUE (code);
ALTER TABLE payments ADD CONSTRAINT uk_payments_code UNIQUE (code);

CREATE TRIGGER block_delete_payments
BEFORE DELETE ON payments
FOR EACH ROW
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'DELETE não permitido em payments';

CREATE TRIGGER block_delete_orders
BEFORE DELETE ON orders
FOR EACH ROW
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'DELETE não permitido em orders';


ALTER TABLE payments DROP FOREIGN KEY payments_ibfk_1;
ALTER TABLE payments ADD CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE order_customers DROP FOREIGN KEY order_customers_ibfk_1;
ALTER TABLE order_customers ADD CONSTRAINT fk_order_customers_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;