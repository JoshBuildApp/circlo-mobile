import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command, CheckSquare, Plug, StickyNote, Plus, Trash2,
  CheckCircle2, Circle, Clock, AlertCircle, XCircle,
  ChevronDown, ChevronUp, ExternalLink, Copy, Eye, EyeOff,
  RefreshCw, Zap, Database, Github, MessageCircle, Mail,
  Globe, CreditCard, BookOpen, Layers, Star, MoreHorizontal,
  Tag, Calendar, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "missions" | "todos" | "integrations" | "notes";

interface AgentTask {
  id: string;
  description: string;
  status: string;
  created_at: string;
}

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  created_at: string;
}

interface TodoList {
  id: string;
  name: string;
  items: TodoItem[];
}

interface Integration {
  id: string;
  name: string;
  category: string;
  status: "connected" | "disconnected" | "pending";
  url?: string;
  description: string;
  icon: string;
  color: string;
  notes: string;
  showSecret?: boolean;
  secret?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updated_at: string;
}

// ─── Local Storage Helpers ───────────────────────────────────────────────────

const LS_TODOS = "circlo_control_todos";
const LS_INTEGRATIONS = "circlo_control_integrations";
const LS_NOTES = "circlo_control_notes";

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Default Integrations ────────────────────────────────────────────────────

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    id: "supabase",
    name: "Supabase",
    category: "Database",
    status: "connected",
    url: "https://supabase.com/dashboard/project/rsevfeogormnorvcvxio",
    description: "PostgreSQL database, auth, storage, edge functions",
    icon: "🗄️",
    color: "from-emerald-500/20 to-emerald-600/5",
    notes: "Project: rsevfeogormnorvcvxio\nRegion: eu-central-1",
    showSecret: false,
  },
  {
    id: "github",
    name: "GitHub",
    category: "Code",
    status: "connected",
    url: "https://github.com",
    description: "Source control — supabase-starter-kit repo",
    icon: "🐙",
    color: "from-slate-500/20 to-slate-600/5",
    notes: "Branch: main\nAgents push to: agents branch",
    showSecret: false,
  },
  {
    id: "telegram",
    name: "Telegram",
    category: "Notifications",
    status: "connected",
    description: "Bot notifications for agent updates and alerts",
    icon: "✈️",
    color: "from-blue-500/20 to-blue-600/5",
    notes: "Bot: @CircloAgentBot\nChat ID: 1261317567",
    showSecret: false,
  },
  {
    id: "notion",
    name: "Notion",
    category: "Productivity",
    status: "pending",
    url: "https://notion.so",
    description: "Docs, roadmap, knowledge base",
    icon: "📄",
    color: "from-gray-500/20 to-gray-600/5",
    notes: "Not yet fully integrated. Use this Control Center instead.",
    showSecret: false,
  },
  {
    id: "resend",
    name: "Resend",
    category: "Email",
    status: "connected",
    url: "https://resend.com",
    description: "Transactional email — domain: circloclub.com",
    icon: "📧",
    color: "from-orange-500/20 to-orange-600/5",
    notes: "Domain: circloclub.com (DNS pending propagation)\nFrom: hello@circloclub.com",
    showSecret: false,
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Payments",
    status: "pending",
    url: "https://dashboard.stripe.com",
    description: "Payments and payouts for coaches",
    icon: "💳",
    color: "from-violet-500/20 to-violet-600/5",
    notes: "Stripe Connect setup pending for coach payouts",
    showSecret: false,
  },
  {
    id: "lovable",
    name: "Lovable (old)",
    category: "Platform",
    status: "disconnected",
    url: "https://circlo-agent-core.lovable.app",
    description: "Original Lovable build — migrated to supabase-starter-kit",
    icon: "💜",
    color: "from-pink-500/20 to-pink-600/5",
    notes: "Legacy project. DB was merged. Using supabase-starter-kit now.",
    showSecret: false,
  },
  {
    id: "claude",
    name: "Claude / OpenClaw",
    category: "AI",
    status: "connected",
    description: "AI agent orchestrator — runs overnight build missions",
    icon: "🤖",
    color: "from-amber-500/20 to-amber-600/5",
    notes: "Orchestrator: scripts/openclaw-orchestrator.sh\nAgent tasks: agent_tasks table (project=circlo)",
    showSecret: false,
  },
];

// ─── Status Badge ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    completed: { label: "Done", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    done: { label: "Done", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    in_progress: { label: "In Progress", class: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} /> },
    pending: { label: "Pending", class: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: <Circle className="h-3 w-3" /> },
    failed: { label: "Failed", class: "bg-red-500/15 text-red-400 border-red-500/20", icon: <XCircle className="h-3 w-3" /> },
    connected: { label: "Connected", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    disconnected: { label: "Disconnected", class: "bg-red-500/15 text-red-400 border-red-500/20", icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] ?? { label: status, class: "bg-muted text-muted-foreground border-border", icon: <Circle className="h-3 w-3" /> };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border", s.class)}>
      {s.icon} {s.label}
    </span>
  );
};

// ─── Missions Tab ────────────────────────────────────────────────────────────

const MissionsTab = () => {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("agent_tasks")
      .select("id, description, status, created_at")
      .eq("project", "circlo")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setTasks(data as AgentTask[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const counts = {
    all: tasks.length,
    completed: tasks.filter(t => t.status === "completed" || t.status === "done").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    pending: tasks.filter(t => t.status === "pending").length,
    failed: tasks.filter(t => t.status === "failed").length,
  };

  const filters = [
    { key: "all", label: "All", count: counts.all },
    { key: "in_progress", label: "Running", count: counts.in_progress },
    { key: "pending", label: "Queued", count: counts.pending },
    { key: "completed", label: "Done", count: counts.completed },
    { key: "failed", label: "Failed", count: counts.failed },
  ];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all, color: "text-foreground" },
          { label: "Done", value: counts.completed, color: "text-emerald-400" },
          { label: "Running", value: counts.in_progress, color: "text-blue-400" },
          { label: "Queued", value: counts.pending, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/50 rounded-xl p-3">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter chips + refresh */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === f.key
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border/50 hover:border-primary/20"
            )}
          >
            {f.label} {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-all"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-card border border-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No missions found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div key={task.id} className="bg-card border border-border/40 rounded-xl overflow-hidden hover:border-primary/20 transition-all">
              <button
                className="w-full flex items-start gap-3 p-4 text-left"
                onClick={() => setExpanded(expanded === task.id ? null : task.id)}
              >
                <div className="mt-0.5 shrink-0">
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-sm text-foreground flex-1 line-clamp-2 leading-snug">{task.description}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(task.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {expanded === task.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              <AnimatePresence>
                {expanded === task.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-border/30">
                      <p className="text-sm text-muted-foreground leading-relaxed mt-3">{task.description}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-2">
                        Created: {new Date(task.created_at).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Todos Tab ───────────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  high: "text-red-400 border-red-400/30 bg-red-500/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-500/10",
  low: "text-slate-400 border-slate-400/30 bg-slate-500/10",
};

const DEFAULT_LISTS: TodoList[] = [
  { id: "today", name: "Today", items: [] },
  { id: "week", name: "This Week", items: [] },
  { id: "backlog", name: "Backlog", items: [] },
];

const TodosTab = () => {
  const [lists, setLists] = useState<TodoList[]>(() =>
    loadLS(LS_TODOS, DEFAULT_LISTS)
  );
  const [newTexts, setNewTexts] = useState<Record<string, string>>({});
  const [newListName, setNewListName] = useState("");
  const [addingList, setAddingList] = useState(false);

  const persist = (updated: TodoList[]) => {
    setLists(updated);
    saveLS(LS_TODOS, updated);
  };

  const addItem = (listId: string) => {
    const text = newTexts[listId]?.trim();
    if (!text) return;
    const item: TodoItem = {
      id: crypto.randomUUID(),
      text,
      done: false,
      priority: "medium",
      created_at: new Date().toISOString(),
    };
    persist(lists.map(l => l.id === listId ? { ...l, items: [...l.items, item] } : l));
    setNewTexts(t => ({ ...t, [listId]: "" }));
  };

  const toggleItem = (listId: string, itemId: string) => {
    persist(lists.map(l =>
      l.id === listId
        ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) }
        : l
    ));
  };

  const deleteItem = (listId: string, itemId: string) => {
    persist(lists.map(l =>
      l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l
    ));
  };

  const cyclePriority = (listId: string, itemId: string) => {
    const order: TodoItem["priority"][] = ["low", "medium", "high"];
    persist(lists.map(l =>
      l.id === listId
        ? {
            ...l,
            items: l.items.map(i =>
              i.id === itemId
                ? { ...i, priority: order[(order.indexOf(i.priority) + 1) % 3] }
                : i
            ),
          }
        : l
    ));
  };

  const addList = () => {
    if (!newListName.trim()) return;
    const newList: TodoList = { id: crypto.randomUUID(), name: newListName.trim(), items: [] };
    persist([...lists, newList]);
    setNewListName("");
    setAddingList(false);
  };

  const deleteList = (listId: string) => {
    if (["today", "week", "backlog"].includes(listId)) return;
    persist(lists.filter(l => l.id !== listId));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map((list) => {
          const done = list.items.filter(i => i.done).length;
          return (
            <div key={list.id} className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
              {/* List header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-foreground">{list.name}</h3>
                  <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {done}/{list.items.length}
                  </span>
                </div>
                {!["today", "week", "backlog"].includes(list.id) && (
                  <button onClick={() => deleteList(list.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {list.items.length > 0 && (
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(done / list.items.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Items */}
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {list.items.map(item => (
                  <div key={item.id} className="flex items-start gap-2 group">
                    <button
                      onClick={() => toggleItem(list.id, item.id)}
                      className="mt-0.5 shrink-0 transition-colors"
                    >
                      {item.done
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        : <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      }
                    </button>
                    <span
                      className={cn("text-sm flex-1 leading-snug", item.done ? "line-through text-muted-foreground/50" : "text-foreground")}
                    >
                      {item.text}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => cyclePriority(list.id, item.id)}
                        className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0", PRIORITY_COLORS[item.priority])}
                      >
                        {item.priority[0]}
                      </button>
                      <button onClick={() => deleteItem(list.id, item.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add task…"
                  value={newTexts[list.id] ?? ""}
                  onChange={e => setNewTexts(t => ({ ...t, [list.id]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addItem(list.id)}
                  className="flex-1 text-xs bg-muted/50 border border-border/40 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
                />
                <button
                  onClick={() => addItem(list.id)}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add new list */}
        {addingList ? (
          <div className="bg-card border border-primary/30 rounded-2xl p-4 space-y-3">
            <input
              type="text"
              autoFocus
              placeholder="List name…"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addList(); if (e.key === "Escape") setAddingList(false); }}
              className="w-full text-sm bg-muted/50 border border-border/40 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
            />
            <div className="flex gap-2">
              <button onClick={addList} className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold">Create</button>
              <button onClick={() => setAddingList(false)} className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-semibold">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingList(true)}
            className="flex flex-col items-center justify-center gap-2 bg-card border border-dashed border-border/60 rounded-2xl p-4 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all min-h-[120px]"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium">New List</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Integrations Tab ────────────────────────────────────────────────────────

const IntegrationsTab = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(() =>
    loadLS(LS_INTEGRATIONS, DEFAULT_INTEGRATIONS)
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const persist = (updated: Integration[]) => {
    setIntegrations(updated);
    saveLS(LS_INTEGRATIONS, updated);
  };

  const cycleStatus = (id: string) => {
    const order: Integration["status"][] = ["connected", "pending", "disconnected"];
    persist(integrations.map(i =>
      i.id === id ? { ...i, status: order[(order.indexOf(i.status) + 1) % 3] } : i
    ));
  };

  const saveNotes = (id: string) => {
    persist(integrations.map(i => i.id === id ? { ...i, notes: editNotes } : i));
    setEditing(null);
  };

  const toggleSecret = (id: string) => {
    persist(integrations.map(i => i.id === id ? { ...i, showSecret: !i.showSecret } : i));
  };

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div className="space-y-6">
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {integrations.filter(i => i.category === cat).map(intg => (
              <div
                key={intg.id}
                className={cn(
                  "bg-gradient-to-br border border-border/40 rounded-2xl overflow-hidden hover:border-primary/20 transition-all",
                  intg.color
                )}
              >
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{intg.icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{intg.name}</p>
                        <p className="text-[11px] text-muted-foreground">{intg.description}</p>
                      </div>
                    </div>
                    <button onClick={() => cycleStatus(intg.id)} className="shrink-0">
                      <StatusBadge status={intg.status} />
                    </button>
                  </div>

                  {/* Secret */}
                  {intg.secret && (
                    <div className="flex items-center gap-2 bg-black/10 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-muted-foreground flex-1 font-mono">
                        {intg.showSecret ? intg.secret : "••••••••••••"}
                      </span>
                      <button onClick={() => toggleSecret(intg.id)} className="text-muted-foreground hover:text-foreground">
                        {intg.showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => intg.secret && navigator.clipboard.writeText(intg.secret)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Notes */}
                  {editing === intg.id ? (
                    <div className="space-y-2">
                      <textarea
                        autoFocus
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full text-xs bg-background/60 border border-border/60 rounded-lg px-3 py-2 text-foreground resize-none focus:outline-none focus:border-primary/40"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveNotes(intg.id)} className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold">Save</button>
                        <button onClick={() => setEditing(null)} className="flex-1 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-semibold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors bg-black/5 rounded-lg px-3 py-2 whitespace-pre-wrap min-h-[40px]"
                      onClick={() => { setEditing(intg.id); setEditNotes(intg.notes); }}
                    >
                      {intg.notes || <span className="italic opacity-50">Click to add notes…</span>}
                    </div>
                  )}

                  {/* Footer */}
                  {intg.url && (
                    <a
                      href={intg.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Notes Tab ───────────────────────────────────────────────────────────────

const NotesTab = () => {
  const [notes, setNotes] = useState<Note[]>(() => loadLS(LS_NOTES, []));
  const [active, setActive] = useState<string | null>(notes[0]?.id ?? null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [dirty, setDirty] = useState(false);

  const activeNote = notes.find(n => n.id === active);

  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditContent(activeNote.content);
      setEditTags(activeNote.tags.join(", "));
      setDirty(false);
    }
  }, [active]);

  const persist = (updated: Note[]) => {
    setNotes(updated);
    saveLS(LS_NOTES, updated);
  };

  const saveNote = () => {
    if (!active) return;
    persist(notes.map(n =>
      n.id === active
        ? { ...n, title: editTitle, content: editContent, tags: editTags.split(",").map(t => t.trim()).filter(Boolean), updated_at: new Date().toISOString() }
        : n
    ));
    setDirty(false);
  };

  const newNote = () => {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "Untitled",
      content: "",
      tags: [],
      updated_at: new Date().toISOString(),
    };
    persist([note, ...notes]);
    setActive(note.id);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    persist(updated);
    setActive(updated[0]?.id ?? null);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[400px]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 flex flex-col gap-2">
        <button
          onClick={newNote}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New Note
        </button>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {notes.map(note => (
            <button
              key={note.id}
              onClick={() => { if (dirty) saveNote(); setActive(note.id); }}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group",
                active === note.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <p className="font-semibold truncate">{note.title || "Untitled"}</p>
              <p className="text-[10px] opacity-60 mt-0.5 truncate">
                {new Date(note.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      {activeNote ? (
        <div className="flex-1 flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <input
              type="text"
              value={editTitle}
              onChange={e => { setEditTitle(e.target.value); setDirty(true); }}
              placeholder="Title"
              className="flex-1 text-base font-bold bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground/40"
            />
            <div className="flex items-center gap-2">
              {dirty && (
                <button onClick={saveNote} className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold">
                  Save
                </button>
              )}
              <button
                onClick={() => deleteNote(active!)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {/* Tags */}
          <div className="px-4 py-2 border-b border-border/20">
            <input
              type="text"
              value={editTags}
              onChange={e => { setEditTags(e.target.value); setDirty(true); }}
              placeholder="Tags: roadmap, launch, ideas…"
              className="w-full text-xs bg-transparent text-muted-foreground focus:outline-none focus:text-foreground placeholder:text-muted-foreground/40"
            />
          </div>
          {/* Content */}
          <textarea
            value={editContent}
            onChange={e => { setEditContent(e.target.value); setDirty(true); }}
            placeholder="Start writing…"
            className="flex-1 px-4 py-3 text-sm bg-transparent text-foreground resize-none focus:outline-none placeholder:text-muted-foreground/30 leading-relaxed"
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); saveNote(); } }}
          />
          <div className="px-4 py-2 border-t border-border/20 text-[11px] text-muted-foreground/50">
            Last saved {new Date(activeNote.updated_at).toLocaleString()} · Cmd+S to save
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-card border border-dashed border-border/50 rounded-2xl text-muted-foreground">
          <StickyNote className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No notes yet</p>
          <button onClick={newNote} className="mt-3 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
            Create first note
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "missions", label: "Missions", icon: <Zap className="h-4 w-4" />, description: "Agent tasks & roadmap" },
  { id: "todos", label: "To-Do", icon: <CheckSquare className="h-4 w-4" />, description: "Your personal task lists" },
  { id: "integrations", label: "Integrations", icon: <Plug className="h-4 w-4" />, description: "Connected tools & services" },
  { id: "notes", label: "Notes", icon: <StickyNote className="h-4 w-4" />, description: "Knowledge base & docs" },
];

const ControlCenter = () => {
  const [tab, setTab] = useState<Tab>("missions");

  return (
    <div className="w-full min-h-full px-4 md:px-6 lg:px-8 py-6 pb-28">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Command className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Command Center</h1>
            <p className="text-xs text-muted-foreground">Everything about Circlo in one place</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl w-fit mb-6 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              tab === t.id
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "missions" && <MissionsTab />}
          {tab === "todos" && <TodosTab />}
          {tab === "integrations" && <IntegrationsTab />}
          {tab === "notes" && <NotesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ControlCenter;
