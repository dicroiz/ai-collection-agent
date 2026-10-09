export interface EnvStatus {
  key: string
  label: string
  configured: boolean
}

function isSet(val: string | undefined): boolean {
  return !!val && val !== 'not_configured'
}

export function checkEnvKeys(): EnvStatus[] {
  return [
    {
      key: 'ABACUSAI_API_KEY',
      label: 'LLM API (Abacus AI)',
      configured: isSet(process.env.ABACUSAI_API_KEY),
    },
    {
      key: 'META_WHATSAPP_PHONE_NUMBER_ID',
      label: 'WhatsApp Phone Number ID',
      configured: isSet(process.env.META_WHATSAPP_PHONE_NUMBER_ID),
    },
    {
      key: 'META_WHATSAPP_ACCESS_TOKEN',
      label: 'WhatsApp Access Token',
      configured: isSet(process.env.META_WHATSAPP_ACCESS_TOKEN),
    },
    {
      key: 'META_WHATSAPP_VERIFY_TOKEN',
      label: 'WhatsApp Verify Token',
      configured: isSet(process.env.META_WHATSAPP_VERIFY_TOKEN),
    },
    {
      key: 'VAPI_API_KEY',
      label: 'Vapi.ai API Key',
      configured: isSet(process.env.VAPI_API_KEY),
    },
    {
      key: 'VAPI_ASSISTANT_ID',
      label: 'Vapi.ai Assistant ID',
      configured: isSet(process.env.VAPI_ASSISTANT_ID),
    },
  ]
}

export function getMissingKeys(): string[] {
  return checkEnvKeys()
    .filter((k: EnvStatus) => !k.configured)
    .map((k: EnvStatus) => k.label)
}
