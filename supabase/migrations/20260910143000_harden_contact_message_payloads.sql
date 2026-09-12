-- Client-side form validation can be bypassed through the public REST API.
-- These NOT VALID constraints protect every new insert immediately without
-- making deployment depend on whether legacy rows already satisfy the limits.

ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_name_length
    CHECK (char_length(btrim(name)) BETWEEN 2 AND 100) NOT VALID,
  ADD CONSTRAINT contact_messages_email_length
    CHECK (char_length(btrim(email)) BETWEEN 3 AND 255) NOT VALID,
  ADD CONSTRAINT contact_messages_phone_length
    CHECK (phone IS NULL OR char_length(btrim(phone)) <= 30) NOT VALID,
  ADD CONSTRAINT contact_messages_company_name_length
    CHECK (company_name IS NULL OR char_length(btrim(company_name)) <= 150) NOT VALID,
  ADD CONSTRAINT contact_messages_subject_length
    CHECK (char_length(btrim(subject)) BETWEEN 5 AND 200) NOT VALID,
  ADD CONSTRAINT contact_messages_message_length
    CHECK (char_length(btrim(message)) BETWEEN 20 AND 2000) NOT VALID;

COMMENT ON CONSTRAINT contact_messages_message_length ON public.contact_messages IS
  'Server-side payload limit; anti-spam rate limiting remains an Edge Function concern.';
