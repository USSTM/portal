-- Seeds the 7 Course Unions and 29 Student Groups in the USSTM Portal with contact emails where available.
INSERT INTO "clubs" ("short_name", "full_name", "contact_email", "lifecycle", "protected")
VALUES
  -- Course Unions (7)
  ('BCU', 'Biology Course Union', 'biology@torontomu.ca', 'active', false),
  ('BSCU', 'Biomedical Science Course Union', 'biomedcu@torontomu.ca', 'active', false),
  ('CCU', 'Chemistry Course Union', 'chemcu@torontomu.ca', 'active', false),
  ('CSCU', 'Computer Science Course Union', 'ryecscu@gmail.com', 'active', false),
  ('FMCU', 'Financial Mathematics Course Union', 'rfms@torontomu.ca', 'active', false),
  ('MCU', 'Math Course Union', NULL, 'active', false),
  ('MPCU', 'Medical Physics Course Union', 'mphysics@torontomu.ca', 'active', false),

  -- Student Groups (29)
  ('AIMLA', 'Artificial Intelligence Machine Learning Association', NULL, 'active', false),
  ('ArtSci', 'ArtSci', NULL, 'active', false),
  ('AWS', 'AWS Student Builder Group', NULL, 'active', false),
  ('BOSS', 'Black Organization for Science Success', NULL, 'active', false),
  ('BYTE', 'Build Your Technical Experience', NULL, 'active', false),
  ('MGS', 'Metropolitan Game Studios', NULL, 'active', false),
  ('GDGC', 'Google Developer Groups on Campus', NULL, 'active', false),
  ('MHSA', 'Mental Health Science Association', NULL, 'active', false),
  ('M4Y', 'Medicine4Youth', NULL, 'active', false),
  ('PACS', 'Practical Applications of Computer Science', NULL, 'active', false),
  ('PDS', 'PreDental Society', NULL, 'active', false),
  ('PPAC', 'Pre-Physician Assistant Club', NULL, 'active', false),
  ('PVC', 'Pre-Veterinary Club', NULL, 'active', false),
  ('QSEC', 'Quantum Science and Engineering Club', NULL, 'active', false),
  ('RDC', 'Rare Disease Club', NULL, 'active', false),
  ('SBB', 'Science Beyond Barriers', NULL, 'active', false),
  ('SportsMed', 'SportsMed', NULL, 'active', false),
  ('SCC', 'Stem Cell Club', NULL, 'active', false),
  ('SF', 'STEM Fellowship', NULL, 'active', false),
  ('TCSA', 'TorontoMet Cyber Security Association', NULL, 'active', false),
  ('TMR', 'Toronto MetRobotics', NULL, 'active', false),
  ('TMACC', 'Toronto Metropolitan Algorithms and Coding Club', NULL, 'active', false),
  ('Blueprint', 'TMU Blueprint', NULL, 'active', false),
  ('VIRO', 'VIRO', NULL, 'active', false),
  ('V4A', 'Vision4All', NULL, 'active', false),
  ('WiCS', 'Women in Computer Science', NULL, 'active', false),
  ('WiM', 'Women in Math', NULL, 'active', false),
  ('WIS', 'Women in Science', NULL, 'active', false),
  ('TWC', 'Wildlife Club', NULL, 'active', false)
ON CONFLICT ("short_name") DO UPDATE SET
  "full_name" = EXCLUDED."full_name",
  "contact_email" = EXCLUDED."contact_email",
  "updated_at" = NOW();
