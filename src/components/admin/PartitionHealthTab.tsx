import { useEffect, useState } from "react";
import { Database, AlertTriangle, CheckCircle, RefreshCw, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface PartitionRow {
  partition: string;
  size_bytes: number;
  size_pretty: string;
  live_rows: number;
  is_default: boolean;
}

interface HealthData {
  checked_at: string;
  partition_count: number;
  total_rows: number;
  default_rows: number;
  drift_detected: boolean;
  partitions: PartitionRow[];
}

interface SnapshotRow {
  id: string;
  captured_at: string;
  total_rows: number;
  total_size_mb: number;
  default_rows: number;
  partition_count: number;
  drift_detected: boolean;
}

const PartitionHealthTab = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [history, setHistory] = useState<SnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchHealth(), fetchHistory()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    const { data, error } = await supabase.rpc("get_partition_health");
    if (error) {
      console.error("get_partition_health error:", error);
      toast.error("Failed to load partition health");
      return;
    }
    setHealth(data as unknown as HealthData);
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("partition_health_snapshots")
      .select(
        "id, captured_at, total_rows, total_size_mb, default_rows, partition_count, drift_detected",
      )
      .order("captured_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("partition_health_snapshots error:", error);
      return;
    }
    setHistory((data as SnapshotRow[]) || []);
  };

  const handleCapture = async () => {
    setCapturing(true);
    try {
      const { data, error } = await supabase.rpc("capture_partition_health");
      if (error) {
        toast.error(`Capture failed: ${error.message}`);
        return;
      }
      const result = data as { drift_detected: boolean; default_rows: number; partition_count: number };
      if (result.drift_detected) {
        toast.error(`Drift detected! ${result.default_rows} rows in default partition`);
      } else {
        toast.success(`Snapshot saved — ${result.partition_count} partitions healthy`);
      }
      await fetchAll();
    } finally {
      setCapturing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sorted = health
    ? [...health.partitions].sort((a, b) => b.live_rows - a.live_rows)
    : [];

  const maxRows = sorted[0]?.live_rows || 1;

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div className="bg-card rounded-2xl border border-border/10 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                health?.drift_detected ? "bg-destructive/10" : "bg-green-500/10"
              }`}
            >
              {health?.drift_detected ? (
                <AlertTriangle className="h-[18px] w-[18px] text-destructive" />
              ) : (
                <CheckCircle className="h-[18px] w-[18px] text-green-500" />
              )}
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground text-sm">
                Messages Partition Health
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {health
                  ? `Checked ${format(new Date(health.checked_at), "MMM d, HH:mm")}`
                  : "—"}
              </p>
            </div>
          </div>
          <button
            onClick={handleCapture}
            disabled={capturing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${capturing ? "animate-spin" : ""}`} />
            {capturing ? "Capturing…" : "Capture & Provision"}
          </button>
        </div>

        {health?.drift_detected && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-destructive">
              Partition drift detected
            </p>
            <p className="text-[11px] text-destructive/80 mt-0.5">
              {health.default_rows.toLocaleString()} rows are falling into the default
              catch-all partition. Click "Capture & Provision" to auto-create missing
              partitions.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Partitions</p>
            <p className="font-heading font-bold text-foreground text-lg">
              {health?.partition_count ?? "—"}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Total rows</p>
            <p className="font-heading font-bold text-foreground text-lg">
              {health ? health.total_rows.toLocaleString() : "—"}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Default rows</p>
            <p
              className={`font-heading font-bold text-lg ${
                (health?.default_rows ?? 0) > 0 ? "text-destructive" : "text-green-500"
              }`}
            >
              {health ? health.default_rows.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Partition list */}
      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
        <div className="p-4 border-b border-border/10 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading font-bold text-foreground text-sm">
            Partitions ({sorted.length})
          </h3>
        </div>
        {sorted.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">
            No partition data available
          </p>
        ) : (
          <div className="divide-y divide-border/10">
            {sorted.map((p) => {
              const pct = maxRows > 0 ? (p.live_rows / maxRows) * 100 : 0;
              return (
                <div key={p.partition} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-medium ${
                          p.is_default ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {p.partition}
                      </span>
                      {p.is_default && (
                        <span className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[9px] font-semibold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{p.live_rows.toLocaleString()} rows</span>
                      <span>{formatBytes(p.size_bytes)}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        p.is_default ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{ width: `${Math.max(pct, p.live_rows > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Snapshot history */}
      {history.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
          <div className="p-4 border-b border-border/10">
            <h3 className="font-heading font-bold text-foreground text-sm">
              Recent Snapshots
            </h3>
          </div>
          <div className="divide-y divide-border/10">
            {history.map((snap) => (
              <div key={snap.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    snap.drift_detected ? "bg-destructive" : "bg-green-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">
                    {format(new Date(snap.captured_at), "MMM d, HH:mm")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {snap.partition_count} partitions · {snap.total_rows.toLocaleString()} rows ·{" "}
                    {snap.total_size_mb.toFixed(2)} MB
                  </p>
                </div>
                {snap.drift_detected && (
                  <span className="text-[10px] text-destructive font-semibold flex-shrink-0">
                    {snap.default_rows.toLocaleString()} in default
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartitionHealthTab;
