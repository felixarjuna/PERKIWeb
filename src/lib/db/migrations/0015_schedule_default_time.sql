-- Schedules were stored at midnight when no time was entered, so cards showed "00:00".
-- Gatherings start at 15:30 in Aachen; only rows at exactly 00:00 local time change.
UPDATE "schedules"
SET "date" = (("date" AT TIME ZONE 'Europe/Berlin') + interval '15 hours 30 minutes') AT TIME ZONE 'Europe/Berlin'
WHERE ("date" AT TIME ZONE 'Europe/Berlin')::time = '00:00';--> statement-breakpoint
-- Some 2023/2024 schedules were entered from another time zone and landed on the Friday evening
-- before. Gatherings are on Saturdays, so a Friday from 18:00 means the next day: move it to 15:30.
UPDATE "schedules"
SET "date" = (((("date" AT TIME ZONE 'Europe/Berlin')::date + 1) + time '15:30') AT TIME ZONE 'Europe/Berlin')
WHERE extract(isodow FROM ("date" AT TIME ZONE 'Europe/Berlin')) = 5
	AND ("date" AT TIME ZONE 'Europe/Berlin')::time >= '18:00';--> statement-breakpoint
