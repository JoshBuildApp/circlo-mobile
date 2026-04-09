/**
 * OpenClaw Task Suggestion Engine
 * Analyzes the current project state and proposes tasks to Guy.
 * Runs 2x daily via cron. Guy approves/rejects in the dashboard.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rsevfeogormnorvcvxio.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM3NDI1MSwiZXhwIjoyMDkwOTUwMjUxfQ.lEsXLw5MIrcbOEhLBQamP7XmUyZNv2-npWrMXnE7tBA'
);

const OPENCLAW_AGENT_ID = '3ea81ac2-e6dd-4c81-b220-cb0bb5c0f012';

interface Suggestion {
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  recommended_model: string;
  model_reason: string;
  assigned_agent: string;
  project: string;
}

async function analyzAndSuggest() {
  console.log('[suggestions] Analyzing project state...');

  // Fetch current state
  const [tasksRes, activityRes, agentsRes] = await Promise.all([
    supabase.from('agent_tasks').select('id,title,priority,status,created_at').neq('status', 'completed').order('created_at'),
    supabase.from('agent_activity').select('type,summary,created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('agents').select('id,name,status,tasks_completed'),
  ]);

  const tasks = tasksRes.data || [];
  const activities = activityRes.data || [];
  const agents = agentsRes.data || [];

  const urgent = tasks.filter(t => t.priority === 'urgent').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const errors = activities.filter(a => a.type === 'error').length;
  const idleAgents = agents.filter(a => a.status === 'online');

  const suggestions: Suggestion[] = [];

  // Check for existing pending suggestions to avoid duplicates
  const { data: existing } = await supabase
    .from('task_suggestions')
    .select('title')
    .eq('status', 'pending');
  const existingTitles = new Set((existing || []).map(s => s.title.toLowerCase()));

  const addSuggestion = (s: Suggestion) => {
    if (!existingTitles.has(s.title.toLowerCase())) {
      suggestions.push(s);
    }
  };

  // 1. Security audit if not done recently
  const lastAudit = activities.find(a => a.summary.includes('security') || a.summary.includes('audit'));
  if (!lastAudit) {
    addSuggestion({
      title: 'Run security audit on all Supabase RLS policies',
      description: 'Verify all tables have proper RLS, check for exposed endpoints, validate storage bucket policies.',
      priority: 'high',
      recommended_model: 'claude-opus-4-5',
      model_reason: 'security complexity',
      assigned_agent: 'Shield',
      project: 'circlo',
    });
  }

  // 2. Build health check
  addSuggestion({
    title: 'Run full build and fix any TypeScript errors',
    description: 'npm run build in both supabase-starter-kit and circlo-hub. Fix all TS errors and warnings.',
    priority: 'medium',
    recommended_model: 'claude-haiku-3-5-20241022',
    model_reason: 'simple build task',
    assigned_agent: 'Pulse',
    project: 'circlo',
  });

  // 3. If there are errors in activity
  if (errors > 0) {
    addSuggestion({
      title: `Fix ${errors} recent errors logged in activity feed`,
      description: `Recent agent activity shows ${errors} errors. Investigate and fix root causes.`,
      priority: 'urgent',
      recommended_model: 'claude-sonnet-4-20250514',
      model_reason: 'debugging requires reasoning',
      assigned_agent: 'Dev',
      project: 'circlo',
    });
  }

  // 4. Performance optimization
  addSuggestion({
    title: 'Optimize Discover page load time',
    description: 'Add lazy loading for coach grid, implement virtualization for long lists, reduce initial bundle.',
    priority: 'medium',
    recommended_model: 'claude-sonnet-4-20250514',
    model_reason: 'performance work',
    assigned_agent: 'Dev',
    project: 'circlo',
  });

  // 5. Mobile UX improvements
  addSuggestion({
    title: 'Improve mobile bottom nav gesture feel',
    description: 'Add haptic feedback hints, ensure 44px touch targets on all nav items, test at 375px.',
    priority: 'low',
    recommended_model: 'claude-haiku-3-5-20241022',
    model_reason: 'simple UI tweak',
    assigned_agent: 'Pixel',
    project: 'circlo',
  });

  // 6. Coach profile completeness
  addSuggestion({
    title: 'Add coach profile completeness score',
    description: 'Show coaches a % score of how complete their profile is. Missing photo = -20%, no bio = -15%, etc. Motivates coaches to fill out profiles.',
    priority: 'medium',
    recommended_model: 'claude-sonnet-4-20250514',
    model_reason: 'feature work',
    assigned_agent: 'Dev',
    project: 'circlo',
  });

  // 7. Empty states
  addSuggestion({
    title: 'Improve empty states on Bookings and Inbox pages',
    description: 'Add friendly illustrations, clear CTAs, and helpful text when no data exists. Currently shows blank screens.',
    priority: 'low',
    recommended_model: 'claude-haiku-3-5-20241022',
    model_reason: 'simple UI work',
    assigned_agent: 'Pixel',
    project: 'circlo',
  });

  // Insert suggestions
  if (suggestions.length > 0) {
    const { error } = await supabase.from('task_suggestions').insert(suggestions);
    if (error) {
      console.error('[suggestions] Insert error:', error.message);
    } else {
      console.log(`[suggestions] ✅ Added ${suggestions.length} new suggestions for Guy to review`);

      // Log to activity
      await supabase.from('agent_activity').insert({
        type: 'info',
        summary: `🧠 OpenClaw suggested ${suggestions.length} new tasks for review in the dashboard`,
        agent_id: OPENCLAW_AGENT_ID,
      });
    }
  } else {
    console.log('[suggestions] No new suggestions to add (all already pending or recently done)');
  }
}

analyzAndSuggest().catch(console.error);
