-- Office Hours hasn't launched yet, so there are no real Bookings to preserve.
-- Replaces the 4 two-hour Shift Slots with 8 one-hour Shift Slots covering the
-- same 10:00-18:00 window.
DELETE FROM "shift_slots";

INSERT INTO "shift_slots" ("start_time", "end_time") VALUES
  ('10:00', '11:00'),
  ('11:00', '12:00'),
  ('12:00', '13:00'),
  ('13:00', '14:00'),
  ('14:00', '15:00'),
  ('15:00', '16:00'),
  ('16:00', '17:00'),
  ('17:00', '18:00');
