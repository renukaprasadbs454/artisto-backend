-- Non-destructive migration: add nullable startTime and endTime to CompanyOpening
ALTER TABLE "CompanyOpening" ADD COLUMN IF NOT EXISTS "startTime" timestamptz;
ALTER TABLE "CompanyOpening" ADD COLUMN IF NOT EXISTS "endTime" timestamptz;
