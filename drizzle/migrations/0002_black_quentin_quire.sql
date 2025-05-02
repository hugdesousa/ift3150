ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "latitude"  double precision;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "longitude" double precision;

-- ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_unique" UNIQUE("appointment_id");