const VAPI_API_URL = 'https://api.vapi.ai'

function isSet(val: string | undefined): boolean {
  return !!val && val !== 'not_configured'
}

export function isVapiConfigured(): boolean {
  return isSet(process.env.VAPI_API_KEY) && isSet(process.env.VAPI_ASSISTANT_ID)
}

export function getMissingVapiKeys(): string[] {
  const missing: string[] = []
  if (!process.env.VAPI_API_KEY) missing.push('VAPI_API_KEY')
  if (!process.env.VAPI_ASSISTANT_ID) missing.push('VAPI_ASSISTANT_ID')
  return missing
}

interface TriggerCallParams {
  phoneNumber: string
  debtorName: string
  debtAmount: number
  dueDate: string
}

export async function triggerOutboundCall(
  params: TriggerCallParams
): Promise<{ success: boolean; callId?: string; error?: string }> {
  if (!isVapiConfigured()) {
    return {
      success: false,
      error: `Vapi.ai not configured. Missing: ${getMissingVapiKeys().join(', ')}`,
    }
  }

  try {
    const res = await fetch(`${VAPI_API_URL}/call/phone`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: process.env.VAPI_ASSISTANT_ID,
        customer: {
          number: params.phoneNumber.replace(/\D/g, ''),
          numberE164CheckEnabled: false,
        },
        assistantOverrides: {
          variableValues: {
            debtor_name: params.debtorName,
            debt_amount: params.debtAmount.toString(),
            due_date: params.dueDate,
          },
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error: data?.message ?? `Vapi API error: ${res.status}`,
      }
    }

    return {
      success: true,
      callId: data?.id ?? undefined,
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Vapi request failed: ${err?.message ?? 'Unknown error'}`,
    }
  }
}
