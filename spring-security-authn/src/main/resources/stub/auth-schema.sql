CREATE TABLE auth_user (
  username VARCHAR(100) PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL,
  failed_attempts INT NOT NULL,
  locked_until TIMESTAMP NULL
);
