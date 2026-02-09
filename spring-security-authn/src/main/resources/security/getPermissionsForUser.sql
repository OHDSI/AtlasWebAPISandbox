select distinct sp.value
from sec_user_role sur 
join sec_role_permission srp on sur.role_id = srp.role_id
join sec_permission sp on sp.id = srp.permission_id
where sur.user_id = ?
order by value;
