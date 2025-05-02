-- ajoute juste les nouvelles valeurs si elles n'existent pas déjà
ALTER TYPE chat_event_kind ADD VALUE IF NOT EXISTS 'appointment_requested';
ALTER TYPE chat_event_kind ADD VALUE IF NOT EXISTS 'appointment_confirmed';
ALTER TYPE chat_event_kind ADD VALUE IF NOT EXISTS 'appointment_cancelled';
