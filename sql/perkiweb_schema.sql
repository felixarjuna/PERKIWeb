
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "drizzle";

ALTER SCHEMA "drizzle" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."event_type" AS ENUM (
    'church_service',
    'bible_study'
);

ALTER TYPE "public"."event_type" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    "id" integer NOT NULL,
    "hash" "text" NOT NULL,
    "created_at" bigint
);

ALTER TABLE "drizzle"."__drizzle_migrations" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "drizzle"."__drizzle_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "drizzle"."__drizzle_migrations_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNED BY "drizzle"."__drizzle_migrations"."id";

CREATE TABLE IF NOT EXISTS "public"."account" (
    "userId" "text" NOT NULL,
    "type" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "providerAccountId" "text" NOT NULL,
    "refresh_token" "text",
    "access_token" "text",
    "expires_at" integer,
    "token_type" "text",
    "scope" "text",
    "id_token" "text",
    "session_state" "text"
);

ALTER TABLE "public"."account" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."authenticator" (
    "credentialID" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "providerAccountId" "text" NOT NULL,
    "credentialPublicKey" "text" NOT NULL,
    "counter" integer NOT NULL,
    "credentialDeviceType" "text" NOT NULL,
    "credentialBackedUp" boolean NOT NULL,
    "transports" "text"
);

ALTER TABLE "public"."authenticator" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."prayers" (
    "id" integer NOT NULL,
    "name" "text",
    "content" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "prayerNames" "json" NOT NULL,
    "isAnonymous" boolean DEFAULT false,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."prayers" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."prayers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."prayers_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."prayers_id_seq" OWNED BY "public"."prayers"."id";

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "address" "text",
    "phoneNumber" "text",
    "birthday" timestamp without time zone,
    "location" "text",
    "major" "text",
    "bio" "text",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" integer NOT NULL,
    "title" "text" NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "preacher" "text",
    "bibleVerse" "text" NOT NULL,
    "description" "text" NOT NULL,
    "leader" "text" NOT NULL,
    "musician" "text" NOT NULL,
    "multimedia" "text",
    "accommodation" "text",
    "cookingGroup" "text",
    "cleaningGroup" "text" NOT NULL,
    "type" "public"."event_type" NOT NULL,
    "noteWriter" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."schedules" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."schedules_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."schedules_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."schedules_id_seq" OWNED BY "public"."schedules"."id";

CREATE TABLE IF NOT EXISTS "public"."session" (
    "sessionToken" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "expires" timestamp without time zone NOT NULL
);

ALTER TABLE "public"."session" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."takeaways" (
    "id" integer NOT NULL,
    "scheduleId" integer NOT NULL,
    "keypoints" "text" NOT NULL,
    "contributors" "json" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."takeaways" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."takeaways_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."takeaways_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."takeaways_id_seq" OWNED BY "public"."takeaways"."id";

CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" "text" NOT NULL,
    "name" "text",
    "email" "text",
    "emailVerified" timestamp without time zone,
    "image" "text",
    "hashedPassword" "text",
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "updatedAt" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."user" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."verificationToken" (
    "identifier" "text" NOT NULL,
    "token" "text" NOT NULL,
    "expires" timestamp without time zone NOT NULL
);

ALTER TABLE "public"."verificationToken" OWNER TO "postgres";

ALTER TABLE ONLY "drizzle"."__drizzle_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"drizzle"."__drizzle_migrations_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."prayers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."prayers_id_seq"'::"regclass");

ALTER TABLE ONLY "drizzle"."__drizzle_migrations"
    ADD CONSTRAINT "__drizzle_migrations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY ("provider", "providerAccountId");

ALTER TABLE ONLY "public"."authenticator"
    ADD CONSTRAINT "authenticator_credentialID_unique" UNIQUE ("credentialID");

ALTER TABLE ONLY "public"."authenticator"
    ADD CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY ("userId", "credentialID");

ALTER TABLE ONLY "public"."prayers"
    ADD CONSTRAINT "idx_28792_PRIMARY" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "idx_28801_PRIMARY" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "idx_28807_PRIMARY" PRIMARY KEY ("sessionToken");

ALTER TABLE ONLY "public"."takeaways"
    ADD CONSTRAINT "idx_28813_PRIMARY" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "idx_28826_PRIMARY" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "userInfo_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_email_unique" UNIQUE ("email");

ALTER TABLE ONLY "public"."verificationToken"
    ADD CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY ("identifier", "token");

ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."authenticator"
    ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."prayers";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "public"."account" TO "anon";
GRANT ALL ON TABLE "public"."account" TO "authenticated";
GRANT ALL ON TABLE "public"."account" TO "service_role";

GRANT ALL ON TABLE "public"."authenticator" TO "anon";
GRANT ALL ON TABLE "public"."authenticator" TO "authenticated";
GRANT ALL ON TABLE "public"."authenticator" TO "service_role";

GRANT ALL ON TABLE "public"."prayers" TO "anon";
GRANT ALL ON TABLE "public"."prayers" TO "authenticated";
GRANT ALL ON TABLE "public"."prayers" TO "service_role";

GRANT ALL ON SEQUENCE "public"."prayers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."prayers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."prayers_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";

GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."session" TO "anon";
GRANT ALL ON TABLE "public"."session" TO "authenticated";
GRANT ALL ON TABLE "public"."session" TO "service_role";

GRANT ALL ON TABLE "public"."takeaways" TO "anon";
GRANT ALL ON TABLE "public"."takeaways" TO "authenticated";
GRANT ALL ON TABLE "public"."takeaways" TO "service_role";

GRANT ALL ON SEQUENCE "public"."takeaways_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."takeaways_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."takeaways_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";

GRANT ALL ON TABLE "public"."verificationToken" TO "anon";
GRANT ALL ON TABLE "public"."verificationToken" TO "authenticated";
GRANT ALL ON TABLE "public"."verificationToken" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
