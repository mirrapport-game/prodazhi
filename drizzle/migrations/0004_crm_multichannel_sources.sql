ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_vk_identity_unique UNIQUE (vk_group_id, vk_user_id);
ALTER TABLE public.crm_contacts ADD COLUMN source text NOT NULL DEFAULT 'telegram';
UPDATE public.crm_contacts SET source = 'vk' WHERE vk_user_id IS NOT NULL;
ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_source_check CHECK (source IN ('telegram', 'vk', 'instagram'));
COMMENT ON COLUMN public.crm_contacts.source IS 'Channel is independent from audience cabinet; Instagram contacts may be entered manually until the Instagram integration is connected.';