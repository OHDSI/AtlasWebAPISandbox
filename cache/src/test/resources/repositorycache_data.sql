delete from cache.sec_user;
delete from cache.sec_role;
delete from cache.sec_permission;
 
INSERT INTO cache.sec_user (id, name, login) VALUES (NEXTVAL('cache.sec_user_seq'), 'User 1', 'user1');
INSERT INTO cache.sec_user (id, name, login) VALUES (NEXTVAL('cache.sec_user_seq'), 'User 1', 'user2');
INSERT INTO cache.sec_user (id, name, login) VALUES (NEXTVAL('cache.sec_user_seq'), 'User 2', 'user3');

INSERT INTO cache.sec_role (id, name) VALUES (NEXTVAL('cache.sec_role_seq'), 'Role 1');
INSERT INTO cache.sec_role (id, name) VALUES (NEXTVAL('cache.sec_role_seq'), 'Role 2');
INSERT INTO cache.sec_role (id, name) VALUES (NEXTVAL('cache.sec_role_seq'), 'Role 3');

INSERT INTO cache.sec_permission (id, name) VALUES (NEXTVAL('cache.sec_permission_seq'), 'Permission 1');
INSERT INTO cache.sec_permission (id, name) VALUES (NEXTVAL('cache.sec_permission_seq'), 'Permission 2');
INSERT INTO cache.sec_permission (id, name) VALUES (NEXTVAL('cache.sec_permission_seq'), 'Permission 3');

