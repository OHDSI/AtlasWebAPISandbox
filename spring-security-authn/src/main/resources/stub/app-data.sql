-- Permissions

INSERT INTO sec_permission(id, "value", description)
VALUES (1, '*', 'Allows any access.');

INSERT INTO sec_permission(id, "value", description)
VALUES (2, 'read', 'Allows global read access.');

INSERT INTO sec_permission(id, "value", description)
VALUES (3, 'write', 'Allows global write access.');

INSERT INTO sec_permission(id, "value", description)
VALUES (4, 'read:cohort', 'Allows global read access to cohorts.');

INSERT INTO sec_permission(id, "value", description)
VALUES (5, 'write:cohort', 'Allows global write access to cohorts.');

INSERT INTO sec_permission(id, "value", description)
VALUES (6, 'manage', 'Allows global manage access.');

-- Roles + permissions

INSERT INTO sec_role(id, name, system_role)
values (1, 'Public Users', true);

INSERT INTO sec_role_permission(id, role_id, permission_id)
values (1, 1, 2); -- Public users -> global read

-- Users

insert into sec_user(id, login, name, origin)
values (-1, 'anonymous', 'anonymous', 'SYSTEM'); -- anonymous user, speical ID of -1.

INSERT INTO sec_role(id, name, system_role)
values (2, 'anonymous', true); -- anonymous-personal role

INSERT INTO sec_user_role(id, user_id, role_id)
values (2, -1, 2); -- anonymous -> personal role

insert into sec_user(id, login, name, origin)
values (NEXT VALUE FOR sec_user_sequence, 'writeuser', 'writeuser', 'SYSTEM'); -- 'writeuser' for write access

INSERT INTO sec_role(id, name, system_role)
values (NEXT VALUE FOR sec_role_sequence , 'writeuser', false); -- personal role

INSERT INTO sec_user_role(id, user_id, role_id)
values (NEXT VALUE FOR sec_user_role_sequence, CURRVAL('sec_user_sequence'), CURRVAL('sec_role_sequence')); -- writeruser -> personal role

INSERT INTO sec_role_permission(id, role_id, permission_id)
values (NEXT VALUE FOR sec_role_permission_sequence, CURRVAL('sec_role_sequence') , 3); --writeruser -> global write

INSERT INTO sec_user_role(id, user_id, role_id)
values (NEXT VALUE FOR sec_user_role_sequence, CURRVAL('sec_user_sequence'), 1); -- writeruser -> Public Users

insert into sec_user(id, login, name, origin)
values (NEXT VALUE FOR sec_user_sequence, 'bob', 'bob', 'DATABASE'); -- 'bob' for cohort owner test

INSERT INTO sec_role(id, name, system_role)
values (NEXT VALUE FOR sec_role_sequence , 'bob', false); -- personal role

INSERT INTO sec_user_role(id, user_id, role_id)
values (NEXT VALUE FOR sec_user_role_sequence, CURRVAL('sec_user_sequence'), CURRVAL('sec_role_sequence')); -- bob -> personal role

INSERT INTO sec_user_role(id, user_id, role_id)
values (NEXT VALUE FOR sec_user_role_sequence, CURRVAL('sec_user_sequence') , 1); -- bob -> Public Users

-- Cohort Definitions

INSERT INTO cohort_definition(id, name, created_by_id)
values (NEXT VALUE FOR cohort_definition_sequence, 'bob cohort', (select id from sec_user where login = 'bob'));

INSERT INTO cohort_definition_details (id, expression)
values (CURRVAL('cohort_definition_sequence'), '{}');
