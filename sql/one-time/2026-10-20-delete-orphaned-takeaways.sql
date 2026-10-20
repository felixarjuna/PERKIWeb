-- One-time cleanup before migration 0007 (takeaways.scheduleId → schedules.id FK).
-- Run once against production BEFORE `pnpm db:migrate`; the FK cannot be added
-- while takeaways reference schedules that no longer exist.
--
-- Found on 2026-10-20: takeaways 3 and 4 (created 2025-04-06, test content),
-- pointing at deleted schedules 3 and 2. No duplicate profiles were found, so
-- the profiles.userId unique constraint needs no cleanup.

BEGIN;

-- Preview: should list exactly the orphans above.
SELECT t.id, t."scheduleId", t."createdAt", left(t.keypoints, 60) AS preview
FROM takeaways t
WHERE NOT EXISTS (SELECT 1 FROM schedules s WHERE s.id = t."scheduleId");

DELETE FROM takeaways t
WHERE NOT EXISTS (SELECT 1 FROM schedules s WHERE s.id = t."scheduleId");

COMMIT;
