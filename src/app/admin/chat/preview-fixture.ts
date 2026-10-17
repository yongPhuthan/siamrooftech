import type { ConversationDetail, ConversationSummary } from './types';

const now = new Date();
const iso = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

export const previewConversations: ConversationSummary[] = [
  { conversation_id: 'preview:somchai', display_name: 'คุณสมชาย', picture_url: null, is_following: true, last_event_at: iso(2), unread_count: 2, latest_message: { id: 'p3', type: 'text', text: 'สนใจกันสาดไฟฟ้าหน้าบ้านครับ', direction: 'inbound', occurred_at: iso(2) }, active_lead: { id: 'lead-preview', ref_code: 'SRT-PREVIEW', status: 'qualified' }, google_health: { state: 'processing', label: 'กำลังประมวลผล' }, attention_reason: null },
  { conversation_id: 'preview:naphat', display_name: 'คุณนภพร', picture_url: null, is_following: true, last_event_at: iso(54), unread_count: 1, latest_message: { id: 'n1', type: 'text', text: 'สนใจติดตั้งที่บ้านค่ะ', direction: 'inbound', occurred_at: iso(54) }, active_lead: { id: 'lead-naphat', ref_code: 'SRT-NAPHAT', status: 'new' }, google_health: { state: 'failed', label: 'ล้มเหลว' }, attention_reason: 'data_manager_failed' },
  { conversation_id: 'preview:wittaya', display_name: 'คุณวิทยา', picture_url: null, is_following: false, last_event_at: iso(1440), unread_count: 0, latest_message: { id: 'w1', type: 'text', text: 'ขอบคุณครับ', direction: 'inbound', occurred_at: iso(1440) }, active_lead: { id: 'lead-wittaya', ref_code: 'SRT-WITTAYA', status: 'contacted' }, google_health: { state: 'skipped', label: 'Organic / Unknown' }, attention_reason: null },
];

export const previewDetail: ConversationDetail = {
  conversation: { conversation_id: 'preview:somchai', display_name: 'คุณสมชาย', picture_url: null, is_following: true, active_lead_id: 'lead-preview', google_health: { state: 'processing', label: 'กำลังประมวลผล' } },
  receive_cursor: null,
  messages: [
    { message_id: 'p1', direction: 'inbound', type: 'text', text: 'สวัสดีครับ สนใจกันสาดไฟฟ้าหน้าบ้านครับ\nอยากทราบราคาและรายละเอียด', occurred_at: iso(16), occurred_at_local: iso(16), is_unsent: false, attachment: null },
    { message_id: 'p2', direction: 'outbound', type: 'text', text: 'สวัสดีครับคุณสมชาย ยินดีให้ข้อมูลครับ ไม่ทราบขนาดพื้นที่คร่าว ๆ เท่าไหร่ครับ', occurred_at: iso(13), occurred_at_local: iso(13), is_unsent: false, attachment: null },
    { message_id: 'p3', direction: 'inbound', type: 'text', text: 'ขนาดประมาณ 5 เมตรครับ อยากได้สีเทาเข้ม', occurred_at: iso(8), occurred_at_local: iso(8), is_unsent: false, attachment: null },
    { message_id: 'p4', direction: 'outbound', type: 'text', text: 'สำหรับขนาด 5 เมตร ราคาพร้อมติดตั้งประมาณ ฿45,000 ครับ รวมมอเตอร์และรับประกัน 2 ปี', occurred_at: iso(4), occurred_at_local: iso(4), is_unsent: false, attachment: null },
  ],
  profile: {
    leads: [{ lead_id: 'lead-preview', ref_code: 'SRT-PREVIEW', created_at: iso(30), status: 'qualified', status_updated_at: iso(10), attribution: { gclid: 'EAIaIQobChMI7example9f2Q', gbraid: null, wbraid: null, utm_campaign: 'Search - กันสาดไฟฟ้า', srt_campaignid: '123456', srt_adgroupid: '654321', srt_keyword: 'กันสาดไฟฟ้า', srt_matchtype: 'exact', srt_device: 'mobile', landing_page: '/services/electric-retractable-awning' }, match: { conversation_id: 'preview:somchai', matched_at: iso(28), match_method: 'ref_code' }, value: { persona_value: 100, estimated_value: 45000, actual_value: null, currency: 'THB' }, ads_sync: { state: 'processing', last_value: null, last_sent_at: null, last_error: null }, notes: 'สนใจกันสาดไฟฟ้าขนาด 5 เมตร' }],
    unmatched_candidates: [],
    events: [{ id: 1, lead_id: 'lead-preview', at: iso(28), kind: 'match', from_value: null, to_value: 'preview:somchai' }, { id: 2, lead_id: 'lead-preview', at: iso(10), kind: 'status_change', from_value: 'contacted', to_value: 'qualified' }],
    ads_jobs: [{ job_id: 'job-preview', lead_id: 'lead-preview', state: 'processing', google_request_id: 'req-preview-01', conversion_value: 45000, currency: 'THB', last_checked_at: iso(3), request_payload: { destinations: [{ productDestinationId: '7751515179' }] }, diagnostics: { requestStatusPerDestination: [{ requestStatus: 'PROCESSING' }] } }],
    ads_attempts: [],
  },
};
