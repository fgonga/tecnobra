ALTER TABLE `payments` DROP `paymentType`;
ALTER TABLE payments ADD COLUMN payment_type VARCHAR(100) NULL AFTER created_at;
UPDATE payments SET payment_type = 'aexpress';
