-- Rename the actor-profile schema to the explore-profile schema without losing data.
-- The guards make this safe to run again on subsequent deployments.
DO $$
BEGIN
  IF to_regclass('public."ActorProfile"') IS NOT NULL
     AND to_regclass('public."ExploreProfile"') IS NULL THEN
    ALTER TABLE "ActorProfile" RENAME TO "ExploreProfile";
  END IF;

  IF to_regclass('public."ActorLanguage"') IS NOT NULL
     AND to_regclass('public."ExploreLanguage"') IS NULL THEN
    ALTER TABLE "ActorLanguage" RENAME TO "ExploreLanguage";
  END IF;

  IF to_regclass('public."FilmCredit"') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'FilmCredit' AND column_name = 'actorProfileId'
     )
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'FilmCredit' AND column_name = 'exploreProfileId'
     ) THEN
    ALTER TABLE "FilmCredit" RENAME COLUMN "actorProfileId" TO "exploreProfileId";
  END IF;

  IF to_regclass('public."ExploreLanguage"') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'ExploreLanguage' AND column_name = 'actorProfileId'
     )
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'ExploreLanguage' AND column_name = 'exploreProfileId'
     ) THEN
    ALTER TABLE "ExploreLanguage" RENAME COLUMN "actorProfileId" TO "exploreProfileId";
  END IF;
END $$;
