-- ============================================================================
-- BON PRIX RUISSEAU SPORTS (Alger) — Schéma e-commerce professionnel
-- PostgreSQL 15+ / Supabase — UUID partout, RLS partout, FR + AR.
--
-- MODE D'EMPLOI (projet https://gmyacokncbtojkwhzcrs.supabase.co) :
--   1. Supabase Dashboard > SQL Editor > New query
--   2. Coller TOUT ce fichier > Run
--   3. Créer le compte gérant sur le site (Sign up), puis :
--        update public.users set role = 'admin' where email = 'ton@email.dz';
-- Script idempotent : ré-exécutable sans doublons (IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. ENUMS (DO block car CREATE TYPE n'a pas de IF NOT EXISTS)
-- ----------------------------------------------------------------------------
do $$ begin create type user_role as enum ('customer', 'admin');
  exception when duplicate_object then null; end $$;

do $$ begin create type order_status as enum (
  'pending',     -- en attente (à confirmer par téléphone)
  'confirmed',   -- confirmée (validée)
  'preparing',   -- en préparation au magasin
  'shipped',     -- expédiée (avec le livreur / Maystro etc.)
  'delivered',   -- livrée + payée
  'cancelled',   -- annulée
  'returned'     -- retournée / échange
); exception when duplicate_object then null; end $$;

do $$ begin create type payment_method as enum (
  'cod',          -- cash à la livraison (défaut en Algérie)
  'ccp',          -- virement CCP
  'baridi_mob',   -- BaridiMob
  'bank_transfer' -- virement bancaire
); exception when duplicate_object then null; end $$;

do $$ begin create type payment_status as enum ('unpaid', 'paid', 'refunded');
  exception when duplicate_object then null; end $$;

do $$ begin create type delivery_type as enum ('home', 'stopdesk');
  -- home = à domicile, stopdesk = bureau / point relais
  exception when duplicate_object then null; end $$;

do $$ begin create type promo_type as enum ('percent', 'fixed');
  exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. WILAYAS — les 58 wilayas + frais de livraison (DA)
-- ----------------------------------------------------------------------------
create table if not exists wilayas (
  code          smallint primary key check (code between 1 and 58),
  name_fr       text not null,
  name_ar       text not null default '',
  home_fee      integer not null default 900 check (home_fee >= 0),     -- domicile (DA)
  stopdesk_fee  integer not null default 550 check (stopdesk_fee >= 0), -- bureau (DA)
  is_active     boolean not null default true                            -- soft delete
);
comment on table wilayas is 'Les 58 wilayas d Algérie + frais de livraison domicile/stopdesk en DA';

-- ----------------------------------------------------------------------------
-- 3. USERS — profil public lié à auth.users (Supabase Auth)
-- ----------------------------------------------------------------------------
create table if not exists users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  phone         text,
  role          user_role not null default 'customer',
  display_name  text not null default '',
  is_active     boolean not null default true, -- soft delete / ban
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table users is 'Profils liés à auth.users. role=admin => accès total via RLS.';
create index if not exists users_role_idx on users(role) where is_active;
create index if not exists users_phone_idx on users(phone);

-- ----------------------------------------------------------------------------
-- 4. FONCTIONS DE BASE (helpers)
-- ----------------------------------------------------------------------------
-- Vrai/faux admin — SECURITY DEFINER pour éviter la récursion RLS.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.users where id = auth.uid() and role = 'admin' and is_active
); $$;

-- updated_at automatique.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- Crée le profil public à chaque inscription Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, phone, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email,''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. CATEGORIES — Maillots, Survêtements... (FR + AR)
-- ----------------------------------------------------------------------------
create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,            -- ex: 'maillots' (URL + filtre)
  name_fr       text not null,
  name_ar       text not null default '',
  description   text not null default '',
  image         text not null default '',
  sort_order    integer not null default 0,      -- ordre d affichage boutique
  is_active     boolean not null default true,   -- soft delete
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table categories is 'Rayons de la boutique (bilingue FR/AR, tri manuel).';
create index if not exists categories_slug_idx on categories(slug) where is_active;

-- ----------------------------------------------------------------------------
-- 6. PRODUCTS — fiche produit (le stock vit dans product_variants)
-- ----------------------------------------------------------------------------
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references categories(id) on delete set null,
  slug          text not null unique,            -- ex: 'liverpool-domicile-26-27'
  name_fr       text not null,                   -- snapshot recopié dans order_items
  name_ar       text not null default '',
  description_fr text not null default '',
  description_ar text not null default '',
  base_price    integer not null default 0 check (base_price >= 0), -- prix de base (DA)
  old_price     integer check (old_price is null or old_price > base_price), -- barré (promo)
  rating        numeric not null default 5 check (rating >= 0 and rating <= 5),
  rating_count  integer not null default 0,
  tag           text,                            -- Best-seller, Nouveau, Promo...
  flocage_names text[] not null default '{}',   -- presets flocage : {"SALAH 11",...}
  is_featured   boolean not null default false,  -- best-sellers page d accueil
  is_active     boolean not null default true,   -- soft delete (rupture totale = stock variantes à 0)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table products is 'Fiches produits. Stock géré par variante (taille/couleur). Prix snapshoté à la commande.';
create index if not exists products_slug_idx on products(slug) where is_active;
create index if not exists products_category_idx on products(category_id) where is_active;
create index if not exists products_featured_idx on products(is_featured) where is_active and is_featured;

-- ----------------------------------------------------------------------------
-- 7. PRODUCT_VARIANTS — stock par TAILLE + COULEUR (S/M/L/XL + hex)
-- ----------------------------------------------------------------------------
create table if not exists product_variants (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  size            text not null,                 -- S, M, L, XL, XXL, 6A...
  color_name_fr   text not null default '',      -- Rouge, Bleu ciel...
  color_name_ar   text not null default '',
  color_hex       text not null default '',      -- #FF0000 (pastille UI)
  sku             text not null unique,          -- ex: LIV-HOME-2627-XL
  price_override  integer check (price_override is null or price_override >= 0), -- sinon base_price
  stock           integer not null default 0 check (stock >= 0), -- JAMAIS négatif
  is_active       boolean not null default true, -- soft delete
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (product_id, size, color_hex)           -- une ligne par déclinaison
);
comment on table product_variants is 'Déclinaisons taille/couleur avec stock propre. Décrément atomique via decrease_stock().';
create index if not exists variants_product_idx on product_variants(product_id) where is_active;
create index if not exists variants_sku_idx on product_variants(sku);

-- ----------------------------------------------------------------------------
-- 8. PRODUCT_IMAGES — galerie (produit ou variante)
-- ----------------------------------------------------------------------------
create table if not exists product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  variant_id  uuid references product_variants(id) on delete cascade, -- null = galerie produit
  url         text not null,
  alt_fr      text not null default '',
  alt_ar      text not null default '',
  position    integer not null default 0,   -- ordre galerie
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);
comment on table product_images is 'Photos produit (is_primary = vignette) ou spécifiques à une variante.';
create index if not exists images_product_idx on product_images(product_id, position);
create unique index if not exists images_product_url_idx on product_images(product_id, url); -- anti-doublons seed

-- ----------------------------------------------------------------------------
-- 9. CUSTOMERS — fiche acheteur (compte ou invité COD par téléphone)
-- ----------------------------------------------------------------------------
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references users(id) on delete set null, -- null = invité
  full_name   text not null,
  phone       text not null,                    -- identifiant COD en Algérie
  wilaya_code smallint references wilayas(code),
  commune     text not null default '',
  address     text not null default '',
  notes       text not null default '',
  is_active   boolean not null default true,    -- soft delete
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table customers is 'Acheteurs : liés à un compte (user_id) ou invités (téléphone).';
create index if not exists customers_user_idx on customers(user_id);
create index if not exists customers_phone_idx on customers(phone);
create index if not exists customers_wilaya_idx on customers(wilaya_code);

-- ----------------------------------------------------------------------------
-- 10. ORDERS — commandes (invité possible + snapshot prix/noms)
-- ----------------------------------------------------------------------------
create sequence if not exists order_seq start 1000;

create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,          -- BPR-2026-001234 (ticket client)
  customer_id     uuid references customers(id) on delete set null, -- null = invité
  guest_name      text not null default '',     -- snapshot invité
  guest_phone     text not null default '',     -- snapshot invité (suivi + RLS)
  wilaya_code     smallint not null references wilayas(code),
  wilaya_name     text not null default '',     -- snapshot (si la wilaya change)
  commune         text not null default '',
  address         text not null default '',
  delivery        delivery_type not null default 'home',
  payment_method  payment_method not null default 'cod',
  payment_status  payment_status not null default 'unpaid',
  status          order_status not null default 'pending',
  promo_code      text,                          -- snapshot du code utilisé
  subtotal        integer not null default 0 check (subtotal >= 0),
  delivery_fee    integer not null default 0 check (delivery_fee >= 0),
  discount        integer not null default 0 check (discount >= 0),
  total           integer not null default 0 check (total >= 0),
  notes           text not null default '',
  status_history  jsonb not null default '[]',  -- [{from,to,at}] via trigger
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Invité => nom + téléphone DZ obligatoires ; sinon customer_id obligatoire.
  check (
    customer_id is not null
    or (nullif(guest_name, '') is not null and guest_phone ~ '^0[567][0-9]{8}$')
  ),
  check (discount <= subtotal)
);
comment on table orders is 'Commandes COD. Prix/noms snapshotés (order_items) : modif catalogue sans effet rétroactif.';
create index if not exists orders_number_idx on orders(order_number);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_customer_idx on orders(customer_id);
create index if not exists orders_created_idx on orders(created_at desc);
create index if not exists orders_guest_phone_idx on orders(guest_phone);

-- Numéro de commande lisible BPR-ANNEE-XXXXXX.
create or replace function public.generate_order_number()
returns text language sql as $$
  select 'BPR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_seq')::text, 6, '0');
$$;

create or replace function public.assign_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := public.generate_order_number();
  end if;
  return new;
end; $$;

drop trigger if exists trg_assign_order_number on orders;
create trigger trg_assign_order_number
  before insert on orders for each row execute function public.assign_order_number();

-- Historique des statuts (tracking admin + suivi client).
create or replace function public.track_status_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.status_history := coalesce(old.status_history, '[]'::jsonb)
      || jsonb_build_object('from', old.status, 'to', new.status, 'at', now());
  end if;
  return new;
end; $$;

drop trigger if exists trg_track_status on orders;
create trigger trg_track_status
  before update of status on orders for each row execute function public.track_status_change();

-- ----------------------------------------------------------------------------
-- 11. ORDER_ITEMS — lignes avec SNAPSHOT (nom/prix au moment de l achat)
-- ----------------------------------------------------------------------------
create table if not exists order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  product_id        uuid references products(id) on delete set null,
  variant_id        uuid references product_variants(id) on delete set null,
  product_name_fr   text not null,               -- snapshot (résiste aux renommages)
  product_name_ar   text not null default '',
  variant_label     text not null default '',   -- ex: "XL / Rouge"
  image_url         text not null default '',   -- snapshot visuel
  flocage_label     text,                        -- ex: "SALAH 11" / "MON NOM 7"
  flocage_price     integer not null default 0 check (flocage_price >= 0),
  unit_price        integer not null check (unit_price >= 0), -- prix + flocage (DA)
  qty               integer not null check (qty >= 1 and qty <= 99),
  created_at        timestamptz not null default now()
);
comment on table order_items is 'Lignes de commande figées : nom/prix/image au jour de l achat.';
create index if not exists items_order_idx on order_items(order_id);
create index if not exists items_product_idx on order_items(product_id);

-- ----------------------------------------------------------------------------
-- 12. REVIEWS — avis clients (modération admin)
-- ----------------------------------------------------------------------------
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade, -- compte requis
  rating      integer not null check (rating between 1 and 5),
  title       text not null default '',
  comment     text not null default '',
  is_approved boolean not null default false, -- modération : invisible tant que false
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, user_id) -- un avis par client/produit
);
comment on table reviews is 'Avis modérés : publics seulement si is_approved.';
create index if not exists reviews_product_idx on reviews(product_id) where is_approved;
create index if not exists reviews_user_idx on reviews(user_id);

-- ----------------------------------------------------------------------------
-- 13. PROMOS — codes promo (HIVER20, BIENVENUE10...)
-- ----------------------------------------------------------------------------
create table if not exists promos (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,              -- ex: HIVER20
  title_fr    text not null,
  title_ar    text not null default '',
  type        promo_type not null default 'percent',
  value       integer not null,                  -- % ou DA selon type
  min_order   integer not null default 0 check (min_order >= 0), -- panier min (DA)
  max_uses    integer not null default 0 check (max_uses >= 0),  -- 0 = illimité
  used_count  integer not null default 0 check (used_count >= 0),
  starts_at   timestamptz,
  ends_at     timestamptz,
  is_active   boolean not null default true,     -- soft delete
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check ((type = 'percent' and value between 1 and 100) or (type = 'fixed' and value > 0)),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
comment on table promos is 'Codes promo % ou DA, quota + fenêtre de validité.';
create index if not exists promos_code_idx on promos(code) where is_active;

-- ----------------------------------------------------------------------------
-- 14. SITE_SETTINGS — l admin contrôle TOUS les textes du site (clé/valeur FR+AR)
-- ----------------------------------------------------------------------------
create table if not exists site_settings (
  key         text primary key,                  -- ex: hero_title, whatsapp_number
  value       text not null,                     -- texte FR (ou URL / nombre en texte)
  value_ar    text,                              -- version arabe (null = non traduit)
  description text not null default '',          -- aide admin ("où ça s affiche")
  updated_at  timestamptz not null default now()
);
comment on table site_settings is 'Textes/links/horaires du site éditables par l admin (bannières, promos, WhatsApp...).';

-- ----------------------------------------------------------------------------
-- 15. TRIGGERS updated_at
-- ----------------------------------------------------------------------------
drop trigger if exists trg_users_updated on users;
create trigger trg_users_updated before update on users
  for each row execute function public.set_updated_at();
drop trigger if exists trg_categories_updated on categories;
create trigger trg_categories_updated before update on categories
  for each row execute function public.set_updated_at();
drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
  for each row execute function public.set_updated_at();
drop trigger if exists trg_variants_updated on product_variants;
create trigger trg_variants_updated before update on product_variants
  for each row execute function public.set_updated_at();
drop trigger if exists trg_customers_updated on customers;
create trigger trg_customers_updated before update on customers
  for each row execute function public.set_updated_at();
drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
  for each row execute function public.set_updated_at();
drop trigger if exists trg_reviews_updated on reviews;
create trigger trg_reviews_updated before update on reviews
  for each row execute function public.set_updated_at();
drop trigger if exists trg_promos_updated on promos;
create trigger trg_promos_updated before update on promos
  for each row execute function public.set_updated_at();
drop trigger if exists trg_settings_updated on site_settings;
create trigger trg_settings_updated before update on site_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 16. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table wilayas enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table promos enable row level security;
alter table site_settings enable row level security;

-- ---- WILAYAS : lecture publique (actives), écriture admin ---------------
drop policy if exists "Wilayas publiques" on wilayas;
create policy "Wilayas publiques" on wilayas for select using (is_active);
drop policy if exists "Wilayas admin" on wilayas;
create policy "Wilayas admin" on wilayas for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- USERS : chacun son profil (sans auto-promotion admin !) ------------
drop policy if exists "Profil perso" on users;
create policy "Profil perso" on users for select using (auth.uid() = id);
drop policy if exists "Profil perso update" on users;
create policy "Profil perso update" on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = 'customer'); -- un client ne peut pas se faire admin
drop policy if exists "Users admin" on users;
create policy "Users admin" on users for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- CATALOGUE : lecture publique, écriture admin -----------------------
drop policy if exists "Catalogue public" on categories;
create policy "Catalogue public" on categories for select using (is_active);
drop policy if exists "Catalogue admin" on categories;
create policy "Catalogue admin" on categories for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Produits publics" on products;
create policy "Produits publics" on products for select using (is_active);
drop policy if exists "Produits admin" on products;
create policy "Produits admin" on products for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Variantes publiques" on product_variants;
create policy "Variantes publiques" on product_variants for select using (is_active);
drop policy if exists "Variantes admin" on product_variants;
create policy "Variantes admin" on product_variants for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Images publiques" on product_images;
create policy "Images publiques" on product_images for select using (true);
drop policy if exists "Images admin" on product_images;
create policy "Images admin" on product_images for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- CUSTOMERS : chacun sa fiche, admin tout ---------------------------
drop policy if exists "Client perso" on customers;
create policy "Client perso" on customers for select using (user_id = auth.uid());
drop policy if exists "Client perso insert" on customers;
create policy "Client perso insert" on customers for insert with check (user_id = auth.uid());
drop policy if exists "Client perso update" on customers;
create policy "Client perso update" on customers for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Clients admin" on customers;
create policy "Clients admin" on customers for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- ORDERS : chacun SES commandes ; invités via check téléphone --------
-- Lecture : admin OU commande rattachée à mon profil client.
drop policy if exists "Commandes perso" on orders;
create policy "Commandes perso" on orders for select using (
  public.is_admin()
  or exists (select 1 from customers c where c.id = orders.customer_id and c.user_id = auth.uid())
);
-- Création : admin OU mon profil client OU invité (nom + tél DZ valides).
-- NOTE : en prod, privilégier la route /api avec service_role (anti-spam).
drop policy if exists "Passer commande" on orders;
create policy "Passer commande" on orders for insert with check (
  public.is_admin()
  or exists (select 1 from customers c where c.id = customer_id and c.user_id = auth.uid())
  or (customer_id is null and guest_phone ~ '^0[567][0-9]{8}$' and nullif(guest_name, '') is not null)
);
-- Modification/suppression : admin uniquement (le client appelle le magasin).
drop policy if exists "Commandes admin" on orders;
create policy "Commandes admin" on orders for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Commandes admin delete" on orders;
create policy "Commandes admin delete" on orders for delete using (public.is_admin());

-- ---- ORDER_ITEMS : visibles avec leur commande, écriture encadrée --------
drop policy if exists "Lignes visibles" on order_items;
create policy "Lignes visibles" on order_items for select using (
  public.is_admin()
  or exists (
    select 1 from orders o
    join customers c on c.id = o.customer_id
    where o.id = order_items.order_id and c.user_id = auth.uid()
  )
);
drop policy if exists "Lignes insert" on order_items;
create policy "Lignes insert" on order_items for insert with check (
  public.is_admin()
  or exists (
    select 1 from orders o
    left join customers c on c.id = o.customer_id
    where o.id = order_id
      and (c.user_id = auth.uid()
        or (o.customer_id is null and o.guest_phone ~ '^0[567][0-9]{8}$'))
  )
);
drop policy if exists "Lignes admin" on order_items;
create policy "Lignes admin" on order_items for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- REVIEWS : publics si approuvés ; chacun les siens ; admin tout -----
drop policy if exists "Avis visibles" on reviews;
create policy "Avis visibles" on reviews for select using (
  is_approved or user_id = auth.uid() or public.is_admin()
);
drop policy if exists "Avis perso insert" on reviews;
create policy "Avis perso insert" on reviews for insert
  with check (user_id = auth.uid());
drop policy if exists "Avis perso update" on reviews;
create policy "Avis perso update" on reviews for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_approved = false); -- on ne s auto-approuve pas
drop policy if exists "Avis perso delete" on reviews;
create policy "Avis perso delete" on reviews for delete using (user_id = auth.uid());
drop policy if exists "Avis admin" on reviews;
create policy "Avis admin" on reviews for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- PROMOS : codes actifs visibles, gestion admin ----------------------
drop policy if exists "Promos actives" on promos;
create policy "Promos actives" on promos for select using (
  public.is_admin()
  or (is_active and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now()))
);
drop policy if exists "Promos admin" on promos;
create policy "Promos admin" on promos for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- SITE_SETTINGS : lecture publique, écriture admin -------------------
drop policy if exists "Settings publics" on site_settings;
create policy "Settings publics" on site_settings for select using (true);
drop policy if exists "Settings admin" on site_settings;
create policy "Settings admin" on site_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 17. FONCTIONS MÉTIER (RPC appelables depuis le site)
-- ----------------------------------------------------------------------------
-- Décrément atomique du stock : N clients simultanés => jamais sous 0.
-- Retourne true si le stock suffisait, false sinon (rupture).
create or replace function public.decrease_stock(p_variant_id uuid, p_qty int)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare ok boolean;
begin
  update product_variants
  set stock = stock - greatest(p_qty, 0)
  where id = p_variant_id and stock >= greatest(p_qty, 0)
  returning true into ok;
  return coalesce(ok, false);
end; $$;

-- Remet du stock (annulation / retour).
create or replace function public.restore_stock(p_variant_id uuid, p_qty int)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update product_variants
  set stock = stock + greatest(p_qty, 0)
  where id = p_variant_id;
end; $$;

grant execute on function public.decrease_stock(uuid, int) to anon, authenticated;
grant execute on function public.restore_stock(uuid, int) to anon, authenticated;

-- Suivi invité : commande + lignes si le téléphone correspond (ticket / QR).
create or replace function public.track_order(p_number text, p_phone text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  o record; cust_phone text; items jsonb;
  clean text := regexp_replace(coalesce(p_phone, ''), '[\s-]', '', 'g');
begin
  select * into o from orders where order_number = upper(trim(coalesce(p_number, '')));
  if not found then return null; end if;

  if regexp_replace(coalesce(o.guest_phone, ''), '[\s-]', '', 'g') <> clean then
    select phone into cust_phone from customers where id = o.customer_id;
    if not found or regexp_replace(cust_phone, '[\s-]', '', 'g') <> clean then
      return null; -- mauvais numéro => rien ne fuit
    end if;
  end if;

  select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at), '[]')
    into items from order_items i where i.order_id = o.id;
  return jsonb_build_object('order', to_jsonb(o), 'items', items);
end; $$;

grant execute on function public.track_order(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 18. VUES ADMIN — tableau de bord (security_invoker = RLS respectée, PG15+)
-- ----------------------------------------------------------------------------
-- Variantes en stock bas (<= 5) : à réassortir vite.
create or replace view v_low_stock with (security_invoker = true) as
select v.id as variant_id, p.name_fr as produit, v.size as taille,
  nullif(v.color_name_fr, '') as couleur, v.sku, v.stock
from product_variants v
join products p on p.id = v.product_id
where v.is_active and p.is_active and v.stock <= 5
order by v.stock asc;

-- Commandes du jour.
create or replace view v_orders_today with (security_invoker = true) as
select id, order_number, guest_name,
  (select full_name from customers c where c.id = o.customer_id) as client,
  total, status, payment_status, created_at
from orders o
where created_at >= date_trunc('day', now())
order by created_at desc;

-- Chiffre d affaires 30 jours (commandes non annulées/retournées).
create or replace view v_revenue_30d with (security_invoker = true) as
select date_trunc('day', created_at)::date as jour,
  count(*) as commandes, sum(total) as ca
from orders
where status in ('confirmed', 'preparing', 'shipped', 'delivered')
  and created_at >= now() - interval '30 days'
group by 1 order by 1;

comment on view v_low_stock is 'Dashboard admin : variantes à réassortir (stock <= 5).';
comment on view v_orders_today is 'Dashboard admin : commandes du jour.';
comment on view v_revenue_30d is 'Dashboard admin : CA des 30 derniers jours.';

-- ----------------------------------------------------------------------------
-- 19. SEED — wilayas (58) avec les frais domicile/stopdesk du magasin
-- ----------------------------------------------------------------------------
insert into wilayas (code, name_fr, name_ar, home_fee, stopdesk_fee) values
  (1, 'Adrar', 'أدرار', 1200, 750),
  (2, 'Chlef', 'الشلف', 650, 400),
  (3, 'Laghouat', 'الأغواط', 850, 550),
  (4, 'Oum El Bouaghi', 'أم البواقي', 750, 450),
  (5, 'Batna', 'باتنة', 750, 450),
  (6, 'Béjaïa', 'بجاية', 650, 400),
  (7, 'Biskra', 'بسكرة', 800, 500),
  (8, 'Béchar', 'بشار', 1000, 650),
  (9, 'Blida', 'البليدة', 550, 350),
  (10, 'Bouira', 'البويرة', 600, 350),
  (11, 'Tamanrasset', 'تمنراست', 1400, 900),
  (12, 'Tébessa', 'تبسة', 800, 500),
  (13, 'Tlemcen', 'تلمسان', 750, 450),
  (14, 'Tiaret', 'تيارت', 750, 450),
  (15, 'Tizi Ouzou', 'تيزي وزو', 650, 400),
  (16, 'Alger', 'الجزائر', 500, 300),
  (17, 'Djelfa', 'الجلفة', 800, 500),
  (18, 'Jijel', 'جيجل', 700, 400),
  (19, 'Sétif', 'سطيف', 650, 400),
  (20, 'Saïda', 'سعيدة', 800, 500),
  (21, 'Skikda', 'سكيكدة', 700, 400),
  (22, 'Sidi Bel Abbès', 'سيدي بلعباس', 750, 450),
  (23, 'Annaba', 'عنابة', 700, 400),
  (24, 'Guelma', 'قالمة', 750, 450),
  (25, 'Constantine', 'قسنطينة', 650, 400),
  (26, 'Médéa', 'المدية', 650, 400),
  (27, 'Mostaganem', 'مستغانم', 700, 400),
  (28, 'M''Sila', 'المسيلة', 750, 450),
  (29, 'Mascara', 'معسكر', 700, 400),
  (30, 'Ouargla', 'ورقلة', 900, 550),
  (31, 'Oran', 'وهران', 600, 350),
  (32, 'El Bayadh', 'البيض', 900, 550),
  (33, 'Illizi', 'إليزي', 1300, 800),
  (34, 'Bordj Bou Arréridj', 'برج بوعريريج', 700, 400),
  (35, 'Boumerdès', 'بومرداس', 550, 350),
  (36, 'El Tarf', 'الطارف', 800, 500),
  (37, 'Tindouf', 'تندوف', 1400, 900),
  (38, 'Tissemsilt', 'تيسمسيلت', 750, 450),
  (39, 'El Oued', 'الوادي', 900, 550),
  (40, 'Khenchela', 'خنشلة', 800, 500),
  (41, 'Souk Ahras', 'سوق أهراس', 800, 500),
  (42, 'Tipaza', 'تيبازة', 650, 400),
  (43, 'Mila', 'ميلة', 750, 450),
  (44, 'Aïn Defla', 'عين الدفلى', 650, 400),
  (45, 'Naâma', 'النعامة', 950, 600),
  (46, 'Aïn Témouchent', 'عين تموشنت', 750, 450),
  (47, 'Ghardaïa', 'غرداية', 900, 550),
  (48, 'Relizane', 'غليزان', 700, 400),
  (49, 'Timimoun', 'تيميمون', 1250, 800),
  (50, 'Bordj Badji Mokhtar', 'برج باجي مختار', 1500, 1000),
  (51, 'Ouled Djellal', 'أولاد جلال', 850, 550),
  (52, 'Béni Abbès', 'بني عباس', 1100, 700),
  (53, 'In Salah', 'عين صالح', 1300, 850),
  (54, 'In Guezzam', 'عين قزام', 1500, 1000),
  (55, 'Touggourt', 'تقرت', 900, 550),
  (56, 'Djanet', 'جانت', 1400, 900),
  (57, 'El M''Ghair', 'المغير', 1000, 650),
  (58, 'El Meniaa', 'المنيعة', 1000, 650)
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- 20. SEED — catégories
-- ----------------------------------------------------------------------------
insert into categories (slug, name_fr, name_ar, description, sort_order) values
  ('maillots', 'Maillots', 'قمصان', 'Maillots Premier League 26/27 — Liverpool, United, Arsenal, City.', 1),
  ('survetements', 'Survêtements', 'بدل رياضية', 'Survêtements et ensembles sport.', 2),
  ('chaussures', 'Chaussures', 'أحذية', 'Sneakers et chaussures de sport.', 3),
  ('vestes', 'Vestes', 'سترات', 'Vestes et coupes-vent.', 4),
  ('enfants', 'Enfants', 'أطفال', 'Tailles 6 à 14 ans.', 5),
  ('accessoires', 'Accessoires', 'إكسسوارات', 'Ballons, sacs, casquettes.', 6)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 21. SEED — produits (maillots PL 26/27)
-- ----------------------------------------------------------------------------
insert into products
  (category_id, slug, name_fr, name_ar, description_fr, description_ar,
   base_price, old_price, rating, rating_count, tag, flocage_names, is_featured)
values
  ((select id from categories where slug = 'maillots'),
   'liverpool-domicile-26-27', 'Maillot Liverpool Domicile 26/27', 'قميص ليفربول الأساسي 26/27',
   'Maillot domicile Liverpool 26/27 — tissu respirant, écusson brodé, coupe supporters.',
   'قميص ليفربول الأساسي 26/27 — قماش يتنفس، شعار مطرز.',
   3200, 3800, 4.9, 214, 'Best-seller', array['SALAH 11', 'VAN DIJK 4', 'WIRTZ 7'], true),
  ((select id from categories where slug = 'maillots'),
   'man-united-domicile-26-27', 'Maillot Man United Domicile 26/27', 'قميص مان يونايتد الأساسي 26/27',
   'Maillot domicile Man United 26/27 — rouge diable, matière premium anti-transpirante.',
   'قميص مان يونايتد الأساسي 26/27 — أحمر الشياطين بجودة عالية.',
   3200, null, 4.8, 156, 'Nouveau', array['FERNANDES 8', 'CUNHA 10', 'DIALLO 16'], true),
  ((select id from categories where slug = 'maillots'),
   'arsenal-domicile-26-27', 'Maillot Arsenal Domicile 26/27', 'قميص أرسنال الأساسي 26/27',
   'Maillot domicile Arsenal 26/27 — rouge et blanc canonniers, finition premium.',
   'قميص أرسنال الأساسي 26/27 — أحمر وأبيض بلمسة فاخرة.',
   3200, 3700, 4.8, 132, null, array['SAKA 7', 'ODEGAARD 8', 'RICE 41'], true),
  ((select id from categories where slug = 'maillots'),
   'man-city-domicile-26-27', 'Maillot Man City Domicile 26/27', 'قميص مان سيتي الأساسي 26/27',
   'Maillot domicile Man City 26/27 — bleu ciel, technologie dry-fit, coupe moderne.',
   'قميص مان سيتي الأساسي 26/27 — أزرق سماوي بقصة عصرية.',
   3200, null, 4.7, 98, 'Nouveau', array['HAALAND 9', 'FODEN 47', 'RODRI 16'], true)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 22. SEED — variantes (stock par taille, sommes = stocks actuels du site)
-- ----------------------------------------------------------------------------
insert into product_variants (product_id, size, color_name_fr, color_name_ar, sku, stock) values
  -- Liverpool (24)
  ((select id from products where slug = 'liverpool-domicile-26-27'), 'S', 'Rouge', 'أحمر', 'LIV-HOME-2627-S', 4),
  ((select id from products where slug = 'liverpool-domicile-26-27'), 'M', 'Rouge', 'أحمر', 'LIV-HOME-2627-M', 6),
  ((select id from products where slug = 'liverpool-domicile-26-27'), 'L', 'Rouge', 'أحمر', 'LIV-HOME-2627-L', 6),
  ((select id from products where slug = 'liverpool-domicile-26-27'), 'XL', 'Rouge', 'أحمر', 'LIV-HOME-2627-XL', 5),
  ((select id from products where slug = 'liverpool-domicile-26-27'), 'XXL', 'Rouge', 'أحمر', 'LIV-HOME-2627-XXL', 3),
  -- Man United (18)
  ((select id from products where slug = 'man-united-domicile-26-27'), 'S', 'Rouge', 'أحمر', 'MUN-HOME-2627-S', 3),
  ((select id from products where slug = 'man-united-domicile-26-27'), 'M', 'Rouge', 'أحمر', 'MUN-HOME-2627-M', 5),
  ((select id from products where slug = 'man-united-domicile-26-27'), 'L', 'Rouge', 'أحمر', 'MUN-HOME-2627-L', 4),
  ((select id from products where slug = 'man-united-domicile-26-27'), 'XL', 'Rouge', 'أحمر', 'MUN-HOME-2627-XL', 4),
  ((select id from products where slug = 'man-united-domicile-26-27'), 'XXL', 'Rouge', 'أحمر', 'MUN-HOME-2627-XXL', 2),
  -- Arsenal (15)
  ((select id from products where slug = 'arsenal-domicile-26-27'), 'S', 'Rouge', 'أحمر', 'ARS-HOME-2627-S', 3),
  ((select id from products where slug = 'arsenal-domicile-26-27'), 'M', 'Rouge', 'أحمر', 'ARS-HOME-2627-M', 4),
  ((select id from products where slug = 'arsenal-domicile-26-27'), 'L', 'Rouge', 'أحمر', 'ARS-HOME-2627-L', 3),
  ((select id from products where slug = 'arsenal-domicile-26-27'), 'XL', 'Rouge', 'أحمر', 'ARS-HOME-2627-XL', 3),
  ((select id from products where slug = 'arsenal-domicile-26-27'), 'XXL', 'Rouge', 'أحمر', 'ARS-HOME-2627-XXL', 2),
  -- Man City (12)
  ((select id from products where slug = 'man-city-domicile-26-27'), 'S', 'Bleu ciel', 'أزرق سماوي', 'MCI-HOME-2627-S', 2),
  ((select id from products where slug = 'man-city-domicile-26-27'), 'M', 'Bleu ciel', 'أزرق سماوي', 'MCI-HOME-2627-M', 3),
  ((select id from products where slug = 'man-city-domicile-26-27'), 'L', 'Bleu ciel', 'أزرق سماوي', 'MCI-HOME-2627-L', 3),
  ((select id from products where slug = 'man-city-domicile-26-27'), 'XL', 'Bleu ciel', 'أزرق سماوي', 'MCI-HOME-2627-XL', 2),
  ((select id from products where slug = 'man-city-domicile-26-27'), 'XXL', 'Bleu ciel', 'أزرق سماوي', 'MCI-HOME-2627-XXL', 2)
on conflict (sku) do nothing;

-- ----------------------------------------------------------------------------
-- 23. SEED — images produits (vignettes)
-- ----------------------------------------------------------------------------
insert into product_images (product_id, url, alt_fr, position, is_primary) values
  ((select id from products where slug = 'liverpool-domicile-26-27'),
   'https://images.pexels.com/photos/30314840/pexels-photo-30314840.jpeg?auto=compress&cs=tinysrgb&w=900',
   'Maillot Liverpool 26/27', 0, true),
  ((select id from products where slug = 'man-united-domicile-26-27'),
   'https://images.pexels.com/photos/37702263/pexels-photo-37702263.jpeg?auto=compress&cs=tinysrgb&w=900',
   'Maillot Man United 26/27', 0, true),
  ((select id from products where slug = 'arsenal-domicile-26-27'),
   'https://images.pexels.com/photos/15837447/pexels-photo-15837447.jpeg?auto=compress&cs=tinysrgb&w=900',
   'Maillot Arsenal 26/27', 0, true),
  ((select id from products where slug = 'man-city-domicile-26-27'),
   'https://images.pexels.com/photos/37331795/pexels-photo-37331795.jpeg?auto=compress&cs=tinysrgb&w=900',
   'Maillot Man City 26/27', 0, true)
on conflict (product_id, url) do nothing;

-- ----------------------------------------------------------------------------
-- 24. SEED — promos
-- ----------------------------------------------------------------------------
insert into promos (code, title_fr, title_ar, type, value, min_order, max_uses) values
  ('HIVER20', 'Promo hiver -20%', 'تخفيض الشتاء 20-', 'percent', 20, 5000, 500),
  ('BIENVENUE10', 'Bienvenue -10%', 'مرحبا 10-', 'percent', 10, 2000, 0),
  ('PACK500', 'Pack -500 DA', 'تخفيض 500 دج', 'fixed', 500, 10000, 200)
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- 25. SEED — paramètres du site (l admin contrôle tous les textes)
-- ----------------------------------------------------------------------------
insert into site_settings (key, value, value_ar, description) values
  ('hero_title', 'HABILLES-TOI COMME UN CHAMPION', 'البس كي الأبطال', 'Grand titre page accueil'),
  ('hero_subtitle', 'Maillots Premier League 26/27 — qualité haute, prix ruisseau.',
   'قمصان الدوري الإنجليزي 26/27 — جودة عالية، سعر روسو.', 'Sous-titre accueil'),
  ('promo_banner', 'PROMO HIVER -20% sur les survêtements — Livraison 58 wilayas',
   'تخفيض الشتاء 20- على البدلات — التوصيل 58 ولاية', 'Bandeau rouge en haut du site'),
  ('whatsapp_number', 'https://wa.me/213550000000', null, 'Lien WhatsApp (contact + notifications)'),
  ('phone_display', '+213 550 00 00 00', null, 'Téléphone affiché (footer, magasin)'),
  ('address_fr', 'Rue Abderahmane Boulouah, Mohamed Belouizdad, Alger 16009', null, 'Adresse magasin (FR)'),
  ('address_ar', 'شارع عبد الرحمان بولواه، محمد بلوزداد، الجزائر', null, 'Adresse magasin (AR)'),
  ('hours_fr', 'Sam – Jeu : 09:00 → 20:00 • Ven : 14:00 → 20:00', null, 'Horaires (FR)'),
  ('hours_ar', 'السبت – الخميس: 09:00 → 20:00 • الجمعة: 14:00 → 20:00', null, 'Horaires (AR)'),
  ('tiktok_url', 'https://www.tiktok.com/@bon_prix_ruisseau_sports', null, 'Lien TikTok'),
  ('instagram_url', 'https://www.instagram.com/bon_prix_ruisseau/', null, 'Lien Instagram'),
  ('facebook_url', 'https://www.facebook.com/bonprixruisseau/', null, 'Lien Facebook'),
  ('flocage_player_price', '500', '500', 'Prix flocage joueur ⭐ (DA)'),
  ('flocage_custom_price', '800', '800', 'Prix flocage nom perso ✍ (DA)'),
  ('exchange_policy', 'Échange sous 7 jours au magasin Ruisseau', 'التبديل خلال 7 أيام في المحل',
   'Politique échange/retour affichée au panier')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- 26. VÉRIFICATION (résultat visible dans le SQL Editor)
-- ----------------------------------------------------------------------------
select 'wilayas' as table_name, count(*) as lignes from wilayas
union all select 'categories', count(*) from categories
union all select 'products', count(*) from products
union all select 'product_variants', count(*) from product_variants
union all select 'product_images', count(*) from product_images
union all select 'promos', count(*) from promos
union all select 'site_settings', count(*) from site_settings;
