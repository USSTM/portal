-- Seeds the Board Members and grants Board authority in USSTM Portal.
-- Includes both TMU (@torontomu.ca) and USSTM (@usstm.ca) email addresses for members who possess both,
-- ensuring seamless Single Sign-On regardless of which account they use to authenticate.

WITH member_data (email, display_name, board_position) AS (
  VALUES
    -- Executive Board
    ('president@usstm.ca', 'Muhammad Hanan', 'President'),
    ('vp.operations@usstm.ca', 'Sanjana Bhandari', 'VP Operations'),
    ('vp.finance@usstm.ca', 'Kayra Shivdat', 'VP Finance'),
    ('vp.communications@usstm.ca', 'Karman Khehra', 'VP Communications'),
    ('vp.events@usstm.ca', 'Sudar Thirumugam', 'VP Student Life'),
    ('vp.academic@usstm.ca', 'Saba Shahidi Kasmaei', 'VP Academic'),
    ('vp.external@usstm.ca', 'Tasneem Al-Qazli', 'VP External'),
    ('vp.equity@usstm.ca', 'Vivek Dev Bishal', 'VP Equity'),

    -- Program Directors
    ('ava.currie@torontomu.ca', 'Ava Currie', 'Biomedical Sciences Director'),
    ('zainab.kashif@torontomu.ca', 'Zainab Kashif', 'Biomedical Sciences Director'),
    ('rameen1.hussain@torontomu.ca', 'Rameen Hussain', 'Biology Director'),
    ('tashmia.iftakhar@torontomu.ca', 'Tashmia Iftakhar', 'Chemistry Director'),
    ('amitoz.banga@torontomu.ca', 'Amitoz Banga', 'Computer Science Director'),
    ('ayu.gupta@torontomu.ca', 'Ayu Gupta', 'Computer Science Director'),
    ('nabaha.syed@torontomu.ca', 'Nabaha Syed', 'Computer Science Director'),
    ('pranavi.landeri@torontomu.ca', 'Pranavi Landeri', 'Computer Science Director'),
    ('avitiello@torontomu.ca', 'Alyssa Vitiello', 'Math & Its Applications Director'),
    ('morty.sadeh@torontomu.ca', 'Hermeus Salehi', 'Financial Math Director'),
    ('umaima.khan@torontomu.ca', 'Umaima Khan', 'Medical Physics Director'),

    -- Non-Voting Board Members
    ('pwettlaufer@torontomu.ca', 'Pamela Wettlaufer', 'Manager'),
    ('dgavrusenko@torontomu.ca', 'Damian Gavrusenko', 'Chairperson'),
    ('iman.memon@torontomu.ca', 'Iman Memon', 'Secretary'),
    ('secretary@usstm.ca', 'Iman Memon', 'Secretary'),
    ('khansa.sayyada@torontomu.ca', 'Khansa Mahia Sayyada', 'International Commissioner'),
    ('maruf.ahmed@torontomu.ca', 'Maruf Ahmed', 'Tech Manager')
),
upserted_members AS (
  INSERT INTO "members" ("email", "display_name", "lifecycle")
  SELECT lower(btrim(email)), display_name, 'active'::member_lifecycle
  FROM member_data
  ON CONFLICT ("email") DO UPDATE SET
    "display_name" = EXCLUDED."display_name",
    "lifecycle" = 'active'::member_lifecycle,
    "updated_at" = NOW()
  RETURNING id, email
)
INSERT INTO "board_members" ("member_id", "board_position")
SELECT um.id, md.board_position
FROM upserted_members um
JOIN member_data md ON lower(btrim(md.email)) = um.email
ON CONFLICT ("member_id") DO UPDATE SET
  "board_position" = EXCLUDED."board_position";
