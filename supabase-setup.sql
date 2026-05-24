-- ============================================================
-- Meal Prep App — Supabase Schema + Seed Data
-- Run this in the Supabase SQL Editor (one-time setup)
-- ============================================================

-- ── Enable UUID extension ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tables ──

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('main', 'snack')),
  current_version_id UUID,  -- FK added after recipe_versions exists
  rating TEXT CHECK (rating IN ('will-eat-again', 'need-to-modify', 'not-recommended')),
  calories_per_portion NUMERIC,
  protein_grams NUMERIC,
  carbs_grams NUMERIC,
  fat_grams NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  cooking_steps JSONB NOT NULL DEFAULT '[]',
  portion_yield INTEGER NOT NULL DEFAULT 4,
  change_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from recipes → recipe_versions now that both tables exist
ALTER TABLE recipes
  ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id) REFERENCES recipe_versions(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS recipe_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_label TEXT NOT NULL UNIQUE,
  week_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  slot_type TEXT NOT NULL CHECK (slot_type IN ('breakfast','morning-snack','lunch','afternoon-snack','dinner','evening-snack')),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  portion_count INTEGER
);

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  rationale TEXT NOT NULL,
  suggested_changes JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──

CREATE INDEX IF NOT EXISTS idx_recipe_versions_recipe ON recipe_versions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe ON recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_slots_plan ON meal_slots(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_slots_recipe ON meal_slots(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_recipe ON ai_suggestions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_week ON weekly_plans(week_label);

-- ── RLS Policies (allow all for anon key — tighten for production) ──

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON recipe_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON recipe_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON weekly_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON meal_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON ai_suggestions FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- SEED DATA
-- ============================================================

-- ── Recipe: Garlic Chicken Stir-Fry ──

INSERT INTO recipes (id, name, category, rating, calories_per_portion, protein_grams, carbs_grams, fat_grams)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Garlic Chicken Stir-Fry',
  'main',
  'will-eat-again',
  420, 38, 45, 10
);

-- v1 (history)
INSERT INTO recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield, change_description)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  1,
  '[
    {"id":"i01","name":"chicken breast","quantity":600,"unit":"g"},
    {"id":"i02","name":"broccoli florets","quantity":300,"unit":"g"},
    {"id":"i03","name":"bell pepper (red)","quantity":2,"unit":"pcs"},
    {"id":"i04","name":"garlic cloves","quantity":3,"unit":"pcs"},
    {"id":"i05","name":"soy sauce","quantity":3,"unit":"tbsp"},
    {"id":"i06","name":"sesame oil","quantity":1,"unit":"tbsp"},
    {"id":"i07","name":"oyster sauce","quantity":2,"unit":"tbsp"},
    {"id":"i08","name":"cornstarch","quantity":1,"unit":"tbsp"},
    {"id":"i09","name":"jasmine rice","quantity":400,"unit":"g"},
    {"id":"i10","name":"vegetable oil","quantity":2,"unit":"tbsp"}
  ]'::jsonb,
  '[
    {"id":"s01","order":1,"method":"boil","description":"Cook jasmine rice","durationMinutes":15},
    {"id":"s02","order":2,"method":"other","description":"Slice chicken, toss with cornstarch and soy sauce","durationMinutes":5},
    {"id":"s03","order":3,"method":"stir-fry","description":"Sear chicken in hot oil","durationMinutes":5},
    {"id":"s04","order":4,"method":"stir-fry","description":"Cook vegetables","durationMinutes":3},
    {"id":"s05","order":5,"method":"sauté","description":"Combine everything with sauces","durationMinutes":2}
  ]'::jsonb,
  5,
  NULL
);

-- v2 (current)
INSERT INTO recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield, change_description)
VALUES (
  'b1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  2,
  '[
    {"id":"i11","name":"chicken breast","quantity":600,"unit":"g"},
    {"id":"i12","name":"broccoli florets","quantity":300,"unit":"g"},
    {"id":"i13","name":"bell pepper (red)","quantity":2,"unit":"pcs"},
    {"id":"i14","name":"garlic cloves","quantity":5,"unit":"pcs"},
    {"id":"i15","name":"soy sauce","quantity":3,"unit":"tbsp"},
    {"id":"i16","name":"sesame oil","quantity":1,"unit":"tbsp"},
    {"id":"i17","name":"oyster sauce","quantity":2,"unit":"tbsp"},
    {"id":"i18","name":"cornstarch","quantity":1,"unit":"tbsp"},
    {"id":"i19","name":"jasmine rice","quantity":400,"unit":"g"},
    {"id":"i20","name":"vegetable oil","quantity":2,"unit":"tbsp"}
  ]'::jsonb,
  '[
    {"id":"s06","order":1,"method":"boil","description":"Cook jasmine rice according to package instructions","durationMinutes":15},
    {"id":"s07","order":2,"method":"other","description":"Slice chicken into thin strips, toss with cornstarch and 1 tbsp soy sauce","durationMinutes":5},
    {"id":"s08","order":3,"method":"stir-fry","description":"Heat oil in wok on high heat, sear chicken until golden. Remove and set aside","durationMinutes":5},
    {"id":"s09","order":4,"method":"stir-fry","description":"In same wok, stir-fry broccoli and bell pepper for 3 minutes until tender-crisp","durationMinutes":3},
    {"id":"s10","order":5,"method":"sauté","description":"Add garlic, cook 30 seconds. Return chicken, add oyster sauce, remaining soy sauce, and sesame oil. Toss to combine","durationMinutes":2}
  ]'::jsonb,
  5,
  'Increased garlic from 3 to 5 cloves for more flavour'
);

UPDATE recipes SET current_version_id = 'b1000000-0000-0000-0000-000000000002'
WHERE id = 'a1000000-0000-0000-0000-000000000001';

INSERT INTO recipe_comments (recipe_id, text) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Added more garlic in v2 — much better. Could try adding ginger next time.'),
  ('a1000000-0000-0000-0000-000000000001', 'Freezes well for 5 days. Reheat with a splash of water to keep it moist.');


-- ── Recipe: Turkey Bolognese Pasta ──

INSERT INTO recipes (id, name, category, rating, calories_per_portion, protein_grams, carbs_grams, fat_grams)
VALUES (
  'a1000000-0000-0000-0000-000000000002',
  'Turkey Bolognese Pasta',
  'main',
  'need-to-modify',
  480, 32, 55, 12
);

INSERT INTO recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield)
VALUES (
  'b1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000002',
  1,
  '[
    {"id":"i21","name":"ground turkey","quantity":500,"unit":"g"},
    {"id":"i22","name":"penne pasta","quantity":400,"unit":"g"},
    {"id":"i23","name":"crushed tomatoes (canned)","quantity":400,"unit":"g"},
    {"id":"i24","name":"onion (diced)","quantity":1,"unit":"pcs"},
    {"id":"i25","name":"carrot (grated)","quantity":2,"unit":"pcs"},
    {"id":"i26","name":"celery stalk (diced)","quantity":2,"unit":"pcs"},
    {"id":"i27","name":"garlic cloves","quantity":3,"unit":"pcs"},
    {"id":"i28","name":"dried oregano","quantity":1,"unit":"tsp"},
    {"id":"i29","name":"olive oil","quantity":2,"unit":"tbsp"},
    {"id":"i30","name":"salt","quantity":1,"unit":"tsp"}
  ]'::jsonb,
  '[
    {"id":"s11","order":1,"method":"sauté","description":"Heat olive oil, cook onion, carrot, and celery until softened","durationMinutes":7},
    {"id":"s12","order":2,"method":"sauté","description":"Add garlic, cook for 1 minute until fragrant","durationMinutes":1},
    {"id":"s13","order":3,"method":"sauté","description":"Add ground turkey, break apart, cook until no longer pink","durationMinutes":8},
    {"id":"s14","order":4,"method":"simmer","description":"Add crushed tomatoes, oregano, and salt. Simmer on low heat","durationMinutes":25},
    {"id":"s15","order":5,"method":"boil","description":"Cook penne in salted water until al dente, drain","durationMinutes":10},
    {"id":"s16","order":6,"method":"other","description":"Toss pasta with sauce. Portion into containers","durationMinutes":3}
  ]'::jsonb,
  5
);

UPDATE recipes SET current_version_id = 'b1000000-0000-0000-0000-000000000003'
WHERE id = 'a1000000-0000-0000-0000-000000000002';

INSERT INTO recipe_comments (recipe_id, text) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Sauce was a bit thin — try adding tomato paste next time for thicker consistency.');


-- ── Recipe: Red Lentil & Sweet Potato Soup ──

INSERT INTO recipes (id, name, category, rating, calories_per_portion, protein_grams, carbs_grams, fat_grams)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'Red Lentil & Sweet Potato Soup',
  'main',
  'will-eat-again',
  310, 14, 48, 8
);

INSERT INTO recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield)
VALUES (
  'b1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000003',
  1,
  '[
    {"id":"i31","name":"red lentils","quantity":300,"unit":"g"},
    {"id":"i32","name":"sweet potato (cubed)","quantity":2,"unit":"pcs"},
    {"id":"i33","name":"onion (diced)","quantity":1,"unit":"pcs"},
    {"id":"i34","name":"garlic cloves","quantity":3,"unit":"pcs"},
    {"id":"i35","name":"vegetable broth","quantity":1,"unit":"l"},
    {"id":"i36","name":"coconut milk","quantity":200,"unit":"ml"},
    {"id":"i37","name":"cumin","quantity":1,"unit":"tsp"},
    {"id":"i38","name":"turmeric","quantity":0.5,"unit":"tsp","isUncommon":true},
    {"id":"i39","name":"smoked paprika","quantity":1,"unit":"tsp"},
    {"id":"i40","name":"olive oil","quantity":1,"unit":"tbsp"}
  ]'::jsonb,
  '[
    {"id":"s17","order":1,"method":"sauté","description":"Cook onion and garlic in olive oil until soft","durationMinutes":5},
    {"id":"s18","order":2,"method":"sauté","description":"Add cumin, turmeric, and paprika. Stir for 30 seconds","durationMinutes":1},
    {"id":"s19","order":3,"method":"simmer","description":"Add lentils, sweet potato, and broth. Bring to boil, then simmer until lentils are soft","durationMinutes":25},
    {"id":"s20","order":4,"method":"other","description":"Blend half the soup for a chunky texture, or fully for smooth. Stir in coconut milk","durationMinutes":3}
  ]'::jsonb,
  6
);

UPDATE recipes SET current_version_id = 'b1000000-0000-0000-0000-000000000004'
WHERE id = 'a1000000-0000-0000-0000-000000000003';

INSERT INTO recipe_comments (recipe_id, text) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Great freezer meal. Keeps well for the full week.'),
  ('a1000000-0000-0000-0000-000000000003', 'The turmeric is key — don''t skip it. Order ahead if needed.');


-- ── Recipe: Peanut Butter Overnight Oats ──

INSERT INTO recipes (id, name, category, rating, calories_per_portion, protein_grams, carbs_grams, fat_grams)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'Peanut Butter Overnight Oats',
  'main',
  'will-eat-again',
  380, 16, 52, 13
);

INSERT INTO recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield)
VALUES (
  'b1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000004',
  1,
  '[
    {"id":"i41","name":"rolled oats","quantity":400,"unit":"g"},
    {"id":"i42","name":"milk (any)","quantity":500,"unit":"ml"},
    {"id":"i43","name":"Greek yogurt","quantity":250,"unit":"g"},
    {"id":"i44","name":"peanut butter","quantity":5,"unit":"tbsp"},
    {"id":"i45","name":"honey","quantity":3,"unit":"tbsp"},
    {"id":"i46","name":"chia seeds","quantity":3,"unit":"tbsp"},
    {"id":"i47","name":"banana","quantity":3,"unit":"pcs"}
  ]'::jsonb,
  '[
    {"id":"s21","order":1,"method":"other","description":"Mix oats, milk, yogurt, peanut butter, honey, and chia seeds in a large bowl","durationMinutes":5},
    {"id":"s22","order":2,"method":"other","description":"Divide into 5 jars or containers. Slice banana on top","durationMinutes":5},
    {"id":"s23","order":3,"method":"other","description":"Refrigerate overnight (minimum 4 hours)","durationMinutes":0}
  ]'::jsonb,
  5
);

UPDATE recipes SET current_version_id = 'b1000000-0000-0000-0000-000000000005'
WHERE id = 'a1000000-0000-0000-0000-000000000004';


-- ── Recipe: Homemade Trail Mix (Snack) ──

INSERT INTO recipes (id, name, category, rating, calories_per_portion, protein_grams, carbs_grams, fat_grams)
VALUES (
  'a1000000-0000-0000-0000-000000000005',
  'Homemade Trail Mix',
  'snack',
  'will-eat-again',
  195, 6, 15, 13
);

INSERT INTO recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield)
VALUES (
  'b1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000005',
  1,
  '[
    {"id":"i48","name":"almonds","quantity":150,"unit":"g"},
    {"id":"i49","name":"cashews","quantity":100,"unit":"g"},
    {"id":"i50","name":"dark chocolate chips","quantity":80,"unit":"g"},
    {"id":"i51","name":"dried cranberries","quantity":80,"unit":"g"},
    {"id":"i52","name":"pumpkin seeds","quantity":50,"unit":"g"}
  ]'::jsonb,
  '[
    {"id":"s24","order":1,"method":"other","description":"Mix all ingredients together in a large bowl","durationMinutes":2},
    {"id":"s25","order":2,"method":"other","description":"Divide into 10 small bags or containers (about 45g each)","durationMinutes":5}
  ]'::jsonb,
  10
);

UPDATE recipes SET current_version_id = 'b1000000-0000-0000-0000-000000000006'
WHERE id = 'a1000000-0000-0000-0000-000000000005';

INSERT INTO recipe_comments (recipe_id, text) VALUES
  ('a1000000-0000-0000-0000-000000000005', 'Easy to make in bulk. Lasts the whole week no problem.');


-- ── Recipe: Date & Oat Energy Balls (Snack) ──

INSERT INTO recipes (id, name, category, rating, calories_per_portion, protein_grams, carbs_grams, fat_grams)
VALUES (
  'a1000000-0000-0000-0000-000000000006',
  'Date & Oat Energy Balls',
  'snack',
  NULL,
  120, 3, 18, 5
);

INSERT INTO recipe_versions (id, recipe_id, version_number, ingredients, cooking_steps, portion_yield)
VALUES (
  'b1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000006',
  1,
  '[
    {"id":"i53","name":"Medjool dates (pitted)","quantity":200,"unit":"g"},
    {"id":"i54","name":"rolled oats","quantity":100,"unit":"g"},
    {"id":"i55","name":"peanut butter","quantity":3,"unit":"tbsp"},
    {"id":"i56","name":"cocoa powder","quantity":2,"unit":"tbsp"},
    {"id":"i57","name":"desiccated coconut","quantity":30,"unit":"g"}
  ]'::jsonb,
  '[
    {"id":"s26","order":1,"method":"other","description":"Blend dates in a food processor until a sticky paste forms","durationMinutes":2},
    {"id":"s27","order":2,"method":"other","description":"Add oats, peanut butter, and cocoa. Pulse until combined","durationMinutes":2},
    {"id":"s28","order":3,"method":"other","description":"Roll into small balls (about 20), coat with coconut. Refrigerate for 1 hour","durationMinutes":10}
  ]'::jsonb,
  10
);

UPDATE recipes SET current_version_id = 'b1000000-0000-0000-0000-000000000007'
WHERE id = 'a1000000-0000-0000-0000-000000000006';


-- ── Weekly Plan (current week placeholder — adjust week_label as needed) ──

INSERT INTO weekly_plans (id, week_label) VALUES
  ('c1000000-0000-0000-0000-000000000001', '2026-W22');

-- Monday
INSERT INTO meal_slots (plan_id, day, slot_type, recipe_id, portion_count) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'morning-snack', 'a1000000-0000-0000-0000-000000000005', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'lunch', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'afternoon-snack', 'a1000000-0000-0000-0000-000000000006', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'dinner', 'a1000000-0000-0000-0000-000000000003', 1),
  ('c1000000-0000-0000-0000-000000000001', 'monday', 'evening-snack', NULL, NULL);

-- Tuesday
INSERT INTO meal_slots (plan_id, day, slot_type, recipe_id, portion_count) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'morning-snack', NULL, NULL),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'lunch', 'a1000000-0000-0000-0000-000000000002', 1),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'afternoon-snack', 'a1000000-0000-0000-0000-000000000005', 1),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'dinner', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000001', 'tuesday', 'evening-snack', NULL, NULL);

-- Wednesday
INSERT INTO meal_slots (plan_id, day, slot_type, recipe_id, portion_count) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'morning-snack', 'a1000000-0000-0000-0000-000000000006', 1),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'lunch', 'a1000000-0000-0000-0000-000000000003', 1),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'afternoon-snack', NULL, NULL),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'dinner', 'a1000000-0000-0000-0000-000000000002', 1),
  ('c1000000-0000-0000-0000-000000000001', 'wednesday', 'evening-snack', 'a1000000-0000-0000-0000-000000000005', 1);

-- Thursday
INSERT INTO meal_slots (plan_id, day, slot_type, recipe_id, portion_count) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'morning-snack', NULL, NULL),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'lunch', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'afternoon-snack', 'a1000000-0000-0000-0000-000000000006', 1),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'dinner', 'a1000000-0000-0000-0000-000000000003', 1),
  ('c1000000-0000-0000-0000-000000000001', 'thursday', 'evening-snack', NULL, NULL);

-- Friday
INSERT INTO meal_slots (plan_id, day, slot_type, recipe_id, portion_count) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'breakfast', 'a1000000-0000-0000-0000-000000000004', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'morning-snack', 'a1000000-0000-0000-0000-000000000005', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'lunch', 'a1000000-0000-0000-0000-000000000002', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'afternoon-snack', 'a1000000-0000-0000-0000-000000000006', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'dinner', 'a1000000-0000-0000-0000-000000000001', 1),
  ('c1000000-0000-0000-0000-000000000001', 'friday', 'evening-snack', NULL, NULL);

-- Saturday & Sunday (empty)
INSERT INTO meal_slots (plan_id, day, slot_type) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'breakfast'),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'morning-snack'),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'lunch'),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'afternoon-snack'),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'dinner'),
  ('c1000000-0000-0000-0000-000000000001', 'saturday', 'evening-snack'),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'breakfast'),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'morning-snack'),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'lunch'),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'afternoon-snack'),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'dinner'),
  ('c1000000-0000-0000-0000-000000000001', 'sunday', 'evening-snack');
