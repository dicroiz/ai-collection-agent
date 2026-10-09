const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0'

function isSet(val: string | undefined): boolean {
  return !!val && val !== 'not_configured'
}

export function isWhatsAppConfigured(): boolean {
  return (
    isSet(process.env.META_WHATSAPP_PHONE_NUMBER_ID) &&
    isSet(process.env.META_WHATSAPP_ACCESS_TOKEN)
  )
}

export function getMissingWhatsAppKeys(): string[] {
  const missing: string[] = []
  if (!process.env.META_WHATSAPP_PHONE_NUMBER_ID) missing.push('META_WHATSAPP_PHONE_NUMBER_ID')
  if (!process.env.META_WHATSAPP_ACCESS_TOKEN) missing.push('META_WHATSAPP_ACCESS_TOKEN')
  return missing
}

export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    return {
      success: false,
      error: `WhatsApp API not configured. Missing: ${getMissingWhatsAppKeys().join(', ')}`,
    }
  }

  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN

  try {
    const res = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/\D/g, ''),
          type: 'text',
          text: { body: message },
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error: data?.error?.message ?? `WhatsApp API error: ${res.status}`,
      }
    }

    return {
      success: true,
      messageId: data?.messages?.[0]?.id ?? undefined,
    }
  } catch (err: any) {
    return {
      success: false,
      error: `WhatsApp request failed: ${err?.message ?? 'Unknown error'}`,
    }
  }
}
