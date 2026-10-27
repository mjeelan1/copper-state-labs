-- Seed data from the Product Bible, Section 10. Safe to run more than once.

insert into products (product, type, price_usd, battery, launch_date, warranty_years, ai_mode) values
  ('Copper Home', 'AI smart speaker', 149, 'Plug-in', '2024-04-16', 2, 'Hybrid: on-device + Raw Ore; Refined with Copper Plus'),
  ('Copper Notes', 'AI clip-on recorder', 129, '12 hrs recording / 7 days standby', '2025-01-21', 1, 'On-device transcription + Raw Ore summaries; Refined long-form with Copper Plus')
on conflict (product) do nothing;

insert into plans (plan, monthly_usd, annual_usd, memory_days, recording_days, notes_hours_per_month, refined_tier) values
  ('Free', 0, 0, 30, 30, '10', false),
  ('Copper Plus', 7.99, 79, 365, 365, 'Unlimited', true)
on conflict (plan) do nothing;

insert into assistant_versions (product, current_version, release_date) values
  ('Copper Home', '2.3', '2026-03-17'),
  ('Copper Notes', '2.3', '2026-03-17')
on conflict (product) do nothing;

insert into ai_tiers (tier, runs_on, cost_per_request_usd, cost_per_summary_usd, available_on) values
  ('On-device', 'Device', 0.000, 0.000, 'Free, Copper Plus'),
  ('Raw Ore', 'Copper Cloud', 0.002, 0.004, 'Free, Copper Plus'),
  ('Refined', 'Copper Cloud (frontier models)', 0.020, 0.030, 'Copper Plus only')
on conflict (tier) do nothing;
