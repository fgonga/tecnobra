ALTER TABLE payments ADD COLUMN paymentType VARCHAR(100) NULL AFTER created_at;
UPDATE payments SET paymentType = 'aexpress';
ALTER TABLE orders ADD COLUMN abandoned_notified_at DATETIME NULL;