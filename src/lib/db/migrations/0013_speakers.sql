CREATE TABLE "speakers" (
	"active" boolean DEFAULT true NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"favoriteVerse" text,
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"photoUrl" text,
	"story" text,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "speakers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "schedule_assignments" ADD COLUMN "speakerId" integer;--> statement-breakpoint
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_speakerId_speakers_id_fk" FOREIGN KEY ("speakerId") REFERENCES "public"."speakers"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- The guest pastors from the landing page, with the other spellings used on the schedule sheet.
INSERT INTO "speakers" ("name", "photoUrl", "favoriteVerse", "story", "aliases") VALUES
	('Pdt. John Kusuma', '/images/john.jpg', 'All honor and glory be to the Lord Jesus Christ!', 'John Kusuma was born in Banda Aceh and lived in Methodist Junior High School Banda Aceh until the age of 13, where he completed 1st grade. He then attended Methodist 2 Junior High School and Sutomo High School in Medan. In 1989-1999, he continued his studies in chemical engineering at the Technical University of Berlin. From 1999-2003, he continued his studies at SAAT Malang and did one year of practical service (2003-2004) at Abdiel Christian Church (GKA) Gracia, Surabaya. After that, he served as pastor of the church in the same place from 2004-2011. Since January 2012, he has been serving in Jemaat Kristen Immanuel Berlin (FeG Immanuel Berlin since Sept. 2015) as a pastor and was ordained as a pastor of FeG Immanuel Berlin by the FeG Synod on March 25, 2012.', '{}'::text[]),
	('Pdt. Titus Christanto', '/images/titus.png', 'He who has Jesus has life.', 'Titus Christianto serves at PERKI Aachen every second week of the month. He began his ministry by entering the Southeast Asian Bible Seminary (SAAT). After his studies, he was sent to serve the Pasamuan Urip Anyar Suriname (PUAS) congregation in Pamaribo, Suriname. Here he began his commitment to expand the kingdom of God and in early 2015 he was called to an outreach ministry to the Indonesian Diaspora community in the city of Hamburg, Germany. After receiving his Bachelor of Theology (S.Th) he was ordained as a pastor for FeG Maranatha Hamburg on December 10, 2017.', '{}'::text[]),
	('Ev. Riggruben', '/images/riggrubben.jpg', 'My ministry is of Christ, belongs to Christ, and is for Christ alone. May God be glorified always through my life.', 'When I accepted God''s call as a full-time pastor, I had no idea at the time where I would serve. My prayer was more or less, lead me where God is calling me and give me an obedient heart and strength to live it. Four times I practiced ministry (assigned by SAAT) located in Eastern Indonesia, namely in Palu, Bali, Papua, and Makassar. But this year it feels like the direction of the wind of ministry has changed and pushed my ministry heart to the West. This is where I am anchored, at FeG Immanuel Berlin 
 I completed my bachelor''s degree in Theology at Southeast Asia Bible Seminary in 2019 and continued my post-graduate program in 2020. In my ministry practice, I served for one year at Kalam Kudus Church in Makassar. My ministry is also fully supported by my loving family. My father is a doctor and my mother is a teacher. I am the third of three children, where my older siblings also serve as doctors and servants of God. They also fully support my ministry in this place.', ARRAY['ev riggrubben', 'ev nehemiah riggruben']::text[]);--> statement-breakpoint
-- Point existing preacher slots at their speaker (same normalisation as nameKey()).
UPDATE "schedule_assignments" a
SET "speakerId" = s."id"
FROM "speakers" s
WHERE a."role" = 'preacher'
	AND (btrim(regexp_replace(lower("a"."name"), '[.[:space:]]+', ' ', 'g')) = btrim(regexp_replace(lower(s."name"), '[.[:space:]]+', ' ', 'g'))
		OR btrim(regexp_replace(lower(a."name"), '[.[:space:]]+', ' ', 'g')) = ANY (s."aliases"));--> statement-breakpoint
