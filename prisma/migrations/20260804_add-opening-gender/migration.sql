-- Non-destructive migration: add nullable genderPreference to CompanyOpening
ALTER TABLE "CompanyOpening" ADD COLUMN IF NOT EXISTS "genderPreference" text;
