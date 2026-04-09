-- Add composite index on agent_activity table for better query performance
-- This index will optimize queries that filter by type and order by created_at

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_activity_type_created_at 
ON agent_activity (type, created_at DESC);

-- Add individual index on created_at for general time-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_activity_created_at 
ON agent_activity (created_at DESC);

-- Add index on agent_id for user-specific activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_activity_agent_id 
ON agent_activity (agent_id);

-- Add composite index for user-specific activity with time ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_activity_agent_id_created_at 
ON agent_activity (agent_id, created_at DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_agent_activity_type_created_at IS 'Optimizes queries filtering by activity type and ordering by creation time';
COMMENT ON INDEX idx_agent_activity_created_at IS 'Optimizes general time-based queries on agent activity';
COMMENT ON INDEX idx_agent_activity_agent_id IS 'Optimizes user-specific activity queries';
COMMENT ON INDEX idx_agent_activity_agent_id_created_at IS 'Optimizes user-specific activity queries with time ordering';