CREATE TABLE public.app_owner (id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), user_id uuid NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.app_owner TO authenticated;
GRANT ALL ON public.app_owner TO service_role;
ALTER TABLE public.app_owner ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_owner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_owner WHERE user_id = auth.uid())
$$;

CREATE POLICY "owner reads owner" ON public.app_owner FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.claim_owner_on_signup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.app_owner (id, user_id) VALUES (1, NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_claim_owner AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.claim_owner_on_signup();

CREATE TABLE public.users (telegram_id bigint PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), pending_edit_meeting uuid);
CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint,
  date date NOT NULL,
  time time,
  with_whom text,
  topic text,
  prepare text,
  raw_text text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed','pending')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meetings_date_idx ON public.meetings(date, time);
CREATE TABLE public.chat_sources (chat_id bigint PRIMARY KEY, title text, type text, added_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  chat_title text,
  chat_type text,
  sender_id bigint,
  sender_name text,
  text text,
  message_link text,
  category text NOT NULL DEFAULT 'normal' CHECK (category IN ('lead','question','important','normal')),
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_created_idx ON public.messages(created_at DESC);
CREATE TABLE public.leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','processed')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.notifications_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text NOT NULL, ref_id text NOT NULL, sent_at timestamptz NOT NULL DEFAULT now(), UNIQUE (type, ref_id));
CREATE TABLE public.telegram_updates (update_id bigint PRIMARY KEY, received_at timestamptz NOT NULL DEFAULT now());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users, public.meetings, public.chat_sources, public.messages, public.leads, public.notifications_log TO authenticated;
GRANT ALL ON public.users, public.meetings, public.chat_sources, public.messages, public.leads, public.notifications_log, public.telegram_updates TO service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner all" ON public.users FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "owner all" ON public.meetings FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "owner all" ON public.chat_sources FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "owner all" ON public.messages FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "owner all" ON public.leads FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "owner all" ON public.notifications_log FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());