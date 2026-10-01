-- Bon Prix Ruisseau Sports — future Supabase schema (frontend-only for now).
-- Run this in Supabase SQL editor when you want a real backend.
-- The site currently reads from lib/mock-data.ts + localStorage overrides.

create table if not exists products (
  id text primary key,
  name text not null,
  name_ar text not null default '',
  category text not null default 'Maillots',
  price integer not null default 0,
  old_price integer,
  sizes text[] not null default '{S,M,L,XL}',
  image text not null default '',
  tag text,
  rating numeric not null default 5,
  stock integer not null default 10,
  players text[] not null default '{}',
  description text not null default '',
  description_ar text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  id int primary key default 1,
  hero_video text not null default '',
  hero_title text not null default '',
  hero_title_ar text not null default '',
  hero_subtitle text not null default '',
  promo text not null default '',
  socials jsonb not null default '{}',
  shop jsonb not null default '{}',
  backgrounds jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

alter table products enable row level security;
alter table site_settings enable row level security;

create table if not exists orders (
  id text primary key, -- 8 caractères générés côté client
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  wilaya_code int not null,
  wilaya text not null,
  commune text not null,
  address text not null default '',
  delivery text not null default 'home',
  notes text not null default '',
  items jsonb not null default '[]',
  subtotal int not null default 0,
  fee int not null default 0,
  total int not null default 0,
  status text not null default 'pending'
);

alter table orders enable row level security;

create policy "public read products" on products for select using (true);
create policy "public read settings" on site_settings for select using (true);
create policy "anyone can place orders" on orders for insert with check (true);
create policy "public read own orders" on orders for select using (true);
