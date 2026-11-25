ALTER TABLE public.crm_contacts ADD COLUMN vk_user_id bigint;
ALTER TABLE public.crm_contacts ADD COLUMN vk_group_id bigint;
CREATE UNIQUE INDEX crm_contacts_vk_identity_idx ON public.crm_contacts (vk_group_id, vk_user_id) WHERE vk_user_id IS NOT NULL AND vk_group_id IS NOT NULL;
COMMENT ON COLUMN public.crm_contacts.vk_user_id IS 'VK sender identity, separate from Telegram identity.';
COMMENT ON COLUMN public.crm_contacts.vk_group_id IS 'VK community identity used with vk_user_id to deduplicate incoming CRM contacts.';