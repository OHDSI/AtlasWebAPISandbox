INSERT INTO auth_user (username, password_hash, enabled, failed_attempts)
VALUES ('alice', '{noop}password1', true, 0);

INSERT INTO auth_user (username, password_hash, enabled, failed_attempts)
VALUES ('bob', '{noop}password1', true, 0);

INSERT INTO auth_user (username, password_hash, enabled, failed_attempts)
VALUES ('writeuser', '{noop}password1', true, 0);
