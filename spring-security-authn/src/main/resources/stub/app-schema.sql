CREATE TABLE sec_user_session (
    session_id      UUID PRIMARY KEY,
    username        VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sec_user_session_username
    ON sec_user_session(username);
