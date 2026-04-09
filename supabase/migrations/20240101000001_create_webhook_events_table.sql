-- Create webhook_events table for monitoring
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at DESC);

-- Enable RLS (only admins should access this)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy
CREATE POLICY "Only admins can access webhook events" ON webhook_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );