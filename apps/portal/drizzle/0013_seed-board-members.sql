-- Seeds the Board Members and grants Board authority in USSTM Portal.

-- 1. Insert or update members
INSERT INTO "members" ("email", "display_name", "lifecycle")
VALUES
  -- Executive Board
  ('president@usstm.ca', 'Muhammad Hanan', 'active'),
  ('vp.operations@usstm.ca', 'Sanjana Bhandari', 'active'),
  ('vp.finance@usstm.ca', 'Kayra Shivdat', 'active'),
  ('vp.communications@usstm.ca', 'Karman Khehra', 'active'),
  ('vp.events@usstm.ca', 'Sudar Thirumugam', 'active'),
  ('vp.academic@usstm.ca', 'Saba Shahidi Kasmaei', 'active'),
  ('vp.external@usstm.ca', 'Tasneem Al-Qazli', 'active'),
  ('vp.equity@usstm.ca', 'Vivek Dev Bishal', 'active'),

  -- Program Directors
  ('ava.currie@torontomu.ca', 'Ava Currie', 'active'),
  ('zainab.kashif@torontomu.ca', 'Zainab Kashif', 'active'),
  ('rameen1.hussain@torontomu.ca', 'Rameen Hussain', 'active'),
  ('tashmia.iftakhar@torontomu.ca', 'Tashmia Iftakhar', 'active'),
  ('amitoz.banga@torontomu.ca', 'Amitoz Banga', 'active'),
  ('ayu.gupta@torontomu.ca', 'Ayu Gupta', 'active'),
  ('nabaha.syed@torontomu.ca', 'Nabaha Syed', 'active'),
  ('pranavi.landeri@torontomu.ca', 'Pranavi Landeri', 'active'),
  ('avitiello@torontomu.ca', 'Alyssa Vitiello', 'active'),
  ('morty.sadeh@torontomu.ca', 'Hermeus Salehi', 'active'),
  ('umaima.khan@torontomu.ca', 'Umaima Khan', 'active'),

  -- Non-Voting Board Members
  ('pwettlaufer@torontomu.ca', 'Pamela Wettlaufer', 'active'),
  ('dgavrusenko@torontomu.ca', 'Damian Gavrusenko', 'active'),
  ('iman.memon@torontomu.ca', 'Iman Memon', 'active'),
  ('secretary@usstm.ca', 'Iman Memon', 'active'),
  ('khansa.sayyada@torontomu.ca', 'Khansa Mahia Sayyada', 'active'),
  ('maruf.ahmed@torontomu.ca', 'Maruf Ahmed', 'active')
ON CONFLICT ("email") DO UPDATE SET
  "display_name" = EXCLUDED."display_name",
  "lifecycle" = 'active',
  "updated_at" = NOW();

-- 2. Insert or update board_members mapping by looking up member IDs directly
INSERT INTO "board_members" ("member_id", "board_position")
SELECT id, 'President' FROM "members" WHERE email = 'president@usstm.ca'
UNION ALL SELECT id, 'VP Operations' FROM "members" WHERE email = 'vp.operations@usstm.ca'
UNION ALL SELECT id, 'VP Finance' FROM "members" WHERE email = 'vp.finance@usstm.ca'
UNION ALL SELECT id, 'VP Communications' FROM "members" WHERE email = 'vp.communications@usstm.ca'
UNION ALL SELECT id, 'VP Student Life' FROM "members" WHERE email = 'vp.events@usstm.ca'
UNION ALL SELECT id, 'VP Academic' FROM "members" WHERE email = 'vp.academic@usstm.ca'
UNION ALL SELECT id, 'VP External' FROM "members" WHERE email = 'vp.external@usstm.ca'
UNION ALL SELECT id, 'VP Equity' FROM "members" WHERE email = 'vp.equity@usstm.ca'
UNION ALL SELECT id, 'Biomedical Sciences Director' FROM "members" WHERE email = 'ava.currie@torontomu.ca'
UNION ALL SELECT id, 'Biomedical Sciences Director' FROM "members" WHERE email = 'zainab.kashif@torontomu.ca'
UNION ALL SELECT id, 'Biology Director' FROM "members" WHERE email = 'rameen1.hussain@torontomu.ca'
UNION ALL SELECT id, 'Chemistry Director' FROM "members" WHERE email = 'tashmia.iftakhar@torontomu.ca'
UNION ALL SELECT id, 'Computer Science Director' FROM "members" WHERE email = 'amitoz.banga@torontomu.ca'
UNION ALL SELECT id, 'Computer Science Director' FROM "members" WHERE email = 'ayu.gupta@torontomu.ca'
UNION ALL SELECT id, 'Computer Science Director' FROM "members" WHERE email = 'nabaha.syed@torontomu.ca'
UNION ALL SELECT id, 'Computer Science Director' FROM "members" WHERE email = 'pranavi.landeri@torontomu.ca'
UNION ALL SELECT id, 'Math & Its Applications Director' FROM "members" WHERE email = 'avitiello@torontomu.ca'
UNION ALL SELECT id, 'Financial Math Director' FROM "members" WHERE email = 'morty.sadeh@torontomu.ca'
UNION ALL SELECT id, 'Medical Physics Director' FROM "members" WHERE email = 'umaima.khan@torontomu.ca'
UNION ALL SELECT id, 'Manager' FROM "members" WHERE email = 'pwettlaufer@torontomu.ca'
UNION ALL SELECT id, 'Chairperson' FROM "members" WHERE email = 'dgavrusenko@torontomu.ca'
UNION ALL SELECT id, 'Secretary' FROM "members" WHERE email = 'iman.memon@torontomu.ca'
UNION ALL SELECT id, 'Secretary' FROM "members" WHERE email = 'secretary@usstm.ca'
UNION ALL SELECT id, 'International Commissioner' FROM "members" WHERE email = 'khansa.sayyada@torontomu.ca'
UNION ALL SELECT id, 'Tech Manager' FROM "members" WHERE email = 'maruf.ahmed@torontomu.ca'
ON CONFLICT ("member_id") DO UPDATE SET
  "board_position" = EXCLUDED."board_position";
