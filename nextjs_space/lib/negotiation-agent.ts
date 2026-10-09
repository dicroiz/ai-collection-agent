interface ConversationMessage {
  role: string
  content: string
  timestamp?: string
}

interface DebtorContext {
  name: string
  debtAmount: number
  dueDate: string
}

export function buildSystemPrompt(debtor: DebtorContext): string {
  return `Você é Ana, uma especialista em negociação de dívidas. Você trabalha para uma empresa de cobranças e está entrando em contato com devedores para negociar o pagamento de dívidas pendentes.

## Informações do Devedor
- Nome: ${debtor.name}
- Valor da dívida: R$ ${debtor.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Data de vencimento: ${debtor.dueDate}

## Diretrizes de Comportamento
1. **Tom**: Profissional, empática, firme mas nunca agressiva
2. **Idioma**: Sempre responda em Português Brasileiro (pt-BR)
3. **Objetivo**: Negociar o pagamento da dívida
4. **Opções de pagamento** que você pode oferecer:
   - Pagamento à vista (com possível desconto de até 15%)
   - Parcelamento em 2x sem juros
   - Parcelamento em 3x com juros mínimos
5. **Nunca** invente informações que não possui
6. **Nunca** faça ameaças ou use linguagem agressiva
7. **Se o devedor ficar hostil**: mantenha a calma, agradeça pelo tempo e informe que entrará em contato novamente
8. **Se o devedor concordar com um plano**: confirme os detalhes, peça uma data de compromisso para o primeiro pagamento
9. **Mantenha as respostas curtas e diretas** — máximo 2-3 frases por mensagem
10. **Sempre se apresente como Ana** na primeira mensagem da conversa`
}

export function buildMessages(
  debtor: DebtorContext,
  conversationHistory: ConversationMessage[],
  newMessage: string
): Array<{ role: string; content: string }> {
  const systemPrompt = buildSystemPrompt(debtor)
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]

  // Add conversation history
  for (const msg of conversationHistory ?? []) {
    messages.push({
      role: msg?.role === 'assistant' ? 'assistant' : 'user',
      content: msg?.content ?? '',
    })
  }

  // Add new user message
  messages.push({ role: 'user', content: newMessage })

  return messages
}

export async function getAgentReply(
  debtor: DebtorContext,
  conversationHistory: ConversationMessage[],
  newMessage: string
): Promise<{ success: boolean; reply?: string; error?: string }> {
  const apiKey = process.env.ABACUSAI_API_KEY
  if (!apiKey) {
    return { success: false, error: 'ABACUSAI_API_KEY not configured' }
  }

  const messages = buildMessages(debtor, conversationHistory, newMessage)

  try {
    const res = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages,
        max_tokens: 500,
        temperature: 0.4,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return {
        success: false,
        error: `LLM API error ${res.status}: ${(errorData as any)?.error?.message ?? 'Unknown'}`,
      }
    }

    const data = await res.json()
    const reply = (data as any)?.choices?.[0]?.message?.content ?? ''

    if (!reply) {
      return { success: false, error: 'LLM returned empty reply' }
    }

    return { success: true, reply }
  } catch (err: any) {
    return {
      success: false,
      error: `LLM request failed: ${err?.message ?? 'Unknown error'}`,
    }
  }
}
