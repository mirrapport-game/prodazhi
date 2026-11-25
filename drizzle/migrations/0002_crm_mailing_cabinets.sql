ALTER TABLE public.crm_contacts ADD COLUMN cabinet text DEFAULT NULL;
ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_cabinet_check CHECK (cabinet IS NULL OR cabinet IN ('psychologists', 'beauty_salons', 'medical_clinics', 'singles', 'relationships'));
CREATE INDEX crm_contacts_cabinet_last_contact_idx ON public.crm_contacts (cabinet, last_contact_at DESC);
COMMENT ON COLUMN public.crm_contacts.cabinet IS 'Mailing audience cabinet. NULL means awaiting owner assignment; existing and newly forwarded contacts remain unassigned until selected.';