create table site_stats (
  id int primary key default 1,
  total_visits bigint not null default 0,
  constraint single_row check (id = 1)
);

insert into site_stats (id, total_visits) values (1, 0);

create or replace function increment_visits()
returns bigint
language sql
as $$
  update site_stats set total_visits = total_visits + 1 where id = 1
  returning total_visits;
$$;
