import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return new Response('Missing signature', { status: 400 })
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return new Response('Server configuration error', { status: 500 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
    }

    console.log(`Processing webhook event: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { metadata } = paymentIntent
    
    if (metadata.booking_id) {
      // Update booking status to confirmed
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.booking_id)

      if (error) {
        console.error('Error updating booking:', error)
        throw error
      }

      console.log(`Booking ${metadata.booking_id} confirmed after successful payment`)
    }

    if (metadata.subscription_type) {
      // Handle subscription payments
      await handleSubscriptionPayment(paymentIntent)
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    throw error
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { metadata } = paymentIntent
    
    if (metadata.booking_id) {
      // Update booking status to payment_failed
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'payment_failed',
          payment_status: 'failed',
          payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.booking_id)

      if (error) {
        console.error('Error updating booking:', error)
        throw error
      }

      console.log(`Booking ${metadata.booking_id} marked as payment failed`)
    }
  } catch (error) {
    console.error('Error handling payment failed:', error)
    throw error
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    
    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
    
    if (!customer.metadata?.user_id) {
      console.error('No user_id found in customer metadata')
      return
    }

    // Create or update subscription record
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: customer.metadata.user_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: subscription.items.data[0]?.price?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating subscription:', error)
      throw error
    }

    console.log(`Subscription created for user ${customer.metadata.user_id}`)
  } catch (error) {
    console.error('Error handling subscription created:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Update subscription record
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: subscription.items.data[0]?.price?.id,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
      throw error
    }

    console.log(`Subscription ${subscription.id} updated`)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Update subscription status to canceled
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }

    console.log(`Subscription ${subscription.id} canceled`)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
    throw error
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      // Update subscription payment status
      const { error } = await supabase
        .from('subscription_payments')
        .upsert({
          subscription_id: invoice.subscription as string,
          invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'paid',
          paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error recording subscription payment:', error)
        throw error
      }

      console.log(`Invoice payment succeeded: ${invoice.id}`)
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
    throw error
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      // Record failed payment
      const { error } = await supabase
        .from('subscription_payments')
        .upsert({
          subscription_id: invoice.subscription as string,
          invoice_id: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error recording failed payment:', error)
        throw error
      }

      console.log(`Invoice payment failed: ${invoice.id}`)
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
    throw error
  }
}

async function handleSubscriptionPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { metadata } = paymentIntent
    
    if (metadata.user_id && metadata.subscription_type) {
      // Update user's subscription status
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_type: metadata.subscription_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.user_id)

      if (error) {
        console.error('Error updating user subscription:', error)
        throw error
      }

      console.log(`User ${metadata.user_id} subscription activated`)
    }
  } catch (error) {
    console.error('Error handling subscription payment:', error)
    throw error
  }
}