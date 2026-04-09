-- Add payment-related fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';

-- Add index for payment lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);