-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    plan_id TEXT,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    invoice_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription payments" ON subscription_payments
    FOR SELECT USING (
        subscription_id IN (
            SELECT stripe_subscription_id 
            FROM subscriptions 
            WHERE user_id = auth.uid()
        )
    );

-- Add columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_type TEXT;

-- Add columns to bookings table if they don't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';