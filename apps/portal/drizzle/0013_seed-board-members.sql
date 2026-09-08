-- Seeds the Board Members, grants Board authority, and grants USSTM Club Access in USSTM Portal.

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
  "lifecycle" = 'active'::member_lifecycle,
  "updated_at" = NOW();

-- 2. Insert or update board_members mapping
INSERT INTO "board_members" ("member_id", "board_position")
SELECT m.id, v.pos
FROM (VALUES
  ('president@usstm.ca', 'President'),
  ('vp.operations@usstm.ca', 'VP Operations'),
  ('vp.finance@usstm.ca', 'VP Finance'),
  ('vp.communications@usstm.ca', 'VP Communications'),
  ('vp.events@usstm.ca', 'VP Student Life'),
  ('vp.academic@usstm.ca', 'VP Academic'),
  ('vp.external@usstm.ca', 'VP External'),
  ('vp.equity@usstm.ca', 'VP Equity'),
  ('ava.currie@torontomu.ca', 'Biomedical Sciences Director'),
  ('zainab.kashif@torontomu.ca', 'Biomedical Sciences Director'),
  ('rameen1.hussain@torontomu.ca', 'Biology Director'),
  ('tashmia.iftakhar@torontomu.ca', 'Chemistry Director'),
  ('amitoz.banga@torontomu.ca', 'Computer Science Director'),
  ('ayu.gupta@torontomu.ca', 'Computer Science Director'),
  ('nabaha.syed@torontomu.ca', 'Computer Science Director'),
  ('pranavi.landeri@torontomu.ca', 'Computer Science Director'),
  ('avitiello@torontomu.ca', 'Math & Its Applications Director'),
  ('morty.sadeh@torontomu.ca', 'Financial Math Director'),
  ('umaima.khan@torontomu.ca', 'Medical Physics Director'),
  ('pwettlaufer@torontomu.ca', 'Manager'),
  ('dgavrusenko@torontomu.ca', 'Chairperson'),
  ('iman.memon@torontomu.ca', 'Secretary'),
  ('secretary@usstm.ca', 'Secretary'),
  ('khansa.sayyada@torontomu.ca', 'International Commissioner'),
  ('maruf.ahmed@torontomu.ca', 'Tech Manager')
) AS v(email, pos)
JOIN "members" m ON LOWER(TRIM(m.email)) = LOWER(TRIM(v.email))
ON CONFLICT ("member_id") DO UPDATE SET
  "board_position" = EXCLUDED."board_position";

-- 3. Grant access to the USSTM Club for all board members
INSERT INTO "club_access" ("member_id", "club_id")
SELECT DISTINCT m.id, c.id
FROM "members" m
CROSS JOIN "clubs" c
WHERE c.short_name = 'USSTM'
  AND LOWER(TRIM(m.email)) IN (
    'president@usstm.ca',
    'vp.operations@usstm.ca',
    'vp.finance@usstm.ca',
    'vp.communications@usstm.ca',
    'vp.events@usstm.ca',
    'vp.academic@usstm.ca',
    'vp.external@usstm.ca',
    'vp.equity@usstm.ca',
    'ava.currie@torontomu.ca',
    'zainab.kashif@torontomu.ca',
    'rameen1.hussain@torontomu.ca',
    'tashmia.iftakhar@torontomu.ca',
    'amitoz.banga@torontomu.ca',
    'ayu.gupta@torontomu.ca',
    'nabaha.syed@torontomu.ca',
    'pranavi.landeri@torontomu.ca',
    'avitiello@torontomu.ca',
    'morty.sadeh@torontomu.ca',
    'umaima.khan@torontomu.ca',
    'pwettlaufer@torontomu.ca',
    'dgavrusenko@torontomu.ca',
    'iman.memon@torontomu.ca',
    'secretary@usstm.ca',
    'khansa.sayyada@torontomu.ca',
    'maruf.ahmed@torontomu.ca'
  )
ON CONFLICT ("member_id", "club_id") DO NOTHING;
