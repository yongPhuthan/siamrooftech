"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminAuthGate from "../../../components/admin/AdminAuthGate";
import { adminFetch } from "../../../lib/admin-fetch";

// --- Types mirroring workers/line-chat-history/src/leads-api.ts serializeLead() ---

type LeadStatus = "new" | "contacted" | "qualified" | "quoted" | "won" | "lost" | "disqualified";
type AdsState = "not_sent" | "sent" | "restated" | "failed" | "skipped";

interface Lead {
  lead_id: string;
  ref_code: string;
  created_at: string;
  attribution: {
    gclid: string | null;
    gbraid: string | null;
    wbraid: string | null;
    lead_persona: string | null;
    lead_quality_score: number | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    srt_keyword: string | null;
    landing_page: string | null;
  };
  match: {
    conversation_id: string | null;
    matched_at: string | null;
    match_method: string | null;
  };
  status: LeadStatus;
  status_updated_at: string | null;
  value: {
    persona_value: number | null;
    estimated_value: number | null;
    actual_value: number | null;
    currency: string;
  };
  ads_sync: {
    state: AdsState;
    last_value: number | null;
    last_sent_at: string | null;
    last_error: string | null;
  };
  notes: string | null;
}

interface LeadEvent {
  at: string;
  actor: string;
  kind: string;
  from_value: string | null;
  to_value: string | null;
  reason: string | null;
}

interface TranscriptMessage {
  message_id: string;
  direction: "inbound" | "outbound";
  type: string;
  text: string | null;
  occurred_at_local: string;
}

interface LeadDetail extends Lead {
  events: LeadEvent[];
  transcript: TranscriptMessage[] | null;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "ใหม่",
  contacted: "ติดต่อแล้ว",
  qualified: "ผ่านคุณสมบัติ",
  quoted: "เสนอราคาแล้ว",
  won: "ปิดงานได้",
  lost: "ปิดงานไม่ได้",
  disqualified: "ไม่ผ่านคุณสมบัติ",
};

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: "bg-gray-100 text-gray-700",
  contacted: "bg-blue-100 text-blue-800",
  qualified: "bg-indigo-100 text-indigo-800",
  quoted: "bg-purple-100 text-purple-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-700",
  disqualified: "bg-gray-200 text-gray-600",
};

const ADS_STATE_LABELS: Record<AdsState, string> = {
  not_sent: "ยังไม่ส่ง",
  sent: "ส่งแล้ว",
  restated: "อัปเดตค่าแล้ว",
  failed: "ส่งไม่สำเร็จ",
  skipped: "ข้าม (ไม่มี gclid)",
};

const ADS_STATE_BADGE: Record<AdsState, string> = {
  not_sent: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  restated: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-gray-100 text-gray-500",
};

const PERSONA_LABELS: Record<string, string> = {
  homeowner: "เจ้าของบ้าน",
  procurement: "ฝ่ายจัดซื้อ",
  contractor: "ผู้รับเหมา/ช่าง",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function isoDateNDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

type MatchFilter = "all" | "matched" | "unmatched";
type StatusFilter = "all" | LeadStatus;

export default function LeadsAdminClient() {
  return (
    <AdminAuthGate>
      <AdminLeadsContent />
    </AdminAuthGate>
  );
}

function AdminLeadsContent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [fromDate, setFromDate] = useState(isoDateNDaysAgo(14));
  const [toDate, setToDate] = useState(isoDateNDaysAgo(-1));
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: `${fromDate}T00:00:00+07:00`,
        to: `${toDate}T00:00:00+07:00`,
        timezone: "Asia/Bangkok",
        limit: "200",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (matchFilter !== "all") params.set("match", matchFilter);

      const res = await adminFetch(`/api/admin/lead-proxy/leads?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setLeads(data.leads || []);
    } catch (err) {
      console.error("failed to load leads", err);
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, statusFilter, matchFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    for (const lead of leads) counts[lead.status] = (counts[lead.status] || 0) + 1;
    return counts;
  }, [leads]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            ผูก LINE conversation กับคลิกโฆษณา ติดตามสถานะ และปรับ conversion value กลับ Google Ads
          </p>
        </div>
      </div>

      {/* Date range */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          จาก
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          ถึง
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
        </label>
        <select
          value={matchFilter}
          onChange={(e) => setMatchFilter(e.target.value as MatchFilter)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">ทุกสถานะการจับคู่</option>
          <option value="matched">จับคู่แล้ว</option>
          <option value="unmatched">ยังไม่จับคู่</option>
        </select>
        <button
          onClick={fetchLeads}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          รีเฟรช
        </button>
      </div>

      {/* Status tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-x-6">
          {(["all", "new", "contacted", "qualified", "quoted", "won", "lost", "disqualified"] as StatusFilter[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  statusFilter === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab === "all" ? "ทั้งหมด" : STATUS_LABELS[tab]}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    statusFilter === tab ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {statusCounts[tab] || 0}
                </span>
              </button>
            ),
          )}
        </nav>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      ) : leads.length === 0 ? (
        <div className="py-12 text-center">
          <h3 className="text-sm font-medium text-gray-900">ไม่มี lead ในช่วงเวลานี้</h3>
        </div>
      ) : (
        <LeadsTable leads={leads} onSelect={setSelectedLeadId} />
      )}

      {selectedLeadId && (
        <LeadDetailPanel
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onChanged={fetchLeads}
        />
      )}
    </div>
  );
}

function LeadsTable({ leads, onSelect }: { leads: Lead[]; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Ref", "เมื่อ", "Persona", "gclid", "จับคู่แชต", "สถานะ", "มูลค่า", "Ads Sync"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {leads.map((lead) => (
              <tr
                key={lead.lead_id}
                onClick={() => onSelect(lead.lead_id)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-700">{lead.ref_code}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {formatDateTime(lead.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {lead.attribution.lead_persona ? PERSONA_LABELS[lead.attribution.lead_persona] : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      lead.attribution.gclid ? "bg-green-500" : "bg-gray-300"
                    }`}
                    title={lead.attribution.gclid || "ไม่มี gclid (organic)"}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {lead.match.conversation_id ? (
                    <span className="text-green-700">
                      ✓ {lead.match.match_method === "manual" ? "(manual)" : ""}
                    </span>
                  ) : (
                    <span className="text-amber-600">ยังไม่จับคู่</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {lead.value.actual_value ?? lead.value.estimated_value ?? lead.value.persona_value ?? "-"}{" "}
                  {(lead.value.actual_value || lead.value.estimated_value || lead.value.persona_value) &&
                    lead.value.currency}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${ADS_STATE_BADGE[lead.ads_sync.state]}`}>
                    {ADS_STATE_LABELS[lead.ads_sync.state]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadDetailPanel({
  leadId,
  onClose,
  onChanged,
}: {
  leadId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusDraft, setStatusDraft] = useState<LeadStatus>("new");
  const [valueDraft, setValueDraft] = useState("");
  const [reasonDraft, setReasonDraft] = useState("");
  const [conversationIdDraft, setConversationIdDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(
        `/api/admin/lead-proxy/leads/${encodeURIComponent(leadId)}?with_transcript=1&timezone=Asia%2FBangkok`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setDetail(data);
      setStatusDraft(data.status);
    } catch (err) {
      console.error("failed to load lead detail", err);
      setActionError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusSave = async () => {
    setSaving(true);
    setActionError(null);
    try {
      const res = await adminFetch(`/api/admin/lead-proxy/leads/${encodeURIComponent(leadId)}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: statusDraft, reason: reasonDraft || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await fetchDetail();
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleValueSave = async () => {
    const value = Number(valueDraft);
    if (!Number.isFinite(value) || value <= 0) {
      setActionError("มูลค่าต้องมากกว่า 0 (การส่งค่า 0 กลับ Google Ads จะปิด conversion นั้นถาวร)");
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const res = await adminFetch(`/api/admin/lead-proxy/leads/${encodeURIComponent(leadId)}/value`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value, field: "actual_value", reason: reasonDraft || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await fetchDetail();
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleManualMatch = async () => {
    if (!conversationIdDraft.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await adminFetch(`/api/admin/lead-proxy/leads/${encodeURIComponent(leadId)}/match`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationIdDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await fetchDetail();
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "จับคู่ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">รายละเอียด Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {loading || !detail ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">Attribution</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-gray-500">Ref code</dt>
                <dd className="font-mono">{detail.ref_code}</dd>
                <dt className="text-gray-500">gclid</dt>
                <dd className="break-all font-mono text-xs">{detail.attribution.gclid || "-"}</dd>
                <dt className="text-gray-500">Persona</dt>
                <dd>{detail.attribution.lead_persona ? PERSONA_LABELS[detail.attribution.lead_persona] : "-"}</dd>
                <dt className="text-gray-500">Campaign</dt>
                <dd>{detail.attribution.utm_campaign || detail.attribution.srt_keyword || "-"}</dd>
                <dt className="text-gray-500">Landing page</dt>
                <dd className="break-all text-xs">{detail.attribution.landing_page || "-"}</dd>
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">การจับคู่แชต LINE</h3>
              {detail.match.conversation_id ? (
                <p className="text-sm text-gray-700">
                  จับคู่แล้วกับ <span className="font-mono text-xs">{detail.match.conversation_id}</span> (
                  {detail.match.match_method}) เมื่อ {formatDateTime(detail.match.matched_at)}
                </p>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="conversation_id เช่น user:U4af49..."
                    value={conversationIdDraft}
                    onChange={(e) => setConversationIdDraft(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={handleManualMatch}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    จับคู่
                  </button>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">สถานะ</h3>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as LeadStatus)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStatusSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  บันทึกสถานะ
                </button>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">มูลค่างาน (THB)</h3>
              <p className="mb-2 text-xs text-gray-500">
                ค่าตั้งต้นจาก persona: {detail.value.persona_value ?? "-"} · ประเมิน:{" "}
                {detail.value.estimated_value ?? "-"} · จริง: {detail.value.actual_value ?? "-"}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="มูลค่างานจริง เช่น 45000"
                  value={valueDraft}
                  onChange={(e) => setValueDraft(e.target.value)}
                  className="w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
                <input
                  type="text"
                  placeholder="เหตุผล (ไม่บังคับ)"
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
                <button
                  onClick={handleValueSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  ปรับ value
                </button>
              </div>
              {detail.ads_sync.state !== "not_sent" && (
                <p className="mt-2 text-xs text-gray-500">
                  ส่งไปยัง Google Ads ล่าสุด: {ADS_STATE_LABELS[detail.ads_sync.state]}{" "}
                  {detail.ads_sync.last_sent_at && `เมื่อ ${formatDateTime(detail.ads_sync.last_sent_at)}`}
                  {detail.ads_sync.last_error && (
                    <span className="text-red-600"> — {detail.ads_sync.last_error}</span>
                  )}
                </p>
              )}
            </section>

            {detail.transcript && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-500">บทสนทนา LINE</h3>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-3">
                  {detail.transcript.length === 0 ? (
                    <p className="text-sm text-gray-400">ยังไม่มีข้อความ</p>
                  ) : (
                    detail.transcript.map((msg) => (
                      <div
                        key={msg.message_id}
                        className={`text-sm ${msg.direction === "inbound" ? "text-gray-800" : "text-blue-700"}`}
                      >
                        <span className="mr-2 text-xs text-gray-400">{msg.occurred_at_local}</span>
                        {msg.text || `[${msg.type}]`}
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">ประวัติการเปลี่ยนแปลง</h3>
              <ul className="space-y-1 text-xs text-gray-500">
                {detail.events.map((event, idx) => (
                  <li key={idx}>
                    {formatDateTime(event.at)} · {event.actor} · {event.kind}
                    {event.to_value ? ` → ${event.to_value}` : ""}
                    {event.reason ? ` (${event.reason})` : ""}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
