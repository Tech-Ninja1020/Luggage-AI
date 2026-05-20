-- Optional seed: default activity templates (user_id null, is_default true).
-- Run after `create_activity_options_table.sql`.
--
-- Note: your schema does not enforce uniqueness on default names. If you run this
-- multiple times, you may create duplicates.

insert into public.activity_options (name, is_default, user_id) values
  ('Beach', true, null),
  ('Swimming', true, null),
  ('Hiking', true, null),
  ('Camping', true, null),
  ('Bicycling', true, null),
  ('Running', true, null),
  ('Gym', true, null),
  ('Yoga', true, null),
  ('Spa', true, null),
  ('Golf', true, null),
  ('Tennis', true, null),
  ('Fishing', true, null),
  ('Surfing', true, null),
  ('Snorkeling', true, null),
  ('Scuba Diving', true, null),
  ('Skiing', true, null),
  ('Snowboarding', true, null),
  ('Business Meeting', true, null),
  ('Conference', true, null),
  ('Remote Work', true, null),
  ('Wedding', true, null),
  ('Formal Dinner', true, null),
  ('Night Out', true, null),
  ('Date Night', true, null),
  ('Party', true, null),
  ('Sightseeing', true, null),
  ('Museum', true, null),
  ('Photography', true, null),
  ('Shopping', true, null),
  ('Food Tour', true, null),
  ('Theme Park', true, null),
  ('Road Trip', true, null),
  ('Cruise', true, null),
  ('Flight', true, null),
  ('Train Travel', true, null),
  ('Long Drive', true, null);
