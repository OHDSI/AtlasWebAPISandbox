create schema cache;

CREATE TABLE cache.sec_user (
	id INT PRIMARY KEY,
	name VARCHAR(255),
	login VARCHAR(255) NOT NULL
);

CREATE SEQUENCE cache.sec_user_seq
  START WITH 1
  INCREMENT BY 1;

CREATE TABLE cache.sec_role (
	id INT PRIMARY KEY,
	name VARCHAR(255) NOT NULL
);

CREATE SEQUENCE cache.sec_role_seq
  START WITH 1
  INCREMENT BY 1;


CREATE TABLE cache.sec_permission (
	id INT  PRIMARY KEY,
	name VARCHAR(255) NOT NULL
);

CREATE SEQUENCE cache.sec_permission_seq
  START WITH 1
  INCREMENT BY 1;


CREATE TABLE cache.sec_user_role (
	user_id INT NOT NULL,
	role_id INT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES sec_user(id),
	FOREIGN KEY (role_id) REFERENCES sec_role(id)
);

CREATE TABLE cache.sec_role_permission (
	role_id INT NOT NULL,
	permission_id INT NOT NULL,
	FOREIGN KEY (role_id) REFERENCES sec_role(id),
	FOREIGN KEY (permission_id) REFERENCES sec_permission(id)
);
