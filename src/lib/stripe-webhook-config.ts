export const STRIPE_WEBHOOK_EVENTS = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[number]

export interface WebhookConfig {
  url: string
  events: StripeWebhookEvent[]
  description: string
}

export const getWebhookConfig = (): WebhookConfig => ({
  url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`,
  events: [...STRIPE_WEBHOOK_EVENTS],
  description: 'Circlo payment and subscription events'
})