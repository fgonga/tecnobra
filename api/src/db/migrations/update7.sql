ALTER TABLE events
MODIFY retry_count INT NOT NULL DEFAULT 0,
MODIFY max_retries INT NOT NULL DEFAULT 3;
UPDATE events SET retry_count = 0 WHERE retry_count IS NULL;
UPDATE events SET max_retries = 3 WHERE max_retries IS NULL;