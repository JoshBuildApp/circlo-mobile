-- Add coach response tracking tables and functions
CREATE TABLE IF NOT EXISTS coach_response_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    avg_response_time_minutes INTEGER DEFAULT NULL,
    response_rate_percentage DECIMAL(5,2) DEFAULT NULL,
    total_conversations INTEGER DEFAULT 0,
    responded_conversations INTEGER DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coach_id)
);

CREATE TABLE IF NOT EXISTS message_response_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_user_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
    first_coach_response_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    response_time_minutes INTEGER DEFAULT NULL,
    has_responded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coach_response_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_response_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view coach response metrics" ON coach_response_metrics
    FOR SELECT USING (true);

CREATE POLICY "Coaches can view their response metrics" ON coach_response_metrics
    FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "System can manage response tracking" ON message_response_tracking
    FOR ALL USING (true);

-- Function to update response metrics
CREATE OR REPLACE FUNCTION update_coach_response_metrics()
RETURNS void AS $$
BEGIN
    -- Update coach response metrics based on tracking data
    INSERT INTO coach_response_metrics (coach_id, avg_response_time_minutes, response_rate_percentage, total_conversations, responded_conversations, last_updated_at)
    SELECT 
        coach_id,
        ROUND(AVG(response_time_minutes))::INTEGER as avg_response_time_minutes,
        ROUND((COUNT(*) FILTER (WHERE has_responded = true) * 100.0 / COUNT(*)), 2) as response_rate_percentage,
        COUNT(*) as total_conversations,
        COUNT(*) FILTER (WHERE has_responded = true) as responded_conversations,
        NOW() as last_updated_at
    FROM message_response_tracking
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY coach_id
    ON CONFLICT (coach_id) 
    DO UPDATE SET
        avg_response_time_minutes = EXCLUDED.avg_response_time_minutes,
        response_rate_percentage = EXCLUDED.response_rate_percentage,
        total_conversations = EXCLUDED.total_conversations,
        responded_conversations = EXCLUDED.responded_conversations,
        last_updated_at = EXCLUDED.last_updated_at;
END;
$$ LANGUAGE plpgsql;

-- Function to track message responses
CREATE OR REPLACE FUNCTION track_message_response()
RETURNS TRIGGER AS $$
DECLARE
    coach_user_id UUID;
    other_user_id UUID;
    tracking_record RECORD;
BEGIN
    -- Determine who is the coach and who is the user
    SELECT 
        CASE 
            WHEN p1.role = 'coach' THEN NEW.sender_id
            WHEN p2.role = 'coach' THEN NEW.receiver_id
            ELSE NULL
        END as coach_id,
        CASE 
            WHEN p1.role = 'coach' THEN NEW.receiver_id
            WHEN p2.role = 'coach' THEN NEW.sender_id
            ELSE NULL
        END as user_id
    INTO coach_user_id, other_user_id
    FROM profiles p1, profiles p2
    WHERE p1.id = NEW.sender_id AND p2.id = NEW.receiver_id;

    -- Only track if one participant is a coach
    IF coach_user_id IS NOT NULL AND other_user_id IS NOT NULL THEN
        -- Check if tracking record exists for this conversation
        SELECT * INTO tracking_record
        FROM message_response_tracking
        WHERE conversation_id = NEW.conversation_id
        AND coach_id = coach_user_id
        AND user_id = other_user_id;

        IF tracking_record IS NULL THEN
            -- First message from user to coach
            IF NEW.sender_id = other_user_id THEN
                INSERT INTO message_response_tracking (
                    conversation_id,
                    coach_id,
                    user_id,
                    first_user_message_at
                ) VALUES (
                    NEW.conversation_id,
                    coach_user_id,
                    other_user_id,
                    NEW.created_at
                );
            END IF;
        ELSE
            -- Update response tracking if coach responds
            IF NEW.sender_id = coach_user_id AND NOT tracking_record.has_responded THEN
                UPDATE message_response_tracking
                SET 
                    first_coach_response_at = NEW.created_at,
                    response_time_minutes = EXTRACT(EPOCH FROM (NEW.created_at - tracking_record.first_user_message_at)) / 60,
                    has_responded = true,
                    updated_at = NOW()
                WHERE id = tracking_record.id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message response tracking
CREATE TRIGGER message_response_tracking_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION track_message_response();