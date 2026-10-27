-- Base schema for the Copper State Labs course app.
-- The four Product Bible tables match Bible Section 10. No row-level security
-- yet: authentication and RLS arrive in a later module.

create extension if not exists vector;

create table if not exists products (
  product text primary key,
  type text not null,
  price_usd numeric(8, 2) not null,
  battery text not null,
  launch_date date not null,
  warranty_years integer not null,
  ai_mode text not null
);

create table if not exists plans (
  plan text primary key,
  monthly_usd numeric(8, 2) not null,
  annual_usd numeric(8, 2) not null,
  memory_days integer not null,
  recording_days integer not null,
  -- Text, because the Copper Plus value is "Unlimited".
  notes_hours_per_month text not null,
  refined_tier boolean not null
);

create table if not exists assistant_versions (
  product text primary key,
  current_version text not null,
  release_date date not null
);

create table if not exists ai_tiers (
  tier text primary key,
  runs_on text not null,
  cost_per_request_usd numeric(6, 3) not null,
  cost_per_summary_usd numeric(6, 3) not null,
  available_on text not null
);

-- One row per model call made through lib/ai/call.ts.
create table if not exists ai_calls (
  id bigint generated always as identity primary key,
  week integer not null,
  feature text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(12, 6),
  latency_ms integer not null,
  ok boolean not null,
  created_at timestamptz not null default now()
);
