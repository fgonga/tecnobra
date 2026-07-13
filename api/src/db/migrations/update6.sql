CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unique_code VARCHAR(100) NOT NULL UNIQUE,

  type ENUM('payment_success','payment_refund') NOT NULL,

  status ENUM('pending','processing','processed','failed') NOT NULL DEFAULT 'pending',

  payload JSON NOT NULL,

  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,

  next_retry_at DATETIME NULL,
  last_error TEXT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL
);

CREATE INDEX idx_events_status_retry
ON events (status, next_retry_at);
