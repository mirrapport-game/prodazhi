ALTER TABLE public.messages ADD COLUMN source text NOT NULL DEFAULT 'telegram';
ALTER TABLE public.chat_sources ADD COLUMN source text NOT NULL DEFAULT 'telegram';

CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text,
  telegram_id bigint UNIQUE,
  phone text,
  stage text NOT NULL DEFAULT 'first_touch' CHECK (stage IN ('first_touch','replied','booked','rescheduled','came','bought_5000','bought_game')),
  note text,
  last_message text,
  last_contact_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.crm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('reply','stage','note')),
  text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_events_contact_idx ON public.crm_events(contact_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts, public.crm_events TO authenticated;
GRANT ALL ON public.crm_contacts, public.crm_events TO service_role;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all" ON public.crm_contacts FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "owner all" ON public.crm_events FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());