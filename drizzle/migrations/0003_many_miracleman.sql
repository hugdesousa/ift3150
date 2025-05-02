-- 1) on bascule temporairement en text (déjà fait)
ALTER TABLE "chat_events" ALTER COLUMN "kind" SET DATA TYPE text;

-- → ICI
UPDATE "chat_events"
SET "kind" = 'appointment_requested'
WHERE "kind" = 'appointment';

-- 2) on peut maintenant recréer l'énum élargie
DROP TYPE "public"."chat_event_kind";
CREATE TYPE "public"."chat_event_kind" AS ENUM(
  'appointment_requested',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_completed',
  'review_added'
);

-- 3) on recaste la colonne sans erreur
ALTER TABLE "chat_events" ALTER COLUMN "kind"
    SET DATA TYPE "public"."chat_event_kind" USING "kind"::"public"."chat_event_kind";
