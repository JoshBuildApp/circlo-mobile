import { useState, useEffect } from "react";
import { CheckCircle, XCircle, MessageCircle, ArrowLeft, FileText, Clock, Shield, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface VerificationRequest {
  id: string;
  coach_id: string;
  coach_name: string;
  coach_image_url: string;
  phone: string;
  sport: string;
  years_experience: number;
  certifications_text: string;
  experience_text: string;
  links: string;
  documents_urls: string[];
  status: string;
  rejection_reason: string;
  admin_notes: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/15 text-yellow-600", icon: <Clock className="h-3 w-3" /> },
  under_review: { label: "Under Review", color: "bg-blue-500/15 text-blue-600", icon: <Shield className="h-3 w-3" /> },
  approved: { label: "Approved", color: "bg-green-500/15 text-green-600", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-600", icon: <XCircle className="h-3 w-3" /> },
  needs_info: { label: "Needs More Info", color: "bg-orange-500/15 text-orange-600", icon: <AlertCircle className="h-3 w-3" /> },
};

const AdminVerificationInbox = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VerificationRequest | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRequests(data as unknown as VerificationRequest[]);
    setLoading(false);
  };

  const filteredRequests = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    // Update request status
    await supabase
      .from("verification_requests")
      .update({ status: "approved", admin_notes: adminNotes })
      .eq("id", selected.id);
    // Set coach as verified
    await supabase
      .from("coach_profiles")
      .update({ is_verified: true })
      .eq("id", selected.coach_id);
    // Send message to coach
    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("user_id")
      .eq("id", selected.coach_id)
      .maybeSingle();
    if (coach) {
      const { data: adminUser } = await supabase.auth.getUser();
      if (adminUser?.user) {
        await supabase.from("messages").insert({
          sender_id: adminUser.user.id,
          receiver_id: coach.user_id,
          content: `Congratulations! Your verification request has been approved. You are now a verified coach on CIRCLO!`,
        });
      }
    }
    toast.success("Coach approved and verified!");
    setSelected(null);
    setAdminNotes("");
    setActionLoading(false);
    fetchRequests();
  };

  const handleReject = async () => {
    if (!selected || !rejectionReason.trim()) return;
    setActionLoading(true);
    await supabase
      .from("verification_requests")
      .update({ status: "rejected", rejection_reason: rejectionReason, admin_notes: adminNotes })
      .eq("id", selected.id);
    // Send message to coach
    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("user_id")
      .eq("id", selected.coach_id)
      .maybeSingle();
    if (coach) {
      const { data: adminUser } = await supabase.auth.getUser();
      if (adminUser?.user) {
        await supabase.from("messages").insert({
          sender_id: adminUser.user.id,
          receiver_id: coach.user_id,
          content: `Your verification request was not approved. Reason: ${rejectionReason}. You can submit a new request after addressing the feedback.`,
        });
      }
    }
    toast("Request rejected");
    setShowRejectModal(false);
    setSelected(null);
    setRejectionReason("");
    setAdminNotes("");
    setActionLoading(false);
    fetchRequests();
  };

  const handleRequestInfo = async () => {
    if (!selected || !infoMessage.trim()) return;
    setActionLoading(true);
    await supabase
      .from("verification_requests")
      .update({ status: "needs_info", admin_notes: adminNotes })
      .eq("id", selected.id);
    // Send message
    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("user_id")
      .eq("id", selected.coach_id)
      .maybeSingle();
    if (coach) {
      const { data: adminUser } = await supabase.auth.getUser();
      if (adminUser?.user) {
        await supabase.from("messages").insert({
          sender_id: adminUser.user.id,
          receiver_id: coach.user_id,
          content: `Regarding your verification request: ${infoMessage}`,
        });
      }
    }
    toast("Info request sent to coach");
    setShowInfoModal(false);
    setSelected(null);
    setInfoMessage("");
    setAdminNotes("");
    setActionLoading(false);
    fetchRequests();
  };

  // Detail view
  if (selected) {
    const statusCfg = STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending;
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to inbox
        </button>

        {/* Header */}
        <div className="bg-card rounded-2xl border border-border/10 p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
              {selected.coach_image_url ? (
                <img src={selected.coach_image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {selected.coach_name?.[0] || "C"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground">{selected.coach_name}</h3>
              <p className="text-xs text-muted-foreground">{selected.sport} • {selected.years_experience} years exp.</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Submitted {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}
              </p>
            </div>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusCfg.color}`}>
              {statusCfg.icon}
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Details sections */}
        <div className="bg-card rounded-2xl border border-border/10 p-5 space-y-4">
          <h4 className="text-sm font-bold text-foreground">Contact</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{selected.phone || "—"}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/10 p-5 space-y-3">
          <h4 className="text-sm font-bold text-foreground">Experience & Qualifications</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{selected.experience_text || "No description provided"}</p>
          {selected.certifications_text && (
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Certifications</p>
              <p className="text-xs text-foreground">{selected.certifications_text}</p>
            </div>
          )}
          {selected.links && (
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Links</p>
              <p className="text-xs text-primary">{selected.links}</p>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-card rounded-2xl border border-border/10 p-5 space-y-3">
          <h4 className="text-sm font-bold text-foreground">Documents ({selected.documents_urls?.length || 0})</h4>
          {(selected.documents_urls || []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No documents uploaded</p>
          ) : (
            <div className="space-y-2">
              {selected.documents_urls.map((url, i) => (
                <div key={i} className="flex items-center gap-3 bg-secondary rounded-xl p-3">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{url.split("/").pop()}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin notes */}
        <div className="bg-card rounded-2xl border border-border/10 p-5 space-y-3">
          <h4 className="text-sm font-bold text-foreground">Admin Notes</h4>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Internal notes (not visible to coach)..."
            className="w-full min-h-[80px] rounded-xl bg-secondary border border-border/10 px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Actions */}
        {selected.status !== "approved" && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex-1 h-11 rounded-xl bg-green-600 text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Approve
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="h-11 px-5 rounded-xl bg-red-500/10 text-red-600 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={() => setShowInfoModal(true)}
              className="h-11 px-5 rounded-xl bg-secondary text-foreground text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              Info
            </button>
          </div>
        )}

        {/* Reject modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
            <div className="bg-background w-full max-w-lg rounded-t-2xl p-5 space-y-3 animate-slide-in-from-bottom">
              <h4 className="text-sm font-bold text-foreground">Rejection Reason</h4>
              <p className="text-xs text-muted-foreground">This will be sent to the coach.</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                className="w-full min-h-[100px] rounded-xl bg-secondary border border-border/10 px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 h-10 rounded-xl bg-secondary text-foreground text-xs font-semibold">
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || actionLoading}
                  className="flex-1 h-10 rounded-xl bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  {actionLoading ? "Sending..." : "Reject & Notify"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request info modal */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
            <div className="bg-background w-full max-w-lg rounded-t-2xl p-5 space-y-3 animate-slide-in-from-bottom">
              <h4 className="text-sm font-bold text-foreground">Request More Information</h4>
              <p className="text-xs text-muted-foreground">Send a message to the coach asking for additional details.</p>
              <textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                placeholder="What additional information do you need?"
                className="w-full min-h-[100px] rounded-xl bg-secondary border border-border/10 px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowInfoModal(false)} className="flex-1 h-10 rounded-xl bg-secondary text-foreground text-xs font-semibold">
                  Cancel
                </button>
                <button
                  onClick={handleRequestInfo}
                  disabled={!infoMessage.trim() || actionLoading}
                  className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                >
                  {actionLoading ? "Sending..." : "Send & Update Status"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inbox list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Verification Inbox</h2>
        <span className="text-xs text-muted-foreground">{requests.filter((r) => r.status === "pending").length} pending</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "under_review", label: "Reviewing" },
          { key: "needs_info", label: "Needs Info" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 h-8 rounded-full text-[11px] font-medium flex-shrink-0 transition-colors ${
              filter === f.key ? "bg-foreground text-background" : "bg-secondary text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No requests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRequests.map((req) => {
            const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            return (
              <button
                key={req.id}
                onClick={() => { setSelected(req); setAdminNotes(req.admin_notes || ""); }}
                className="w-full bg-card rounded-xl border border-border/10 p-4 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors active:scale-[0.99]"
              >
                <div className="h-11 w-11 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {req.coach_image_url ? (
                    <img src={req.coach_image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {req.coach_name?.[0] || "C"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{req.coach_name}</p>
                  <p className="text-[11px] text-muted-foreground">{req.sport} • {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
                </div>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${statusCfg.color}`}>
                  {statusCfg.icon}
                  {statusCfg.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminVerificationInbox;
