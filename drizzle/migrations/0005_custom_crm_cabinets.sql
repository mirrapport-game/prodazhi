CREATE TABLE public.crm_cabinets (id text PRIMARY KEY, name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100), purpose text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_cabinets TO authenticated;
GRANT ALL ON public.crm_cabinets TO service_role;
ALTER TABLE public.crm_cabinets ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_crm_cabinets ON public.crm_cabinets FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
ALTER TABLE public.crm_contacts ADD COLUMN audience_id text REFERENCES public.crm_cabinets(id);
COMMENT ON COLUMN public.crm_contacts.cabinet IS 'DEPRECATED: replaced by audience_id referencing owner-managed crm_cabinets.';