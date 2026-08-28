create table sponsors (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  email text not null unique,
  logo_url text,
  website text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table spots (
  id uuid primary key default gen_random_uuid(),
  zone_name text not null,
  size text not null check (size in ('S', 'M', 'L')),
  starting_price numeric not null,
  current_bid numeric,
  current_leader_sponsor_id uuid references sponsors(id)
);

create table bids (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots(id),
  sponsor_id uuid not null references sponsors(id),
  amount numeric not null,
  deposit_paid boolean not null default false,
  lemon_squeezy_order_id text,
  status text not null default 'active'
    check (status in ('active', 'outbid', 'refunded', 'won')),
  created_at timestamptz not null default now()
);

create table campaign (
  id int primary key default 1,
  start_date timestamptz not null,
  end_date timestamptz not null,
  sponsor_exposure_months int not null default 6,
  constraint single_row check (id = 1)
);

insert into spots (zone_name, size, starting_price) values
  ('Capó', 'L', 300),
  ('Puerta izquierda', 'L', 300),
  ('Puerta derecha', 'L', 300),
  ('Baúl', 'M', 180),
  ('Parachoques trasero', 'M', 180),
  ('Espejos', 'S', 90);
