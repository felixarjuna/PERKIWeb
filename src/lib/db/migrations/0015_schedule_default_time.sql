-- Schedules were stored at midnight when no time was entered, so cards showed "00:00".
-- Gatherings start at 15:30 in Aachen; only rows at exactly 00:00 local time change.
UPDATE "schedules"
SET "date" = (("date" AT TIME ZONE 'Europe/Berlin') + interval '15 hours 30 minutes') AT TIME ZONE 'Europe/Berlin'
WHERE ("date" AT TIME ZONE 'Europe/Berlin')::time = '00:00';--> statement-breakpoint
