-- drizzle-kit-safe
CREATE TABLE push_tokens (
                             id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                             user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             token         text NOT NULL,
                             created_at    timestamptz DEFAULT now()
);

CREATE TABLE guest_push_tokens (
                                   id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                                   guest_session_id  uuid NOT NULL,
                                   token             text NOT NULL,
                                   created_at        timestamptz DEFAULT now()
);
