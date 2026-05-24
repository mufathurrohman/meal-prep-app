-- ============================================================
-- MEAL PREP APP — Supabase Schema + Seed Data
-- Run this in the Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────

create table recipes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('main', 'snack')),
  current_version_id uuid,
  rating text check (rating in ('will-eat-again', 'need-to-modify', 'not-recommended')),
  calories_per_portion numeric,
  protein_grams numeric,
  carbs_grams numeric,
  fat_grams numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table recipe_versions (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  version_number integer not null,
  ingredients jsonb not null default '[]',
  cooking_steps jsonb not null default '[]',
  portion_yield integer not null default 4,
  change_description text,
  created_at timestamptz not null default now()
);

alter table recipes
  add constraint fk_current_version
  foreign key (current_version_id)
  references recipe_versions(id)
  on delete set null;

create table recipe_comments (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table weekly_plans (
  id uuid primary key default uuid_generate_v4(),
  week_label text not null unique,
  week_note text,
  created_at timestamptz not null default now()
);

create table meal_slots (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references weekly_plans(id) on delete cascade,
  day text not null check (day in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  slot_type text not null check (slot_type in ('breakfast','morning-snack','lunch','afternoon-snack','dinner','evening-snack')),
  recipe_id uuid references recipes(id) on delete set null,
  portion_count integer
);

create table ai_suggestions (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  suggestion text not null,
  rationale text not null,
  suggested_changes jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_recipe_versions_recipe on recipe_versions(recipe_id);
create index idx_recipe_comments_recipe on recipe_comments(recipe_id);
create index idx_meal_slots_plan on meal_slots(plan_id);
create index idx_meal_slots_recipe on meal_slots(recipe_id);
create index idx_ai_suggestions_recipe on ai_suggestions(recipe_id);
create index idx_weekly_plans_week on weekly_plans(week_label);

-- ──────────────────────────────────────────
-- SEED DATA
-- ──────────────────────────────────────────

-- Recipes
insert into recipes (id, name, category, rating, calories_per_portion, protein_grams, carbs_grams, fat_grams) values
  ('a1000000-0000-0000-0000-000000000001', 'Garlic Chicken Stir-Fry', 'main', 'will-eat-again', 420, 38, 45, 10),
  ('a1000000-0000-0000-0000-000000000002', 'Turkey Bolognese Pasta', 'main', 'need-to-modify', 480, 32, 55, 12),
  ('a1000000-0000-0000-0000-000000000003', 'Red Lentil & Sweet Potato Soup', 'main', 'will-eat-again', 310, 14, 48, 8),
  ('a1000000-0000-0000-0000-000000000004', 'Peanut Butter Overnight Oats', 'main', 'will-eat-again', 380, 16, 52, 13),
  ('a1000000-0000-0000-0000-000000000005', 'Homemade Trail Mix', 'snack', 'will-eat-again', 195, 6, 15, 13),
  ('a1000000-0000-0000-0000-000000000006', 'Date & Oat Energy Balls', 'snack', null, 120, 3, 18, 5);

-- Chicken Stir-Fry v1 (historical)
insert into recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield) values (
  'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1,
  '[{"name":"chicken breast","quantity":600,"unit":"g"},{"name":"broccoli florets","quantity":300,"unit":"g"},{"name":"bell pepper (red)","quantity":2,"unit":"pcs"},{"name":"garlic cloves","quantity":3,"unit":"pcs"},{"name":"soy sauce","quantity":3,"unit":"tbsp"},{"name":"sesame oil","quantity":1,"unit":"tbsp"},{"name":"oyster sauce","quantity":2,"unit":"tbsp"},{"name":"cornstarch","quantity":1,"unit":"tbsp"},{"name":"jasmine rice","quantity":400,"unit":"g"},{"name":"vegetable oil","quantity":2,"unit":"tbsp"}]',
  '[{"order":1,"method":"boil","description":"Cook jasmine rice","durationMinutes":15},{"order":2,"method":"other","description":"Slice chicken, toss with cornstarch and soy sauce","durationMinutes":5},{"order":3,"method":"stir-fry","description":"Sear chicken in hot oil","durationMinutes":5},{"order":4,"method":"stir-fry","description":"Cook vegetables","durationMinutes":3},{"order":5,"method":"sauté","description":"Combine everything with sauces","durationMinutes":2}]',
  5
);

-- Chicken Stir-Fry v2 (current)
insert into recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield, change_description) values (
  'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 2,
  '[{"name":"chicken breast","quantity":600,"unit":"g"},{"name":"broccoli florets","quantity":300,"unit":"g"},{"name":"bell pepper (red)","quantity":2,"unit":"pcs"},{"name":"garlic cloves","quantity":5,"unit":"pcs"},{"name":"soy sauce","quantity":3,"unit":"tbsp"},{"name":"sesame oil","quantity":1,"unit":"tbsp"},{"name":"oyster sauce","quantity":2,"unit":"tbsp"},{"name":"cornstarch","quantity":1,"unit":"tbsp"},{"name":"jasmine rice","quantity":400,"unit":"g"},{"name":"vegetable oil","quantity":2,"unit":"tbsp"}]',
  '[{"order":1,"method":"boil","description":"Cook jasmine rice according to package instructions","durationMinutes":15},{"order":2,"method":"other","description":"Slice chicken into thin strips, toss with cornstarch and 1 tbsp soy sauce","durationMinutes":5},{"order":3,"method":"stir-fry","description":"Heat oil in wok on high heat, sear chicken until golden. Remove and set aside","durationMinutes":5},{"order":4,"method":"stir-fry","description":"In same wok, stir-fry broccoli and bell pepper for 3 minutes until tender-crisp","durationMinutes":3},{"order":5,"method":"sauté","description":"Add garlic, cook 30 seconds. Return chicken, add oyster sauce, remaining soy sauce, and sesame oil. Toss to combine","durationMinutes":2}]',
  5, 'Increased garlic from 3 to 5 cloves for more flavour'
);

-- Turkey Bolognese v1
insert into recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield) values (
  'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 1,
  '[{"name":"ground turkey","quantity":500,"unit":"g"},{"name":"penne pasta","quantity":400,"unit":"g"},{"name":"crushed tomatoes (canned)","quantity":400,"unit":"g"},{"name":"onion (diced)","quantity":1,"unit":"pcs"},{"name":"carrot (grated)","quantity":2,"unit":"pcs"},{"name":"celery stalk (diced)","quantity":2,"unit":"pcs"},{"name":"garlic cloves","quantity":3,"unit":"pcs"},{"name":"dried oregano","quantity":1,"unit":"tsp"},{"name":"olive oil","quantity":2,"unit":"tbsp"},{"name":"salt","quantity":1,"unit":"tsp"}]',
  '[{"order":1,"method":"sauté","description":"Heat olive oil, cook onion, carrot, and celery until softened","durationMinutes":7},{"order":2,"method":"sauté","description":"Add garlic, cook for 1 minute until fragrant","durationMinutes":1},{"order":3,"method":"sauté","description":"Add ground turkey, break apart, cook until no longer pink","durationMinutes":8},{"order":4,"method":"simmer","description":"Add crushed tomatoes, oregano, and salt. Simmer on low heat","durationMinutes":25},{"order":5,"method":"boil","description":"Cook penne in salted water until al dente, drain","durationMinutes":10},{"order":6,"method":"other","description":"Toss pasta with sauce. Portion into containers","durationMinutes":3}]',
  5
);

-- Lentil Soup v1
insert into recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield) values (
  'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 1,
  '[{"name":"red lentils","quantity":300,"unit":"g"},{"name":"sweet potato (cubed)","quantity":2,"unit":"pcs"},{"name":"onion (diced)","quantity":1,"unit":"pcs"},{"name":"garlic cloves","quantity":3,"unit":"pcs"},{"name":"vegetable broth","quantity":1,"unit":"l"},{"name":"coconut milk","quantity":200,"unit":"ml"},{"name":"cumin","quantity":1,"unit":"tsp"},{"name":"turmeric","quantity":0.5,"unit":"tsp","isUncommon":true},{"name":"smoked paprika","quantity":1,"unit":"tsp"},{"name":"olive oil","quantity":1,"unit":"tbsp"}]',
  '[{"order":1,"method":"sauté","description":"Cook onion and garlic in olive oil until soft","durationMinutes":5},{"order":2,"method":"sauté","description":"Add cumin, turmeric, and paprika. Stir for 30 seconds","durationMinutes":1},{"order":3,"method":"simmer","description":"Add lentils, sweet potato, and broth. Bring to boil, then simmer until lentils are soft","durationMinutes":25},{"order":4,"method":"other","description":"Blend half the soup for a chunky texture, or fully for smooth. Stir in coconut milk","durationMinutes":3}]',
  6
);

-- Overnight Oats v1
insert into recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield) values (
  'b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000004', 1,
  '[{"name":"rolled oats","quantity":400,"unit":"g"},{"name":"milk (any)","quantity":500,"unit":"ml"},{"name":"Greek yogurt","quantity":250,"unit":"g"},{"name":"peanut butter","quantity":5,"unit":"tbsp"},{"name":"honey","quantity":3,"unit":"tbsp"},{"name":"chia seeds","quantity":3,"unit":"tbsp"},{"name":"banana","quantity":3,"unit":"pcs"}]',
  '[{"order":1,"method":"other","description":"Mix oats, milk, yogurt, peanut butter, honey, and chia seeds in a large bowl","durationMinutes":5},{"order":2,"method":"other","description":"Divide into 5 jars or containers. Slice banana on top","durationMinutes":5},{"order":3,"method":"other","description":"Refrigerate overnight (minimum 4 hours)","durationMinutes":0}]',
  5
);

-- Trail Mix v1
insert into recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield) values (
  'b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 1,
  '[{"name":"almonds","quantity":150,"unit":"g"},{"name":"cashews","quantity":100,"unit":"g"},{"name":"dark chocolate chips","quantity":80,"unit":"g"},{"name":"dried cranberries","quantity":80,"unit":"g"},{"name":"pumpkin seeds","quantity":50,"unit":"g"}]',
  '[{"order":1,"method":"other","description":"Mix all ingredients together in a large bowl","durationMinutes":2},{"order":2,"method":"other","description":"Divide into 10 small bags or containers (about 45g each)","durationMinutes":5}]',
  10
);

-- Energy Balls v1
insert into recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield) values (
  'b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', 1,
  '[{"name":"Medjool dates (pitted)","quantity":200,"unit":"g"},{"name":"rolled oats","quantity":100,"unit":"g"},{"name":"peanut butter","quantity":3,"unit":"tbsp"},{"name":"cocoa powder","quantity":2,"unit":"tbsp"},{"name":"desiccated coconut","quantity":30,"unit":"g"}]',
  '[{"order":1,"method":"other","description":"Blend dates in a food processor until a sticky paste forms","durationMinutes":2},{"order":2,"method":"other","description":"Add oats, peanut butter, and cocoa. Pulse until combined","durationMinutes":2},{"order":3,"method":"other","description":"Roll into small balls (about 20), coat with coconut. Refrigerate for 1 hour","durationMinutes":10}]',
  10
);

-- Link current versions
update recipes set current_version_id = 'b1000000-0000-0000-0000-000000000002' where id = 'a1000000-0000-0000-0000-000000000001';
update recipes set current_version_id = 'b1000000-0000-0000-0000-000000000003' where id = 'a1000000-0000-0000-0000-000000000002';
update recipes set current_version_id = 'b1000000-0000-0000-0000-000000000004' where id = 'a1000000-0000-0000-0000-000000000003';
update recipes set current_version_id = 'b1000000-0000-0000-0000-000000000005' where id = 'a1000000-0000-0000-0000-000000000004';
update recipes set current_version_id = 'b1000000-0000-0000-0000-000000000006' where id = 'a1000000-0000-0000-0000-000000000005';
update recipes set current_version_id = 'b1000000-0000-0000-0000-000000000007' where id = 'a1000000-0000-0000-0000-000000000006';

-- Comments
insert into recipe_comments (recipe_id, text) values
  ('a1000000-0000-0000-0000-000000000001', 'Added more garlic in v2 — much better. Could try adding ginger next time.'),
  ('a1000000-0000-0000-0000-000000000001', 'Freezes well for 5 days. Reheat with a splash of water to keep it moist.'),
  ('a1000000-0000-0000-0000-000000000002', 'Sauce was a bit thin — try adding tomato paste next time for thicker consistency.'),
  ('a1000000-0000-0000-0000-000000000003', 'Great freezer meal. Keeps well for the full week.'),
  ('a1000000-0000-0000-0000-000000000003', 'The turmeric is key — don''t skip it. Order ahead if needed.'),
  ('a1000000-0000-0000-0000-000000000005', 'Easy to make in bulk. Lasts the whole week no problem.');

-- Weekly plan
insert into weekly_plans (id, week_label) values
  ('c1000000-0000-0000-0000-000000000001', '2026-W22');

-- Meal slots
insert into meal_slots (plan_id, day, slot_type, recipe_id, portion_count) values
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'morning-snack', 'a1000000-0000-0000-0000-000000000005', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'lunch', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'afternoon-snack', 'a1000000-0000-0000-0000-000000000006', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'dinner', 'a1000000-0000-0000-0000-000000000003', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'evening-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'morning-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'lunch', 'a1000000-0000-0000-0000-000000000002', 1),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'afternoon-snack', 'a1000000-0000-0000-0000-000000000005', 1),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'dinner', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'evening-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'morning-snack', 'a1000000-0000-0000-0000-000000000006', 1),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'lunch', 'a1000000-0000-0000-0000-000000000003', 1),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'afternoon-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'dinner', 'a1000000-0000-0000-0000-000000000002', 1),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'evening-snack', 'a1000000-0000-0000-0000-000000000005', 1),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'morning-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'lunch', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'afternoon-snack', 'a1000000-0000-0000-0000-000000000006', 1),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'dinner', 'a1000000-0000-0000-0000-000000000003', 1),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'evening-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'morning-snack', 'a1000000-0000-0000-0000-000000000005', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'lunch', 'a1000000-0000-0000-0000-000000000002', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'afternoon-snack', 'a1000000-0000-0000-0000-000000000006', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'dinner', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'evening-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'breakfast', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'morning-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'lunch', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'afternoon-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'dinner', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'evening-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'breakfast', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'morning-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'lunch', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'afternoon-snack', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'dinner', null, null),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'evening-snack', null, null);
