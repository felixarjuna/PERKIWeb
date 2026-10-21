CREATE TABLE "group_members" (
	"groupId" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"userId" text
);
--> statement-breakpoint
CREATE TABLE "group_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"startsOn" date NOT NULL,
	CONSTRAINT "group_terms_startsOn_unique" UNIQUE("startsOn")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"termId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"role" text NOT NULL,
	"scheduleId" integer NOT NULL,
	"userId" text,
	CONSTRAINT "schedule_assignments_role_check" CHECK ("schedule_assignments"."role" in ('preacher', 'leader', 'liturgist', 'musician', 'multimedia', 'accommodation', 'note_writer', 'publication'))
);
--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_termId_group_terms_id_fk" FOREIGN KEY ("termId") REFERENCES "public"."group_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_scheduleId_schedules_id_fk" FOREIGN KEY ("scheduleId") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_group_name" ON "group_members" USING btree ("groupId","name");--> statement-breakpoint
CREATE UNIQUE INDEX "groups_term_name" ON "groups" USING btree ("termId","name");--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_assignments_slot" ON "schedule_assignments" USING btree ("scheduleId","role","position");--> statement-breakpoint
-- Copy every filled slot into schedule_assignments. A name is linked to an account only when exactly one user has that name.
INSERT INTO "schedule_assignments" ("scheduleId", "role", "name", "userId")
SELECT s."id", v."role", btrim(v."name"), (
	SELECT min(u."id") FROM "user" u WHERE lower(u."name") = lower(btrim(v."name")) HAVING count(*) = 1
)
FROM "schedules" s
CROSS JOIN LATERAL (VALUES
	('preacher', s."preacher"),
	(CASE WHEN s."type" = 'church_service' THEN 'liturgist' ELSE 'leader' END, s."leader"),
	('musician', s."musician"),
	('multimedia', s."multimedia"),
	('accommodation', s."accommodation"),
	('note_writer', s."noteWriter")
) AS v("role", "name")
WHERE v."name" IS NOT NULL AND btrim(v."name") NOT IN ('', '-');--> statement-breakpoint
-- The groups from April 2026, as listed on the schedule sheet.
WITH "term" AS (
	INSERT INTO "group_terms" ("startsOn") VALUES ('2026-04-01') RETURNING "id"
), "new_groups" AS (
	INSERT INTO "groups" ("termId", "name")
	SELECT "term"."id", 'Group ' || n FROM "term", generate_series(1, 6) AS n
	RETURNING "id", "name"
)
INSERT INTO "group_members" ("groupId", "name", "position")
SELECT g."id", m."name", m."position"
FROM "new_groups" g
JOIN (VALUES
	('Group 1', 0, 'Wynnona'), ('Group 1', 1, 'Toni'), ('Group 1', 2, 'Wira'), ('Group 1', 3, 'Trevor'), ('Group 1', 4, 'Winston S'), ('Group 1', 5, 'Tius'), ('Group 1', 6, 'Andrew'), ('Group 1', 7, 'Marcelian (Elin)'),
	('Group 2', 0, 'Aldi'), ('Group 2', 1, 'Erico'), ('Group 2', 2, 'Richie'), ('Group 2', 3, 'Nina'), ('Group 2', 4, 'Beatrix'), ('Group 2', 5, 'Jason C.'), ('Group 2', 6, 'Kelly'),
	('Group 3', 0, 'Chen'), ('Group 3', 1, 'Daven'), ('Group 3', 2, 'Steffen'), ('Group 3', 3, 'Rifelo'), ('Group 3', 4, 'Ricky'), ('Group 3', 5, 'Karyn'), ('Group 3', 6, 'Ellaine'),
	('Group 4', 0, 'Victor'), ('Group 4', 1, 'Winston Y'), ('Group 4', 2, 'Stefani'), ('Group 4', 3, 'Deronn'), ('Group 4', 4, 'Billy'), ('Group 4', 5, 'Arian'), ('Group 4', 6, 'Oliver'),
	('Group 5', 0, 'Reggy'), ('Group 5', 1, 'Danny'), ('Group 5', 2, 'Elin'), ('Group 5', 3, 'Vino'), ('Group 5', 4, 'William'), ('Group 5', 5, 'Mary'), ('Group 5', 6, 'Ruth'),
	('Group 6', 0, 'Jco'), ('Group 6', 1, 'Ido'), ('Group 6', 2, 'Boas'), ('Group 6', 3, 'Angel'), ('Group 6', 4, 'Grace'), ('Group 6', 5, 'Felix'), ('Group 6', 6, 'Jonathan T')
) AS m("group", "position", "name") ON m."group" = g."name";--> statement-breakpoint
