-- Agent Dashboard Tables
-- Adds task management, activity logging, chat, and status tracking for the Dev agent

-- Agent Tasks (kanban board)
CREATE TABLE agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  priority text CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  status text CHECK (status IN ('pending','in_progress','completed','blocked')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Agent Activity Log (timeline feed)
CREATE TABLE agent_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES agent_tasks(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('commit','file_change','build','task_update','error','chat')),
  summary text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Agent Chat Messages
CREATE TABLE agent_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text NOT NULL DEFAULT 'default',
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_agent_chat_conv ON agent_chat(conversation_id, created_at);

-- Agent Status Snapshots (build, git, server health)
CREATE TABLE agent_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('build','git','server')),
  status text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all agent tables
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

-- Open access policies (private dashboard, single user)
CREATE POLICY "Full access to agent_tasks" ON agent_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access to agent_activity" ON agent_activity FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access to agent_chat" ON agent_chat FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access to agent_status" ON agent_status FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for agent tables
ALTER PUBLICATION supabase_realtime ADD TABLE agent_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_status;
