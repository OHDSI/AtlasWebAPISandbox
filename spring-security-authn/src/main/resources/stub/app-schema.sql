CREATE TABLE sec_user_session (
    session_id      UUID PRIMARY KEY,
    username        VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sec_user_session_username
    ON sec_user_session(username);

-- ========================================
-- SEC_USER
-- ========================================
CREATE SEQUENCE sec_user_sequence
    START WITH 1000
    INCREMENT BY 1;

CREATE TABLE sec_user (
    id integer DEFAULT NEXT VALUE FOR sec_user_sequence PRIMARY KEY,
    login character varying(1024),
    name character varying(100),
    last_viewed_notifications_time timestamp with time zone,
    origin character varying(32) DEFAULT 'SYSTEM' NOT NULL
);



-- ========================================
-- SEC_ROLE
-- ========================================
CREATE SEQUENCE sec_role_sequence
    START WITH 1000
    INCREMENT BY 1;

CREATE TABLE sec_role (
    id integer DEFAULT NEXT VALUE FOR sec_role_sequence PRIMARY KEY,
    name character varying(255),
    system_role boolean DEFAULT false NOT NULL
);

-- ========================================
-- SEC_PERMISSION
-- ========================================
CREATE SEQUENCE SEC_PERMISSION_SEQUENCE 
    START WITH 1000 
    INCREMENT BY 1;

CREATE TABLE SEC_PERMISSION(
    ID                  INTEGER DEFAULT NEXT VALUE FOR SEC_PERMISSION_SEQUENCE PRIMARY KEY,
    "value"             VARCHAR2(255) NOT NULL,
    DESCRIPTION		    VARCHAR2(255) NULL
);

-- ========================================
-- SEC_ROLE_PERMISSION
-- ========================================
CREATE SEQUENCE sec_role_permission_sequence
    START WITH 1000
    INCREMENT BY 1;

CREATE TABLE sec_role_permission (
    id integer DEFAULT NEXT VALUE FOR sec_role_permission_sequence NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    CONSTRAINT fk_role
        FOREIGN KEY (role_id)
        REFERENCES sec_role(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_permission
        FOREIGN KEY (permission_id)
        REFERENCES sec_permission(id)
        ON DELETE CASCADE              
);


-- ========================================
-- SEC_USER_ROLE
-- ========================================
CREATE SEQUENCE sec_user_role_sequence
    START WITH 1000
    INCREMENT BY 1;

CREATE TABLE sec_user_role (
    id integer DEFAULT NEXT VALUE FOR sec_user_role_sequence NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    origin character varying(32) DEFAULT 'SYSTEM' NOT NULL,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES sec_user(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_role_user
        FOREIGN KEY (role_id)
        REFERENCES sec_role(id)
        ON DELETE CASCADE    
);
